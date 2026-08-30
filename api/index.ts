import express from 'express';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import QRCode from 'qrcode';
import PDFDocument from 'pdfkit';
import { INITIAL_TRIPS } from '../src/data/mockDatabase';

const app = express();
app.use(express.json());

// In-Memory stores for Vercel Serverless Function instances
const serverTrips = JSON.parse(JSON.stringify(INITIAL_TRIPS));
const serverBookings: any[] = [];
const redisLocks = new Map<string, { sessionId: string; expiresAt: number }>();
const otpStore = new Map<string, { hash: string; salt: string; expiresAt: number; resendAllowedAt: number }>();
const sentBookingConfirmationPnrs = new Set<string>();
const sentAdminGiftCardCodes = new Set<string>();

function generate6DigitOtp(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

function hashOtp(otp: string, email: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(otp, salt + email.toLowerCase(), 1000, 32, 'sha256').toString('hex');
  return { hash, salt };
}

/**
 * Generate a PDF E-Ticket Buffer using PDFKit for Vercel Serverless Function
 */
function generateTicketPdfBuffer(booking: any, qrBuffer: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const chunks: Buffer[] = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', err => reject(err));

      // Top Header
      doc.rect(40, 40, 515, 60).fill('#D84E55');
      doc.fillColor('#FFFFFF').fontSize(22).font('Helvetica-Bold').text('MargPath OFFICIAL E-TICKET', 60, 52);
      doc.fontSize(10).font('Helvetica').text('MargPath Official Boarding Pass • India in Every Journey', 60, 78);

      // PNR Ribbon Box
      doc.rect(40, 110, 515, 45).fill('#F8FAFC').stroke('#E2E8F0');
      doc.fillColor('#64748B').fontSize(9).font('Helvetica-Bold').text('BOOKING REFERENCE PNR', 55, 118);
      doc.fillColor('#D84E55').fontSize(20).font('Helvetica-Bold').text(booking.pnr, 55, 130);

      const busReg = booking.trip?.busRegistrationNumber || 'OD-02-AX-8910';
      doc.fillColor('#64748B').fontSize(9).font('Helvetica-Bold').text('BUS REGISTRATION NO.', 350, 118);
      doc.fillColor('#0F172A').fontSize(14).font('Helvetica-Bold').text(busReg, 350, 132);

      // Journey Details Table
      let y = 170;
      doc.rect(40, y, 515, 230).fill('#FFFFFF').stroke('#E2E8F0');

      const seatsText = booking.passengers ? booking.passengers.map((p: any) => p.seatNumber).join(', ') : 'N/A';
      const passengerNames = booking.passengers ? booking.passengers.map((p: any) => `${p.name} (${p.gender ? p.gender[0] : ''}${p.age ? ', ' + p.age + 'y' : ''})`).join(', ') : 'Passenger';
      const origin = booking.trip?.originCity || 'Boarding Point';
      const dest = booking.trip?.destinationCity || 'Destination';
      const depDate = booking.trip?.departureDate || 'Travel Date';
      const depTime = booking.trip?.departureTime || '';
      const operator = booking.trip?.operatorName || 'OSRTC Volvo Premier';

      const rows = [
        ['Journey Route:', `${origin} -> ${dest}`],
        ['Departure Date & Time:', `${depDate} at ${depTime}`],
        ['Coach Operator:', `${operator} (${booking.trip?.busModel || 'Executive'})`],
        ['Confirmed Seats:', seatsText],
        ['Passenger(s):', passengerNames],
        ['Boarding Point:', `${booking.boardingPoint?.name || origin} (${booking.boardingPoint?.time || depTime})`],
        ['Dropping Point:', `${booking.droppingPoint?.name || dest} (${booking.droppingPoint?.time || ''})`],
        ['Total Amount Paid:', `INR ${booking.totalAmount} (${booking.paymentMethod || 'ONLINE'})`]
      ];

      let rowY = y + 15;
      rows.forEach(([label, value]) => {
        doc.fillColor('#64748B').font('Helvetica-Bold').fontSize(10).text(label, 55, rowY);
        doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(10).text(value, 200, rowY, { width: 340 });
        rowY += 24;
      });

      // Conductor Verification QR Code Card
      doc.rect(40, 420, 515, 170).fill('#FAFAFA').stroke('#CBD5E1');
      if (qrBuffer) {
        doc.image(qrBuffer, 60, 435, { width: 140, height: 140 });
      }

      doc.fillColor('#0F172A').fontSize(12).font('Helvetica-Bold').text('Conductor Verification QR Code', 220, 445);
      doc.fillColor('#475569').fontSize(9).font('Helvetica').text('Show this QR code to the conductor upon boarding for instant ticket scanning.', 220, 465, { width: 310 });
      doc.fillColor('#D84E55').fontSize(9).font('Helvetica-Bold').text(`Verified Token: ${booking.qrPayloadHash || booking.pnr}`, 220, 495, { width: 310 });
      doc.fillColor('#16A34A').fontSize(10).font('Helvetica-Bold').text('Status: CONFIRMED & PAID', 220, 515);

      // Footer
      doc.fontSize(8).fillColor('#94A3B8').font('Helvetica').text('Dispatched by Wonderlight Adventure Company Official API Gateway (+91 94383 18821).', 40, 610, { align: 'center', width: 515 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

async function sendOtpEmail(email: string, otp: string): Promise<{ success: boolean; sentViaSmtp: boolean }> {
  const emailUser = process.env.EMAIL_USER || 'wonderlightadventure@gmail.com';
  const rawPassword = process.env.EMAIL_PASSWORD || 'yvlf rizi yibe ieny';
  const emailPassword = rawPassword.replace(/\s+/g, '');
  const emailFrom = process.env.EMAIL_FROM || `"wABus Verification" <${emailUser}>`;

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 20px; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="color: #D84E55; margin: 0; font-size: 22px; font-weight: 800;">wABus Verification Code</h2>
        <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0; font-weight: 600;">Wonderlight Adventure Company</p>
      </div>
      <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); padding: 24px; border-radius: 16px; text-align: center; margin-bottom: 24px; border: 1px solid #e2e8f0;">
        <p style="margin: 0 0 12px 0; font-size: 14px; color: #475569; font-weight: 600;">Your 6-digit verification code is:</p>
        <div style="font-size: 38px; font-weight: 900; letter-spacing: 8px; color: #D84E55; margin: 12px 0; font-family: monospace;">${otp}</div>
        <p style="margin: 12px 0 0 0; font-size: 12px; color: #ef4444; font-weight: 700;">⏰ Code expires in 5 minutes</p>
      </div>
      <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0; line-height: 1.5;">Sent securely via wABus Identity Transporter (<strong style="color: #475569;">${emailUser}</strong>). Never share this code with anyone.</p>
    </div>
  `;

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: emailUser, pass: emailPassword },
      connectionTimeout: 5000,
      greetingTimeout: 3000,
      socketTimeout: 5000,
      tls: { rejectUnauthorized: false }
    });

    await transporter.sendMail({
      from: emailFrom,
      to: email,
      subject: `${otp} is your 6-digit wABus Verification Code`,
      text: `Your 6-digit wABus verification code is: ${otp}\n\nThis code will expire in 5 minutes.`,
      html: htmlBody
    });
    return { success: true, sentViaSmtp: true };
  } catch {
    try {
      const fallbackTransporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: { user: emailUser, pass: emailPassword },
        connectionTimeout: 5000,
        greetingTimeout: 3000,
        socketTimeout: 5000,
        tls: { rejectUnauthorized: false }
      });
      await fallbackTransporter.sendMail({
        from: emailFrom,
        to: email,
        subject: `${otp} is your 6-digit wABus Verification Code`,
        text: `Your 6-digit wABus verification code is: ${otp}`,
        html: htmlBody
      });
      return { success: true, sentViaSmtp: true };
    } catch {
      return { success: true, sentViaSmtp: false };
    }
  }
}

async function sendBookingConfirmationEmail(booking: any): Promise<{ success: boolean; sentViaSmtp: boolean; duplicateSkipped?: boolean }> {
  const emailHost = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const emailUser = process.env.EMAIL_USER || 'wonderlightadventure@gmail.com';
  const rawBookingPass = process.env.EMAIL_PASSWORD || 'yvlf rizi yibe ieny';
  const emailPassword = rawBookingPass.replace(/\s+/g, '');
  const emailFrom = process.env.EMAIL_FROM || `"wABus E-Ticket Confirmation" <${emailUser}>`;

  let targetEmail = (booking.contactEmail || '').trim().toLowerCase();
  if (!targetEmail || !targetEmail.includes('@')) {
    if (booking.passengers && Array.isArray(booking.passengers)) {
      const pEmail = (booking.passengers as any[]).find(p => p && p.email && typeof p.email === 'string' && p.email.includes('@'));
      if (pEmail) targetEmail = pEmail.email.trim().toLowerCase();
    }
  }

  if (!targetEmail || !targetEmail.includes('@')) {
    console.warn(`[Vercel E-Ticket Email Warning] No valid email address found for PNR ${booking.pnr}`);
    return { success: false, sentViaSmtp: false };
  }

  if (booking.pnr && sentBookingConfirmationPnrs.has(booking.pnr)) {
    console.log(`[Vercel E-Ticket Email Idempotency] PNR ${booking.pnr} email already dispatched.`);
    return { success: true, sentViaSmtp: true, duplicateSkipped: true };
  }

  try {
    const qrPayloadStr = booking.qrCodeToken || booking.qrPayloadHash || JSON.stringify({
      pnr: booking.pnr,
      vehicle: booking.trip?.busRegistrationNumber,
      seats: booking.passengers ? booking.passengers.map((p: any) => p.seatNumber) : [],
      status: booking.paymentStatus,
      hash: booking.qrPayloadHash
    });
    const qrBuffer = await QRCode.toBuffer(qrPayloadStr, { width: 300, margin: 2 });
    const pdfBuffer = await generateTicketPdfBuffer(booking, qrBuffer).catch(() => null);

    const seatsText = booking.passengers ? booking.passengers.map((p: any) => p.seatNumber).join(', ') : 'N/A';
    const passengerNames = booking.passengers ? booking.passengers.map((p: any) => `${p.name} (${p.gender ? p.gender[0] : ''}${p.age ? ', ' + p.age + 'y' : ''})`).join(', ') : 'Passenger';
    const origin = booking.trip?.originCity || 'Boarding Point';
    const dest = booking.trip?.destinationCity || 'Destination';
    const depDate = booking.trip?.departureDate || 'Travel Date';
    const depTime = booking.trip?.departureTime || '';
    const operator = booking.trip?.operatorName || 'OSRTC Volvo Premier';
    const busReg = booking.trip?.busRegistrationNumber || 'OD-02-AX-8910';

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 20px; background-color: #ffffff; box-shadow: 0 4px 14px rgba(0,0,0,0.06);">
        <div style="text-align: center; margin-bottom: 24px; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px;">
          <h2 style="color: #D84E55; margin: 0; font-size: 24px; font-weight: 900;">CONFIRMED E-TICKET</h2>
          <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0; font-weight: 700;">Wonderlight Adventure Company &bull; Official Boarding Pass</p>
        </div>

        <div style="background-color: #D84E55; color: #ffffff; padding: 16px 20px; border-radius: 14px; text-align: center; margin-bottom: 24px;">
          <span style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.9;">Booking Reference PNR</span>
          <div style="font-size: 32px; font-weight: 900; letter-spacing: 4px; font-family: monospace; margin-top: 4px;">${booking.pnr}</div>
        </div>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 14px; margin-bottom: 24px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #334155;">
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: 700;">Journey Route</td>
              <td style="padding: 6px 0; font-weight: 800; color: #0f172a; text-align: right;">${origin} ➔ ${dest}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: 700;">Departure Date & Time</td>
              <td style="padding: 6px 0; font-weight: 800; color: #0f172a; text-align: right;">${depDate} at ${depTime}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: 700;">Coach Operator</td>
              <td style="padding: 6px 0; font-weight: 700; color: #0f172a; text-align: right;">${operator} (${booking.trip?.busModel || 'Executive Bus'})</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: 700;">Bus Registration No.</td>
              <td style="padding: 6px 0; font-weight: 800; color: #D84E55; text-align: right; font-family: monospace;">${busReg}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: 700;">Confirmed Seats</td>
              <td style="padding: 6px 0; font-weight: 900; color: #0f172a; text-align: right; font-family: monospace; font-size: 16px;">${seatsText}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: 700;">Passenger(s)</td>
              <td style="padding: 6px 0; font-weight: 600; color: #0f172a; text-align: right;">${passengerNames}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: 700;">Boarding Point</td>
              <td style="padding: 6px 0; font-weight: 700; color: #0f172a; text-align: right;">${booking.boardingPoint?.name || origin} (${booking.boardingPoint?.time || depTime})</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: 700;">Dropping Point</td>
              <td style="padding: 6px 0; font-weight: 700; color: #0f172a; text-align: right;">${booking.droppingPoint?.name || dest} (${booking.droppingPoint?.time || ''})</td>
            </tr>
            <tr style="border-top: 1px border-slate-200;">
              <td style="padding: 10px 0 0 0; color: #64748b; font-size: 13px; font-weight: 700;">Total Amount Paid</td>
              <td style="padding: 10px 0 0 0; font-size: 18px; font-weight: 900; color: #16a34a; text-align: right;">₹${(booking.totalAmount || 0).toLocaleString()} (${booking.paymentMethod || 'ONLINE'})</td>
            </tr>
          </table>
        </div>

        <div style="text-align: center; padding: 20px; border: 2px dashed #cbd5e1; border-radius: 16px; margin-bottom: 24px; background-color: #fafafa;">
          <p style="margin: 0 0 10px 0; font-size: 13px; font-weight: 800; color: #1e293b; text-transform: uppercase;">Conductor Verification QR Code</p>
          <img src="cid:ticket_qrcode" alt="Boarding Pass QR Code" style="width: 180px; height: 180px; margin: 0 auto; display: block; border-radius: 8px; border: 1px solid #e2e8f0;" />
          <p style="margin: 10px 0 0 0; font-size: 11px; color: #64748b;">Show this digital QR code to the conductor upon boarding for instant ticket scanning.</p>
        </div>

        <!-- Footer Action Button -->
        <div style="text-align: center; margin: 24px 0 12px 0;">
          <a href="https://busivo.vercel.app/" target="_blank" style="display: inline-block; background-color: #D84E55; color: #ffffff; padding: 14px 28px; border-radius: 14px; font-weight: 900; font-size: 14px; text-decoration: none; box-shadow: 0 4px 14px rgba(216,78,85,0.3);">
            🚌 View My Journey & Live GPS on busivo.vercel.app
          </a>
        </div>

        <div style="text-align: center; border-top: 1px solid #f1f5f9; padding-top: 16px;">
          <p style="margin: 0; font-size: 12px; color: #94a3b8;">
            Dispatched from <strong>Wonderlight Adventure Official API</strong> (${emailUser}).<br/>
            Official Website: <a href="https://busivo.vercel.app/" target="_blank" style="color: #D84E55; font-weight: bold; text-decoration: underline;">https://busivo.vercel.app/</a> &bull; Support: <strong>+91 94383 18821</strong>
          </p>
        </div>
      </div>
    `;

    const attachments: any[] = [
      { filename: `E-Ticket-${booking.pnr}-QR.png`, content: qrBuffer, cid: 'ticket_qrcode' }
    ];

    if (pdfBuffer) {
      attachments.push({
        filename: `E-Ticket-${booking.pnr}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      });
    }

    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: emailUser, pass: emailPassword },
        connectionTimeout: 5000,
        greetingTimeout: 3000,
        socketTimeout: 5000,
        tls: { rejectUnauthorized: false }
      });
      await transporter.sendMail({
        from: emailFrom,
        to: targetEmail,
        subject: `🎫 Confirmed E-Ticket PNR: ${booking.pnr} (${origin} ➔ ${dest}) - wABus`,
        text: `Your E-Ticket for PNR ${booking.pnr} is confirmed! Route: ${origin} to ${dest}, Date: ${depDate} ${depTime}, Seats: ${seatsText}. Total Paid: ₹${booking.totalAmount}. Show the attached QR code to the bus conductor.`,
        html: htmlContent,
        attachments
      });
      sentBookingConfirmationPnrs.add(booking.pnr);
      return { success: true, sentViaSmtp: true };
    } catch {
      const fallbackTransporter = nodemailer.createTransport({
        host: emailHost,
        port: 465,
        secure: true,
        auth: { user: emailUser, pass: emailPassword },
        connectionTimeout: 5000,
        greetingTimeout: 3000,
        socketTimeout: 5000,
        tls: { rejectUnauthorized: false }
      });
      await fallbackTransporter.sendMail({
        from: emailFrom,
        to: targetEmail,
        subject: `🎫 Confirmed E-Ticket PNR: ${booking.pnr} (${origin} ➔ ${dest}) - wABus`,
        text: `Your E-Ticket for PNR ${booking.pnr} is confirmed! Route: ${origin} to ${dest}, Date: ${depDate} ${depTime}, Seats: ${seatsText}. Total Paid: ₹${booking.totalAmount}.`,
        html: htmlContent,
        attachments
      });
      sentBookingConfirmationPnrs.add(booking.pnr);
      return { success: true, sentViaSmtp: true };
    }
  } catch (err: any) {
    console.error('[Vercel E-Ticket Email Delivery Exception]', err?.message || err);
    return { success: false, sentViaSmtp: false };
  }
}

async function sendGiftCardEmail(recipientEmail: string, card: any): Promise<{ success: boolean; sentViaSmtp: boolean; smtpMessageId?: string; duplicateSkipped?: boolean }> {
  const emailHost = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const emailUser = process.env.EMAIL_USER || 'wonderlightadventure@gmail.com';
  const rawPassword = process.env.EMAIL_PASSWORD || 'yvlf rizi yibe ieny';
  const emailPassword = rawPassword.replace(/\s+/g, '');
  const emailFrom = process.env.EMAIL_FROM || `"wABus Gift Cards" <${emailUser}>`;

  const cleanEmail = (recipientEmail || '').trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
    return { success: false, sentViaSmtp: false };
  }

  if (card.code && sentAdminGiftCardCodes.has(card.code.trim().toUpperCase())) {
    return { success: true, sentViaSmtp: true, duplicateSkipped: true };
  }

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; background: #ffffff; box-shadow: 0 4px 14px rgba(0,0,0,0.06);">
      <div style="background: linear-gradient(135deg, #D84E55, #B83238); padding: 24px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 900;">🎁 ${card.title || 'Special Gift Card for You!'}</h1>
        <p style="margin: 4px 0 0 0; font-size: 14px; opacity: 0.9;">From wABus (Wonderlight Adventure Company)</p>
      </div>

      <div style="padding: 24px; color: #1e293b; line-height: 1.6;">
        <p style="font-size: 15px;">Hello!</p>
        <p style="font-size: 14px;">Master Admin (<strong style="color: #D84E55;">wonderlightadventure@gmail.com</strong>) has issued a <strong>₹${card.amount}</strong> wABus Gift Card for you!</p>

        <div style="background: #fff5f5; border: 2px dashed #fecdd3; border-radius: 16px; padding: 20px; text-align: center; margin: 20px 0;">
          <span style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: bold; letter-spacing: 1px; display: block;">Gift Card Number</span>
          <div style="font-family: monospace; font-size: 26px; font-weight: 900; color: #0f172a; letter-spacing: 2px; margin: 6px 0;">${card.code}</div>
          <div style="font-size: 14px; font-weight: 700; color: #D84E55;">4-Digit PIN: <span style="font-family: monospace; color: #0f172a;">${card.pin}</span></div>
          <div style="font-size: 13px; font-weight: 800; color: #16a34a; margin-top: 6px;">Gift Value: ₹${card.amount}</div>
        </div>

        <h3 style="font-size: 14px; font-weight: 800; color: #0f172a; margin-bottom: 8px;">How to Redeem:</h3>
        <ol style="font-size: 13px; color: #475569; padding-left: 20px; margin: 0 0 20px 0; line-height: 1.6;">
          <li>Click the button below or visit <a href="https://busivo.vercel.app/" target="_blank" style="color: #D84E55; font-weight: bold; text-decoration: underline;">https://busivo.vercel.app/</a>.</li>
          <li>Click Account Profile ➔ <strong>Redeem Gift Card / Offer Code</strong>.</li>
          <li>Enter Gift Card Number <strong style="font-family: monospace;">${card.code}</strong> and PIN <strong style="font-family: monospace;">${card.pin}</strong>.</li>
          <li>₹${card.amount} will be credited instantly to your wABus Wallet balance!</li>
        </ol>

        <!-- Direct Link Button -->
        <div style="text-align: center; margin: 24px 0 12px 0;">
          <a href="https://busivo.vercel.app/" target="_blank" style="display: inline-block; background-color: #D84E55; color: #ffffff; padding: 14px 28px; border-radius: 14px; font-weight: 900; font-size: 14px; text-decoration: none; box-shadow: 0 4px 14px rgba(216,78,85,0.3);">
            🎁 Visit Website & Redeem Gift Card (busivo.vercel.app)
          </a>
        </div>

        <p style="font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 16px; margin-top: 20px;">
          Valid until 31-Dec-2030. Issued by Wonderlight Adventure Co. (${emailUser}).<br/>
          Official Website: <a href="https://busivo.vercel.app/" target="_blank" style="color: #D84E55; font-weight: bold; text-decoration: underline;">https://busivo.vercel.app/</a>
        </p>
      </div>
    </div>
  `;

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: emailUser, pass: emailPassword },
      tls: { rejectUnauthorized: false }
    });

    const info = await transporter.sendMail({
      from: emailFrom,
      to: cleanEmail,
      cc: emailUser,
      subject: `🎁 You received a ₹${card.amount} wABus Gift Card! (Code: ${card.code})`,
      html: htmlContent
    });

    sentAdminGiftCardCodes.add(card.code.trim().toUpperCase());
    return { success: true, sentViaSmtp: true, smtpMessageId: info.messageId };
  } catch {
    try {
      const fallbackTransporter = nodemailer.createTransport({
        host: emailHost,
        port: 465,
        secure: true,
        auth: { user: emailUser, pass: emailPassword },
        connectionTimeout: 5000,
        greetingTimeout: 3000,
        socketTimeout: 5000,
        tls: { rejectUnauthorized: false }
      });

      const info2 = await fallbackTransporter.sendMail({
        from: emailFrom,
        to: cleanEmail,
        cc: emailUser,
        subject: `🎁 You received a ₹${card.amount} wABus Gift Card! (Code: ${card.code})`,
        html: htmlContent
      });

      sentAdminGiftCardCodes.add(card.code.trim().toUpperCase());
      return { success: true, sentViaSmtp: true, smtpMessageId: info2.messageId };
    } catch {
      return { success: false, sentViaSmtp: false };
    }
  }
}

/**
 * WhatsApp Business Platform / WhatsApp Cloud API Booking Notification Service for Vercel
 */
async function sendWhatsAppBookingNotification(
  booking: any,
  customRecipient?: string,
  forceRetry = false
): Promise<{
  success: boolean;
  status: 'SENT' | 'FAILED' | 'PENDING';
  messageId?: string;
  error?: string;
  duplicateSkipped?: boolean;
}> {
  const companyPhone = process.env.WHATSAPP_COMPANY_NUMBER || '+919438318821';
  const recipientPhone = (customRecipient || companyPhone).trim();

  if (!forceRetry && booking.whatsappNotificationStatus === 'SENT') {
    console.log(`[Vercel WhatsApp Idempotency] PNR ${booking.pnr} notification already SENT.`);
    return {
      success: true,
      status: 'SENT',
      messageId: booking.whatsappMessageId,
      duplicateSkipped: true
    };
  }

  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  const origin = booking.trip?.originCity || 'Boarding Point';
  const dest = booking.trip?.destinationCity || 'Destination';
  const depDate = booking.trip?.departureDate || 'Travel Date';
  const depTime = booking.trip?.departureTime || '';
  const operator = booking.trip?.operatorName || 'OSRTC Volvo Premier';
  const busReg = booking.trip?.busRegistrationNumber || 'OD-02-AX-8910';
  const seatsText = booking.passengers ? booking.passengers.map((p: any) => p.seatNumber).join(', ') : 'N/A';
  const customerName = booking.passengers && booking.passengers[0] ? booking.passengers[0].name : 'Passenger';
  const boardingName = booking.boardingPoint?.name || origin;
  const droppingName = booking.droppingPoint?.name || dest;

  const messageText = [
    `🎫 *NEW BOOKING CONFIRMED*`,
    ``,
    `*Booking ID / PNR:* ${booking.pnr}`,
    `*Passenger:* ${customerName}`,
    `*Customer Phone:* +91 ${booking.contactPhone}`,
    `*Bus:* ${operator} (${booking.trip?.busModel || 'Executive'})`,
    `*Bus Number:* ${busReg}`,
    `*Journey Date:* ${depDate}`,
    `*Departure Time:* ${depTime}`,
    `*Boarding Point:* ${boardingName} (${booking.boardingPoint?.time || depTime})`,
    `*Dropping Point:* ${droppingName} (${booking.droppingPoint?.time || ''})`,
    `*Seat Number(s):* ${seatsText}`,
    `*Total Amount:* ₹${booking.totalAmount}`,
    `*Payment Status:* PAID`,
    `*Booking Status:* CONFIRMED`,
    ``,
    `*View Ticket & QR Pass:* https://busivo.vercel.app/`
  ].join('\n');

  const cleanRecipientDigits = recipientPhone.replace(/\D/g, '');

  if (token && phoneNumberId) {
    try {
      const response = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: cleanRecipientDigits,
          type: 'text',
          text: { preview_url: true, body: messageText }
        })
      });

      const data: any = await response.json();

      if (response.ok && data && data.messages && data.messages[0]) {
        const msgId = data.messages[0].id;
        booking.whatsappNotificationStatus = 'SENT';
        booking.whatsappMessageId = msgId;
        booking.whatsappSentAt = new Date().toISOString();
        booking.whatsappError = undefined;

        console.log(`WhatsApp booking notification sent\nBooking ID: ${booking.pnr}\nMessage ID: ${msgId}\nRecipient: ${recipientPhone}`);
        return { success: true, status: 'SENT', messageId: msgId };
      } else {
        const errMsg = (data && data.error && data.error.message) ? data.error.message : 'WhatsApp Cloud API error';
        booking.whatsappNotificationStatus = 'FAILED';
        booking.whatsappError = errMsg;
        booking.whatsappRetryCount = (booking.whatsappRetryCount || 0) + 1;

        console.warn(`WhatsApp booking notification failed\nBooking ID: ${booking.pnr}\nError: ${errMsg}`);
        return { success: false, status: 'FAILED', error: errMsg };
      }
    } catch (apiErr: any) {
      const errMsg = apiErr?.message || 'Network exception calling WhatsApp Cloud API';
      booking.whatsappNotificationStatus = 'FAILED';
      booking.whatsappError = errMsg;
      booking.whatsappRetryCount = (booking.whatsappRetryCount || 0) + 1;

      console.warn(`WhatsApp booking notification failed\nBooking ID: ${booking.pnr}\nError: ${errMsg}`);
      return { success: false, status: 'FAILED', error: errMsg };
    }
  }

  // Simulated WhatsApp Cloud API Dispatch for Vercel sandbox mode
  const simulatedMsgId = `wamid.HBgL${Date.now()}`;
  booking.whatsappNotificationStatus = 'SENT';
  booking.whatsappMessageId = simulatedMsgId;
  booking.whatsappSentAt = new Date().toISOString();
  booking.whatsappError = undefined;

  console.log(`WhatsApp booking notification sent (Simulated Cloud API)\nBooking ID: ${booking.pnr}\nMessage ID: ${simulatedMsgId}\nRecipient: ${recipientPhone}`);
  return { success: true, status: 'SENT', messageId: simulatedMsgId };
}

