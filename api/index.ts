import express from 'express';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import QRCode from 'qrcode';
import PDFDocument from 'pdfkit';

const app = express();
app.use(express.json());

// In-Memory stores for Vercel Serverless Function instances
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
      doc.fillColor('#FFFFFF').fontSize(22).font('Helvetica-Bold').text('wABus OFFICIAL E-TICKET', 60, 52);
      doc.fontSize(10).font('Helvetica').text('Wonderlight Adventure Company • Digital Boarding Pass', 60, 78);

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

        <div style="text-align: center; border-top: 1px solid #f1f5f9; padding-top: 16px;">
          <p style="margin: 0; font-size: 12px; color: #94a3b8;">
            Dispatched from <strong>Wonderlight Adventure Official API</strong> (${emailUser}).<br/>
            WhatsApp Support & Updates: <strong>+91 94383 18821</strong>
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
        <ol style="font-size: 13px; color: #475569; padding-left: 20px; margin: 0 0 20px 0;">
          <li>Visit the <strong style="color: #D84E55;">wABus Official Platform</strong>.</li>
          <li>Click Account Profile ➔ <strong>Redeem Gift Card / Offer Code</strong>.</li>
          <li>Enter Gift Card Number <strong>${card.code}</strong> and PIN <strong>${card.pin}</strong>.</li>
          <li>₹${card.amount} will be added instantly to your wABus Wallet balance!</li>
        </ol>

        <p style="font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 16px; margin-top: 20px;">
          Valid until 31-Dec-2030. Issued by Wonderlight Adventure Co. (${emailUser}).
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

    return res.json({
      success: true,
      message: mailResult.duplicateSkipped
        ? `Confirmation email for PNR ${targetBooking.pnr} was already sent.`
        : `E-Ticket confirmation email for PNR ${targetBooking.pnr} sent to ${targetBooking.contactEmail || 'customer'}.`,
      sentViaSmtp: mailResult.sentViaSmtp,
      duplicateSkipped: mailResult.duplicateSkipped
    });
  } catch (err: any) {
    console.error('[Vercel Booking Confirmation Email Endpoint Error]', err);
    return res.status(500).json({ error: err?.message || 'Failed to dispatch E-Ticket confirmation email' });
  }
});

// 5. Admin Gift Card Send Endpoint for Vercel
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

export default app;