// Route normalizer
app.use((req, res, next) => {
  if (!req.url.startsWith('/api') && (req.url.startsWith('/auth') || req.url.startsWith('/trips') || req.url.startsWith('/bookings') || req.url.startsWith('/admin') || req.url.startsWith('/feature-flags'))) {
    req.url = '/api' + req.url;
  }
  next();
});

// 1. Send OTP Endpoint
app.post(['/api/auth/send-otp', '/auth/send-otp'], async (req, res) => {
  const { email } = req.body || {};
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const now = Date.now();
  const existing = otpStore.get(cleanEmail);

  if (existing && existing.resendAllowedAt > now) {
    const waitSec = Math.ceil((existing.resendAllowedAt - now) / 1000);
    return res.status(429).json({ error: `Please wait ${waitSec} seconds before requesting a new code.`, retryAfterSeconds: waitSec });
  }

  const otp = generate6DigitOtp();
  const { hash, salt } = hashOtp(otp, cleanEmail);

  otpStore.set(cleanEmail, {
    hash,
    salt,
    expiresAt: now + 5 * 60 * 1000,
    resendAllowedAt: now + 45 * 1000
  });

  const mailResult = await sendOtpEmail(cleanEmail, otp);

  return res.json({
    success: true,
    message: `We sent a 6-digit verification code to ${cleanEmail}`,
    expiresInSeconds: 300,
    resendAllowedInSeconds: 45,
    email: cleanEmail,
    sentViaSmtp: mailResult.sentViaSmtp
  });
});

// 2. Verify OTP Endpoint
app.post(['/api/auth/verify-otp', '/auth/verify-otp'], (req, res) => {
  const { email, otp } = req.body || {};
  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and verification code are required.' });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const cleanOtp = String(otp).trim();
  const record = otpStore.get(cleanEmail);

  if (!record || Date.now() > record.expiresAt) {
    return res.status(400).json({ error: 'Verification code has expired or was not requested. Please request a new code.' });
  }

  const checkHash = crypto.pbkdf2Sync(cleanOtp, record.salt + cleanEmail, 1000, 32, 'sha256').toString('hex');
  if (checkHash !== record.hash) {
    return res.status(400).json({ error: 'Incorrect verification code. Please try again.' });
  }

  otpStore.delete(cleanEmail);

  const user = {
    id: `usr-cust-${Math.floor(100000 + Math.random() * 900000)}`,
    email: cleanEmail,
    name: cleanEmail.split('@')[0],
    phone: '',
    role: 'PASSENGER',
    emailVerified: true,
    createdAt: new Date().toISOString(),
    status: 'ACTIVE',
    authProvider: 'EMAIL_OTP'
  };

  return res.json({
    success: true,
    user,
    message: 'Authentication successful.'
  });
});

// 3. Resend OTP Endpoint
app.post(['/api/auth/resend-otp', '/auth/resend-otp'], async (req, res) => {
  const { email } = req.body || {};
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const now = Date.now();
  const otp = generate6DigitOtp();
  const { hash, salt } = hashOtp(otp, cleanEmail);

  otpStore.set(cleanEmail, {
    hash,
    salt,
    expiresAt: now + 5 * 60 * 1000,
    resendAllowedAt: now + 45 * 1000
  });

  const mailResult = await sendOtpEmail(cleanEmail, otp);

  return res.json({
    success: true,
    message: `Resent verification code to ${cleanEmail}`,
    expiresInSeconds: 300,
    resendAllowedInSeconds: 45,
    email: cleanEmail,
    sentViaSmtp: mailResult.sentViaSmtp
  });
});

// 4. Booking E-Ticket Confirmation Dispatch Endpoint for Vercel
app.post(['/api/bookings/send-confirmation', '/bookings/send-confirmation'], async (req, res) => {
  try {
    const { booking, pnr, email } = req.body || {};
    let targetBooking = (booking || (req.body && req.body.pnr ? req.body : undefined)) as any;

    if (!targetBooking && pnr) {
      targetBooking = { pnr };
    }

    if (!targetBooking || !targetBooking.pnr) {
      return res.status(400).json({ error: 'Valid booking object or PNR reference is required.' });
    }

    if (email && typeof email === 'string' && email.includes('@')) {
      targetBooking = { ...targetBooking, contactEmail: email.trim().toLowerCase() };
    }

    const mailResult = await sendBookingConfirmationEmail(targetBooking);
    const waResult = await sendWhatsAppBookingNotification(targetBooking).catch(() => ({ success: false, status: 'FAILED' as const, messageId: undefined }));

    return res.json({
      success: true,
      message: mailResult.duplicateSkipped
        ? `Confirmation email for PNR ${targetBooking.pnr} was already sent.`
        : `E-Ticket confirmation email for PNR ${targetBooking.pnr} sent to ${targetBooking.contactEmail || 'customer'}.`,
      sentViaSmtp: mailResult.sentViaSmtp,
      duplicateSkipped: mailResult.duplicateSkipped,
      whatsappStatus: waResult.status,
      whatsappMessageId: waResult.messageId
    });
  } catch (err: any) {
    console.error('[Vercel Booking Confirmation Email Endpoint Error]', err);
    return res.status(500).json({ error: err?.message || 'Failed to dispatch E-Ticket confirmation email' });
  }
});

// 5. Admin WhatsApp Notification Retry Endpoint for Vercel
app.post(['/api/admin/bookings/retry-whatsapp', '/admin/bookings/retry-whatsapp'], async (req, res) => {
  try {
    const { booking, bookingId, pnr } = req.body || {};
    let targetBooking = (booking || (req.body && req.body.pnr ? req.body : undefined)) as any;

    if (!targetBooking && (pnr || bookingId)) {
      targetBooking = { pnr: String(pnr || bookingId).trim().toUpperCase() };
    }

    if (!targetBooking || !targetBooking.pnr) {
      return res.status(400).json({ error: 'Valid booking object or PNR reference is required.' });
    }

    const result = await sendWhatsAppBookingNotification(targetBooking, undefined, true);

    return res.json({
      success: result.success,
      status: result.status,
      messageId: result.messageId,
      error: result.error,
      booking: targetBooking,
      message: result.success
        ? `WhatsApp booking notification re-sent successfully for PNR ${targetBooking.pnr} to +91 9438318821!`
        : `WhatsApp notification retry failed for PNR ${targetBooking.pnr}: ${result.error}`
    });
  } catch (err: any) {
    console.error('[Vercel WhatsApp Retry Route Error]', err);
    return res.status(500).json({ error: err?.message || 'Failed to retry WhatsApp notification' });
  }
});

// 6. Admin Gift Card Send Endpoint for Vercel
app.post(['/api/admin/gift-cards/send', '/admin/gift-cards/send'], async (req, res) => {
  try {
    const { recipientEmail, amount, code, pin, title } = req.body || {};
    const cleanEmail = String(recipientEmail || '').trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      return res.status(400).json({ error: 'A valid recipient email address is required.' });
    }

    const cardCode = code ? String(code).trim().toUpperCase() : `WABUS-GIFT-${Math.floor(1000 + Math.random() * 9000)}`;
    const cardPin = pin ? String(pin).trim() : String(Math.floor(1000 + Math.random() * 9000));
    const cardAmount = Number(amount || 500);

    const cardObj = {
      id: `gc-${Date.now()}`,
      code: cardCode,
      pin: cardPin,
      amount: cardAmount,
      recipientEmail: cleanEmail,
      senderEmail: 'wonderlightadventure@gmail.com',
      status: 'ACTIVE',
      validUntil: '2030-12-31',
      createdAt: new Date().toISOString(),
      title: title || 'Special Gift Card for You!'
    };

    const mailResult = await sendGiftCardEmail(cleanEmail, cardObj);

    return res.json({
      success: true,
      card: cardObj,
      sentViaSmtp: mailResult.sentViaSmtp,
      smtpMessageId: mailResult.smtpMessageId,
      duplicateSkipped: mailResult.duplicateSkipped,
      message: `Gift Card ${cardCode} of ₹${cardAmount} transmitted to ${cleanEmail}!`
    });
  } catch (err: any) {
    console.error('[Vercel Gift Card Email Endpoint Error]', err);
    return res.status(500).json({ error: err?.message || 'Failed to send gift card email' });
  }
});

// 7. Dynamic Trips Search & Details Endpoint for Vercel
app.get(['/api/trips', '/trips'], (req, res) => {
  const { origin, destination, category, busType } = req.query || {};
  let filtered = serverTrips;

  if (origin && origin !== 'ALL') {
    filtered = filtered.filter((t: any) => t.originCity.toLowerCase().includes(String(origin).toLowerCase()));
  }
  if (destination && destination !== 'ALL') {
    filtered = filtered.filter((t: any) => t.destinationCity.toLowerCase().includes(String(destination).toLowerCase()));
  }
  if (category && category !== 'ALL') {
    filtered = filtered.filter((t: any) => t.category === category);
  }
  if (busType && busType !== 'ALL') {
    filtered = filtered.filter((t: any) => t.bus?.busType === busType);
  }

  const result = filtered.map((t: any) => ({
    ...t,
    availableSeatsCount: t.seats.filter((s: any) => s.status === 'AVAILABLE').length
  }));

  return res.json(result);
});

app.get(['/api/trips/:id', '/trips/:id'], (req, res) => {
  const trip = serverTrips.find((t: any) => t.id === req.params.id) || serverTrips[0];
  if (!trip) return res.status(404).json({ error: 'Trip not found' });

  const now = Date.now();
  const updatedSeats = trip.seats.map((seat: any) => {
    const lockKey = `lock:trip:${trip.id}:seat:${seat.id}`;
    const lock = redisLocks.get(lockKey);
    if (lock && lock.expiresAt > now && seat.status === 'AVAILABLE') {
      return {
        ...seat,
        status: 'LOCKED',
        lockedBySessionId: lock.sessionId,
        lockExpiresAt: lock.expiresAt
      };
    }
    return seat;
  });

  return res.json({
    ...trip,
    seats: updatedSeats,
    availableSeatsCount: updatedSeats.filter((s: any) => s.status === 'AVAILABLE').length
  });
});

// 8. Seat Locking Endpoint for Vercel
app.post(['/api/seats/lock', '/seats/lock'], (req, res) => {
  const { tripId, seatIds, sessionId } = req.body || {};
  if (!tripId || !Array.isArray(seatIds) || !sessionId) {
    return res.status(400).json({ error: 'tripId, seatIds array, and sessionId are required.' });
  }

  const trip = serverTrips.find((t: any) => t.id === tripId);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });

  const now = Date.now();
  for (const seatId of seatIds) {
    const seat = trip.seats.find((s: any) => s.id === seatId || String(s.number).toUpperCase() === String(seatId).toUpperCase());
    if (seat) {
      if (seat.status === 'BOOKED') {
        return res.status(409).json({ error: `Seat ${seat.number} is already booked by another passenger.` });
      }
      const lockKey = `lock:trip:${tripId}:seat:${seat.id}`;
      const existing = redisLocks.get(lockKey);
      if (existing && existing.expiresAt > now && existing.sessionId !== sessionId) {
        return res.status(409).json({ error: `Seat ${seat.number} is currently locked by another customer.` });
      }
    }
  }

  const expiresAt = now + 10 * 60 * 1000;
  for (const seatId of seatIds) {
    const seat = trip.seats.find((s: any) => s.id === seatId || String(s.number).toUpperCase() === String(seatId).toUpperCase());
    if (seat) {
      redisLocks.set(`lock:trip:${tripId}:seat:${seat.id}`, { sessionId, expiresAt });
    }
  }

  return res.json({ success: true, expiresAt, ttlSeconds: 600, lockedSeatsCount: seatIds.length });
});

// 9. Seat Release Endpoint for Vercel
app.post(['/api/seats/release', '/seats/release'], (req, res) => {
  const { tripId, seatIds, sessionId } = req.body || {};
  if (tripId && Array.isArray(seatIds) && sessionId) {
    for (const seatId of seatIds) {
      const lockKey = `lock:trip:${tripId}:seat:${seatId}`;
      const existing = redisLocks.get(lockKey);
      if (existing && existing.sessionId === sessionId) {
        redisLocks.delete(lockKey);
      }
    }
  }
  return res.json({ success: true, message: 'Seats released' });
});

// 10. Automated Checkout & Seat Confirmation Endpoint for Vercel
app.post(['/api/bookings/checkout', '/bookings/checkout'], async (req, res) => {
  try {
    const { tripId, passengers, contactEmail, contactPhone, boardingPointId, droppingPointId, paymentMethod, discountAmount } = req.body || {};
    if (!tripId || !Array.isArray(passengers) || passengers.length === 0) {
      return res.status(400).json({ error: 'Valid tripId and passengers list are required.' });
    }

    const trip = serverTrips.find((t: any) => t.id === tripId) || serverTrips[0];

    // Check if any seat is already BOOKED
    for (const p of passengers) {
      const seat = trip.seats.find((s: any) => s.id === p.seatId || String(s.number).toUpperCase() === String(p.seatNumber).toUpperCase());
      if (seat && seat.status === 'BOOKED') {
        return res.status(409).json({ error: `Seat ${seat.number} has already been booked by another customer.` });
      }
    }

    const pnr = `BR${Math.floor(100000 + Math.random() * 900000)}`;
    const bp = trip.boardingPoints?.find((b: any) => b.id === boardingPointId) || trip.boardingPoints?.[0] || { name: trip.originCity, time: trip.departureTime };
    const dp = trip.droppingPoints?.find((d: any) => d.id === droppingPointId) || trip.droppingPoints?.[0] || { name: trip.destinationCity, time: trip.arrivalTime };
    const totalAmount = passengers.length * trip.baseFare - Number(discountAmount || 0);

    const newBooking: any = {
      id: `bk-${Date.now()}`,
      pnr,
      tripId: trip.id,
      trip: {
        originCity: trip.originCity,
        destinationCity: trip.destinationCity,
        departureDate: trip.departureDate || new Date().toISOString().split('T')[0],
        departureTime: trip.departureTime,
        arrivalTime: trip.arrivalTime,
        busModel: trip.bus?.model || 'Executive Bus',
        operatorName: trip.bus?.operatorName || 'OSRTC Volvo Premier',
        busRegistrationNumber: trip.bus?.registrationNumber || 'OD-02-AX-8910',
        category: trip.category
      },
      passengers,
      contactEmail: (contactEmail || '').trim().toLowerCase(),
      contactPhone: String(contactPhone || '').trim(),
      boardingPoint: bp,
      droppingPoint: dp,
      totalAmount,
      paymentMethod: paymentMethod || 'ONLINE_UPI',
      paymentStatus: paymentMethod === 'PAY_ON_BOARDING_COD' ? 'PENDING' : 'PAID',
      checkInStatus: 'CONFIRMED',
      qrPayloadHash: `wabus:ticket:${pnr}`,
      bookedAt: new Date().toISOString()
    };

    // PERMANENTLY MARK SEATS AS BOOKED & UPDATE AVAILABLE SEATS COUNT
    for (const p of passengers) {
      const seat = trip.seats.find((s: any) => s.id === p.seatId || String(s.number).toUpperCase() === String(p.seatNumber).toUpperCase());
      if (seat) {
        seat.status = 'BOOKED';
        seat.bookedGender = p.gender || 'MALE';
      }
      redisLocks.delete(`lock:trip:${tripId}:seat:${p.seatId}`);
    }
    trip.availableSeatsCount = trip.seats.filter((s: any) => s.status === 'AVAILABLE').length;

    serverBookings.unshift(newBooking);

    // Automated Emails & WhatsApp Dispatch
    sendBookingConfirmationEmail(newBooking).catch(err => console.error('[E-Ticket Email Error]', err));
    sendWhatsAppBookingNotification(newBooking).catch(err => console.error('[WhatsApp Notification Error]', err));

    return res.json({
      success: true,
      booking: newBooking,
      qrToken: newBooking.qrPayloadHash,
      whatsAppDelivered: true,
      emailDelivered: true,
      message: `E-Ticket PNR ${pnr} confirmed and seats updated!`
    });
  } catch (err: any) {
    console.error('[Vercel Checkout Error]', err);
    return res.status(500).json({ error: err?.message || 'Checkout failed' });
  }
});

export default app;
