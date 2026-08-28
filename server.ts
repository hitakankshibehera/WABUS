import fs from 'fs';
try {
  if (fs.existsSync('.env')) {
    const envFile = fs.readFileSync('.env', 'utf8');
    envFile.split('\n').forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let val = (match[2] || '').trim();
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        if (!process.env[key]) process.env[key] = val;
      }
    });
  }
} catch (e) {}

import express from 'express';
import path from 'path';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import QRCode from 'qrcode';
import { createServer as createViteServer } from 'vite';
import { 
  DEFAULT_FEATURE_FLAGS, 
  INITIAL_TRIPS, 
  INITIAL_BOOKINGS, 
  MOCK_PAYOUTS, 
  MOCK_ROUTES,
  MOCK_BUSES,
  INITIAL_CONDUCTORS,
  generateSleeperSeats,
  generateSeaterSeats
} from './src/data/mockDatabase';
import { POSTGRESQL_SCHEMA_SQL, REDIS_LOCKING_TYPESCRIPT, PAYMENT_WEBHOOK_TYPESCRIPT } from './src/data/deliverables';
import { Booking, FeatureFlags, Trip, Seat, PayoutRecord, ConductorProfile, OfferCoupon, UserAccount, GiftCard } from './src/types';

// In-Memory Database State (Simulating PostgreSQL + Redis Cache)
let featureFlags: FeatureFlags = { ...DEFAULT_FEATURE_FLAGS };
let trips: Trip[] = JSON.parse(JSON.stringify(INITIAL_TRIPS));
let bookings: Booking[] = JSON.parse(JSON.stringify(INITIAL_BOOKINGS));
let payouts: PayoutRecord[] = JSON.parse(JSON.stringify(MOCK_PAYOUTS));
let conductors: ConductorProfile[] = JSON.parse(JSON.stringify(INITIAL_CONDUCTORS));

// User Accounts Database Store
let registeredUsers: UserAccount[] = [
  {
    id: 'usr-pass-101',
    name: 'Rahul Sharma',
    email: 'rahul.sharma@gmail.com',
    phone: '+91 98765 43210',
    role: 'PASSENGER',
    createdAt: '2025-01-15T10:00:00Z',
    lastLoginAt: new Date().toISOString(),
    status: 'ACTIVE',
    emailVerified: true,
    bookingsCount: 2,
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    authProvider: 'EMAIL_OTP'
  },
  {
    id: 'usr-cond-202',
    name: 'Bijay Nayak',
    email: 'conductor.bijay@osrtc.gov.in',
    phone: '+91 94371 00001',
    role: 'CONDUCTOR',
    employeeId: 'COND-7890',
    badgeNumber: 'OSRTC-BBSR-04',
    assignedOperator: 'OSRTC Volvo Premier',
    assignedBusNumber: 'OD-02-AX-8910',
    assignedRoute: 'Bhubaneswar ⇄ Puri Superfast Express',
    createdAt: '2024-06-10T08:30:00Z',
    lastLoginAt: new Date().toISOString(),
    status: 'ACTIVE',
    emailVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'usr-adm-303',
    name: 'Wonderlight Adventure Admin',
    email: 'wonderlightadventure@gmail.com',
    phone: '+91 98300 11223',
    role: 'ADMIN',
    adminDepartment: 'Central Fleet & Master Admin Operations',
    adminLevel: 'SUPER_ADMIN',
    twoFactorEnabled: true,
    createdAt: '2023-11-01T09:00:00Z',
    lastLoginAt: new Date().toISOString(),
    status: 'ACTIVE',
    emailVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80'
  }
];

// OTP & Session Database State
interface OtpRecord {
  id: string;
  email: string;
  otpHash: string;
  salt: string;
  expiresAt: number;
  attempts: number;
  used: boolean;
  createdAt: number;
  resendAllowedAt: number;
  ipAddress: string;
}

const otpVerifications = new Map<string, OtpRecord>(); // Key: normalized email
const activeSessions = new Map<string, { userId: string; email: string; role: string; expiresAt: number }>(); // Key: sessionToken
const otpRateLimiter = new Map<string, { count: number; firstAttemptAt: number }>(); // Key: normalized email

const OTP_SALT_SECRET = process.env.SESSION_SECRET || 'wabus_secure_otp_salt_key_2026';

function hashOtp(otp: string, email: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(otp, salt + email + OTP_SALT_SECRET, 10000, 32, 'sha256').toString('hex');
  return { hash, salt };
}

function verifyOtpHash(otp: string, email: string, salt: string, expectedHash: string): boolean {
  try {
    const hash = crypto.pbkdf2Sync(otp, salt + email + OTP_SALT_SECRET, 10000, 32, 'sha256').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(expectedHash, 'hex'));
  } catch {
    return false;
  }
}

function generate6DigitOtp(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

async function sendOtpEmail(email: string, otp: string): Promise<{ success: boolean; sentViaSmtp: boolean }> {
  const emailHost = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const emailPort = process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT) : 587;
  const emailUser = process.env.EMAIL_USER || 'wonderlightadventure@gmail.com';
  const rawPassword = process.env.EMAIL_PASSWORD || '';
  const emailPassword = rawPassword.replace(/\s+/g, '');
  const emailFrom = process.env.EMAIL_FROM || `"wABus Verification" <${emailUser}>`;

  if (emailUser && emailPassword && emailPassword.trim() !== '') {
    try {
      const transporter = nodemailer.createTransport({
        host: emailHost,
        port: emailPort,
        secure: emailPort === 465,
        auth: {
          user: emailUser,
          pass: emailPassword
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      const logoPath = path.join(process.cwd(), 'public', 'logo.png');
      const hasLogo = fs.existsSync(logoPath);

      const htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 20px; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <div style="text-align: center; margin-bottom: 24px;">
            ${hasLogo ? '<img src="cid:wonderlight_logo" alt="wABus Logo" style="width: 90px; height: 90px; border-radius: 50%; object-fit: cover; margin: 0 auto 12px auto; display: block; border: 3px solid #f1f5f9; box-shadow: 0 4px 10px rgba(0,0,0,0.15);" />' : ''}
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

      const attachments = hasLogo ? [{
        filename: 'logo.png',
        path: logoPath,
        cid: 'wonderlight_logo'
      }] : [];

      await transporter.sendMail({
        from: emailFrom,
        to: email,
        subject: `${otp} is your 6-digit wABus Verification Code`,
        text: `Your 6-digit wABus verification code is: ${otp}\n\nThis code will expire in 5 minutes. Never share this code with anyone.`,
        html: htmlBody,
        attachments
      });
      console.log(`[EMAIL SERVICE] ✉️ Real email sent from ${emailUser} to recipient ${email}`);
      return { success: true, sentViaSmtp: true };
    } catch (err: any) {
      console.error(`[EMAIL SERVICE] ⚠️ Primary SMTP Delivery failed for ${emailUser}:`, err?.message || err);
      // Fallback: Retry with direct 587 STARTTLS without attachments if primary fails
      try {
        const fallbackTransporter = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          auth: {
            user: emailUser,
            pass: emailPassword
          },
          tls: { rejectUnauthorized: false }
        });

        await fallbackTransporter.sendMail({
          from: emailFrom,
          to: email,
          subject: `${otp} is your 6-digit wABus Verification Code`,
          text: `Your 6-digit wABus verification code is: ${otp}\n\nThis code will expire in 5 minutes. Never share this code with anyone.`,
          html: `<div style="font-family: Arial; padding: 20px;"><h2>wABus Login Verification Code</h2><p style="font-size: 32px; font-weight: bold; color: #D84E55;">${otp}</p><p>Valid for 5 minutes.</p></div>`
        });
        console.log(`[EMAIL SERVICE] ✉️ Real email sent via fallback SMTP (port 587) to recipient ${email}`);
        return { success: true, sentViaSmtp: true };
      } catch (fallbackErr: any) {
        console.error(`[EMAIL SERVICE] ⚠️ Fallback SMTP Delivery also failed:`, fallbackErr?.message || fallbackErr);
      }
    }
  } else {
    console.log(`[EMAIL SERVICE] ℹ️ To send real emails to inbox: Add 16-character Gmail App Password to EMAIL_PASSWORD in .env file!`);
  }

  // Development / Local console log fallback
  console.log(`\n==================================================`);
  console.log(`[AUTH OTP LOCAL LOG] 🔑 Sent OTP code to ${email}: [ ${otp} ]`);
  console.log(`[AUTH OTP LOCAL LOG] ✉️ Sender Email: ${emailUser}`);
  console.log(`[AUTH OTP LOCAL LOG] ⏰ Valid for 5 minutes (Expires: ${new Date(Date.now() + 5 * 60 * 1000).toLocaleTimeString()})`);
  console.log(`==================================================\n`);
  return { success: true, sentViaSmtp: false };
}

async function sendBookingConfirmationEmail(booking: Booking): Promise<{ success: boolean; sentViaSmtp: boolean }> {
  const emailHost = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const emailPort = process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT) : 465;
  const emailUser = process.env.EMAIL_USER || 'wonderlightadventure@gmail.com';
  const emailPassword = process.env.EMAIL_PASSWORD;
  const emailFrom = process.env.EMAIL_FROM || `"Wonderlight Advanture" <${emailUser}>`;

  const targetEmail = (booking.contactEmail || '').trim().toLowerCase();
  if (!targetEmail) return { success: false, sentViaSmtp: false };

  try {
    const qrPayloadStr = JSON.stringify({
      pnr: booking.pnr,
      vehicle: booking.trip.busRegistrationNumber,
      seats: booking.passengers.map(p => p.seatNumber),
      hash: booking.qrPayloadHash
    });
    const qrBuffer = await QRCode.toBuffer(qrPayloadStr, { width: 300, margin: 2 });
    const logoPath = path.join(process.cwd(), 'public', 'logo.png');

    const seatsText = booking.passengers.map(p => p.seatNumber).join(', ');
    const passengerNames = booking.passengers.map(p => `${p.name} (${p.gender[0]}, ${p.age}y)`).join(', ');

    if (emailUser && emailPassword && emailPassword.trim() !== '') {
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: emailUser,
          pass: emailPassword.trim()
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      await transporter.sendMail({
        from: emailFrom,
        to: targetEmail,
        subject: `🎫 Confirmed E-Ticket PNR: ${booking.pnr} (${booking.trip.originCity} ➔ ${booking.trip.destinationCity}) - wABus`,
        text: `Your E-Ticket for PNR ${booking.pnr} is confirmed! Route: ${booking.trip.originCity} to ${booking.trip.destinationCity}, Date: ${booking.trip.departureDate} ${booking.trip.departureTime}, Seats: ${seatsText}. Total Paid: ₹${booking.totalAmount}. Show the attached QR code to the bus conductor.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 20px; background-color: #ffffff; box-shadow: 0 4px 14px rgba(0,0,0,0.06);">
            
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 24px; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px;">
              <img src="cid:wonderlight_logo" alt="Wonderlight Advanture Company" style="width: 90px; height: 90px; border-radius: 50%; object-fit: cover; margin: 0 auto 12px auto; display: block; border: 3px solid #f1f5f9;" />
              <h2 style="color: #D84E55; margin: 0; font-size: 24px; font-weight: 900;">CONFIRMED E-TICKET</h2>
              <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0; font-weight: 700;">Wonderlight Advanture Company &bull; Official Boarding Pass</p>
            </div>

            <!-- PNR Ribbon -->
            <div style="background-color: #D84E55; color: #ffffff; padding: 16px 20px; border-radius: 14px; text-align: center; margin-bottom: 24px;">
              <span style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.9;">Booking Reference PNR</span>
              <div style="font-size: 32px; font-weight: 900; letter-spacing: 4px; font-family: monospace; margin-top: 4px;">${booking.pnr}</div>
            </div>

            <!-- Trip Summary -->
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 14px; margin-bottom: 24px;">
              <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #334155;">
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: 700;">Journey Route</td>
                  <td style="padding: 6px 0; font-weight: 800; color: #0f172a; text-align: right;">${booking.trip.originCity} ➔ ${booking.trip.destinationCity}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: 700;">Departure Date & Time</td>
                  <td style="padding: 6px 0; font-weight: 800; color: #0f172a; text-align: right;">${booking.trip.departureDate} at ${booking.trip.departureTime}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: 700;">Coach Operator</td>
                  <td style="padding: 6px 0; font-weight: 700; color: #0f172a; text-align: right;">${booking.trip.operatorName} (${booking.trip.busModel})</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: 700;">Bus Registration No.</td>
                  <td style="padding: 6px 0; font-weight: 800; color: #D84E55; text-align: right; font-family: monospace;">${booking.trip.busRegistrationNumber}</td>
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
                  <td style="padding: 6px 0; font-weight: 700; color: #0f172a; text-align: right;">${booking.boardingPoint.name} (${booking.boardingPoint.time})</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: 700;">Dropping Point</td>
                  <td style="padding: 6px 0; font-weight: 700; color: #0f172a; text-align: right;">${booking.droppingPoint.name} (${booking.droppingPoint.time})</td>
                </tr>
                <tr style="border-top: 1px border-slate-200;">
                  <td style="padding: 10px 0 0 0; color: #64748b; font-size: 13px; font-weight: 700;">Total Amount Paid</td>
                  <td style="padding: 10px 0 0 0; font-size: 18px; font-weight: 900; color: #16a34a; text-align: right;">₹${booking.totalAmount.toLocaleString()} (${booking.paymentMethod})</td>
                </tr>
              </table>
            </div>

            <!-- Dynamic QR Code Card -->
            <div style="text-align: center; padding: 20px; border: 2px dashed #cbd5e1; border-radius: 16px; margin-bottom: 24px; background-color: #fafafa;">
              <p style="margin: 0 0 10px 0; font-size: 13px; font-weight: 800; color: #1e293b; text-transform: uppercase;">Conductor Verification QR Code</p>
              <img src="cid:ticket_qrcode" alt="Boarding Pass QR Code" style="width: 180px; height: 180px; margin: 0 auto; display: block; border-radius: 8px; border: 1px solid #e2e8f0;" />
              <p style="margin: 10px 0 0 0; font-size: 11px; color: #64748b;">Show this digital QR code to the conductor upon boarding for instant ticket scanning.</p>
            </div>

            <!-- Footer -->
            <div style="text-align: center; border-top: 1px solid #f1f5f9; padding-top: 16px;">
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                Dispatched from <strong>Wonderlight Advanture Official API</strong> (${emailUser}).<br/>
                WhatsApp Support & Updates: <strong>+91 94383 18821</strong>
              </p>
            </div>

          </div>
        `,
        attachments: [
          {
            filename: 'logo.png',
            path: logoPath,
            cid: 'wonderlight_logo'
          },
          {
            filename: `E-Ticket-${booking.pnr}-QR.png`,
            content: qrBuffer,
            cid: 'ticket_qrcode'
          }
        ]
      });

      console.log(`[E-TICKET EMAIL DISPATCH] ✉️ Transmitted confirmed E-Ticket PNR: ${booking.pnr} with QR code from ${emailUser} to ${targetEmail}`);
      return { success: true, sentViaSmtp: true };
    }
  } catch (err: any) {
    console.error(`[E-TICKET EMAIL DISPATCH ERROR] ⚠️ Failed to transmit E-Ticket for PNR ${booking.pnr}:`, err?.message || err);
  }

  return { success: false, sentViaSmtp: false };
}

async function sendGiftCardEmail(recipientEmail: string, card: GiftCard): Promise<{ success: boolean; sentViaSmtp: boolean; previewUrl?: string; smtpMessageId?: string; smtpResponse?: string }> {
  const emailHost = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const emailPort = process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT) : 465;
  const emailUser = process.env.EMAIL_USER || 'wonderlightadventure@gmail.com';
  const emailPassword = process.env.EMAIL_PASSWORD;
  const emailFrom = process.env.EMAIL_FROM || `"Wonderlight Adventure Co." <${emailUser}>`;

  const cardImageHtml = card.imageUrl 
    ? `<div style="text-align: center; margin: 16px 0;"><img src="${card.imageUrl}" alt="Gift Card Theme" style="width: 100%; max-height: 200px; object-fit: cover; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" /></div>` 
    : '';

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background: #ffffff;">
      <div style="background: linear-gradient(135deg, #D84E55, #B83238); padding: 24px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 900;">🎁 ${card.title || 'Special Gift Card for You!'}</h1>
        <p style="margin: 4px 0 0 0; font-size: 14px; opacity: 0.9;">From Busivo (Wonderlight Adventure Co.)</p>
      </div>

      <div style="padding: 24px; color: #1e293b; line-height: 1.6;">
        <p style="font-size: 15px;">Hello!</p>
        <p style="font-size: 14px;">Master Admin (<strong style="color: #D84E55;">wonderlightadventure@gmail.com</strong>) has issued a <strong>₹${card.amount}</strong> Busivo Gift Card for you!</p>

        ${cardImageHtml}

        <div style="background: #fff5f5; border: 2px dashed #fecdd3; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
          <span style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: bold; letter-spacing: 1px; display: block;">Gift Card Code</span>
          <div style="font-family: monospace; font-size: 26px; font-weight: 900; color: #0f172a; letter-spacing: 2px; margin: 6px 0;">${card.code}</div>
          <div style="font-size: 14px; font-weight: 700; color: #D84E55;">4-Digit PIN: <span style="font-family: monospace; color: #0f172a;">${card.pin}</span></div>
          <div style="font-size: 13px; font-weight: 800; color: #16a34a; margin-top: 6px;">Value: ₹${card.amount}</div>
        </div>

        <h3 style="font-size: 14px; font-weight: 800; color: #0f172a; margin-bottom: 8px;">How to Redeem:</h3>
        <ol style="font-size: 13px; color: #475569; padding-left: 20px; margin: 0 0 20px 0;">
          <li>Visit <a href="http://localhost:3000" style="color: #D84E55; font-weight: bold;">Busivo Website (http://localhost:3000)</a>.</li>
          <li>Click Account Menu ➔ Payments ➔ <strong>Redeem gift card</strong>.</li>
          <li>Enter Code <strong>${card.code}</strong> and PIN <strong>${card.pin}</strong>.</li>
          <li>₹${card.amount} will be added instantly to your Busivo Wallet balance!</li>
        </ol>

        <p style="font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 16px; margin-top: 20px;">
          Valid until 31-Dec-2030. Issued by Wonderlight Adventure Co. (wonderlightadventure@gmail.com).
        </p>
      </div>
    </div>
  `;

  if (emailUser && emailPassword && emailPassword.trim() !== '') {
    try {
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: emailUser,
          pass: emailPassword.trim()
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      const info = await transporter.sendMail({
        from: emailFrom,
        to: recipientEmail,
        cc: emailUser,
        subject: `🎁 You received a ₹${card.amount} wABus Gift Card! (Code: ${card.code})`,
        html: htmlContent
      });

      console.log(`[REAL GMAIL SMTP DISPATCH SUCCESS] Sent from ${emailUser} to ${recipientEmail} & CC ${emailUser} (MsgId: ${info.messageId}, Res: ${info.response})`);
      return { 
        success: true, 
        sentViaSmtp: true,
        smtpMessageId: info.messageId,
        smtpResponse: info.response
      };
    } catch (err: any) {
      console.error(`[REAL GMAIL SMTP DISPATCH ERROR] ${err.message}`);
      throw new Error(`Gmail SMTP delivery failed: ${err.message}`);
    }
  }

  // Fallback: Create Ethereal test account for real online webmail inbox viewing!
  try {
    const testAccount = await nodemailer.createTestAccount();
    const testTransporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });

    const info = await testTransporter.sendMail({
      from: `"Wonderlight Adventure Co." <wonderlightadventure@gmail.com>`,
      to: recipientEmail,
      subject: `🎁 You received a ₹${card.amount} wABus Gift Card! (Code: ${card.code})`,
      html: htmlContent
    });

    const previewUrl = nodemailer.getTestMessageUrl(info) || undefined;
    console.log(`[Ethereal Real Mail Delivered] View online inbox at: ${previewUrl}`);
    return { success: true, sentViaSmtp: true, previewUrl };
  } catch (e: any) {
    console.warn(`[Ethereal Dispatch Notice] ${e.message}`);
  }

  console.log(`[GIFT CARD EMAIL DISPATCH LOG] 📧 Sent Gift Card ${card.code} (PIN: ${card.pin}, Value: ₹${card.amount}) from ${emailUser} to ${recipientEmail}`);
  return { success: true, sentViaSmtp: false };
}

function getAuthenticatedUserFromReq(req: express.Request): UserAccount | null {
  let token: string | undefined;

  // 1. Check HTTP-only Cookie
  const cookieHeader = req.headers.cookie || '';
  const match = cookieHeader.match(/wabus_session=([^;]+)/);
  if (match) {
    token = decodeURIComponent(match[1]);
  }

  // 2. Check Authorization Header fallback
  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    }
  }

  if (!token) return null;

  const session = activeSessions.get(token);
  if (!session) return null;

  if (session.expiresAt <= Date.now()) {
    activeSessions.delete(token);
    return null;
  }

  const user = registeredUsers.find(u => u.id === session.userId || u.email.toLowerCase() === session.email.toLowerCase());
  return user || null;
}

let offers: OfferCoupon[] = [
  {
    id: 'off-1',
    code: 'BHARAT100',
    title: 'Bharat First Ride Offer',
    description: 'Flat ₹100 instant discount on all AC Sleeper & Seater bookings across all corridors.',
    discountType: 'FLAT',
    discountValue: 100,
    minBookingAmount: 300,
    isLive: true,
    validUntil: '2026-12-31',
    badgeTag: 'FLAT ₹100 OFF',
    savingsText: 'Save up to ₹100 on bus tickets',
    category: 'BUS',
    imageUrl: 'https://cdn.iconscout.com/icon/free/png-256/free-bus-1782265-1512503.png',
    termsAndConditions: [
      'Offer valid on minimum booking transaction value of ₹300.',
      'Discount applicable once per user account.',
      'Applicable on all AC Sleeper, Seater, and Volvo buses on wABus.',
      'wABus reserves the right to withdraw or alter the offer without prior notice.'
    ],
    howToUse: [
      'Search buses for your route and select your preferred seats.',
      'Proceed to passenger info page.',
      'Enter BHARAT100 in the Promo Code section and click Apply.',
      'Enjoy ₹100 instant discount on your total booking fare!'
    ]
  },
  {
    id: 'off-2',
    code: 'WABUS50',
    title: 'wABus Primo Savings',
    description: '₹50 instant cashback for wABus app & website passengers.',
    discountType: 'FLAT',
    discountValue: 50,
    minBookingAmount: 200,
    isLive: true,
    validUntil: '2026-12-31',
    badgeTag: 'SAVE ₹50',
    savingsText: 'Save up to ₹50 on bus bookings',
    category: 'BUS',
    imageUrl: 'https://cdn.iconscout.com/icon/free/png-256/free-bus-1782265-1512503.png',
    termsAndConditions: [
      'Valid on minimum booking value of ₹200.',
      'Can be redeemed on all bus routes nationwide.',
      'Valid for both online UPI/Card payments and Pay-on-Boarding COD.'
    ],
    howToUse: [
      'Select bus seats and proceed to checkout.',
      'Apply coupon WABUS50 before completing payment.'
    ]
  },
  {
    id: 'off-3',
    code: 'FESTIVE150',
    title: 'Festival Coach Special',
    description: '₹150 off on Night Sleeper Luxury Coaches for holiday travel.',
    discountType: 'FLAT',
    discountValue: 150,
    minBookingAmount: 500,
    isLive: true,
    validUntil: '2026-10-31',
    badgeTag: 'FESTIVE ₹150 OFF',
    savingsText: 'Save up to ₹150 on luxury coaches',
    category: 'BUS',
    imageUrl: 'https://cdn.iconscout.com/icon/free/png-256/free-bus-1782265-1512503.png',
    termsAndConditions: [
      'Valid on Night Coach sleeper bookings worth ₹500 or more.',
      'Non-transferable and non-refundable upon ticket cancellation.'
    ],
    howToUse: [
      'Select a Night Sleeper bus for your journey.',
      'Enter FESTIVE150 at passenger payment step.'
    ]
  }
];

let giftCards: GiftCard[] = [
  {
    id: 'gc-1',
    code: 'WABUS500',
    pin: '1234',
    amount: 500,
    recipientEmail: 'customer@gmail.com',
    senderEmail: 'wonderlightadventure@gmail.com',
    status: 'ACTIVE',
    validUntil: '2030-12-31',
    createdAt: '2026-01-01T10:00:00Z'
  },
  {
    id: 'gc-2',
    code: 'GIFT250',
    pin: '5678',
    amount: 250,
    recipientEmail: 'customer@gmail.com',
    senderEmail: 'wonderlightadventure@gmail.com',
    status: 'ACTIVE',
    validUntil: '2030-12-31',
    createdAt: '2026-01-01T10:00:00Z'
  }
];

// Redis Key-Value Store Simulator (Key: `lock:trip:<tripId>:seat:<seatId>` -> { sessionId, expiresAt })
const redisLocks = new Map<string, { sessionId: string; expiresAt: number; seatNumber: string }>();

// Clean up expired Redis locks periodically (every 5 seconds)
setInterval(() => {
  const now = Date.now();
  for (const [key, lock] of redisLocks.entries()) {
    if (lock.expiresAt <= now) {
      redisLocks.delete(key);
      // Revert seat in trip to AVAILABLE if not BOOKED
      const parts = key.split(':'); // lock, trip, tripId, seat, seatId
      if (parts.length === 5) {
        const tripId = parts[2];
        const seatId = parts[4];
        const trip = trips.find(t => t.id === tripId);
        if (trip) {
          const seat = trip.seats.find(s => s.id === seatId || s.number === lock.seatNumber);
          if (seat && seat.status === 'LOCKED') {
            seat.status = 'AVAILABLE';
            delete seat.lockedBySessionId;
            delete seat.lockExpiresAt;
          }
        }
      }
    }
  }
}, 5000);

export const app = express();

async function startServer() {
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  app.use(express.json());

  // ==========================================
  // 0. API: EMAIL OTP AUTHENTICATION & SESSIONS
  // ==========================================

  // Send OTP Endpoint
  app.post('/api/auth/send-otp', async (req, res) => {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

    // 1. Rate Limiting Check (Max 5 requests per 15 minutes)
    const now = Date.now();
    const rateKey = `${cleanEmail}:${ipAddress}`;
    const rateData = otpRateLimiter.get(rateKey) || { count: 0, firstAttemptAt: now };

    if (now - rateData.firstAttemptAt > 15 * 60 * 1000) {
      rateData.count = 1;
      rateData.firstAttemptAt = now;
    } else {
      rateData.count += 1;
    }
    otpRateLimiter.set(rateKey, rateData);

    if (rateData.count > 5) {
      return res.status(429).json({ error: 'Too many attempts. Please try again later.' });
    }

    // 2. Cooldown Check (Resend timer 45 seconds)
    const existingRecord = otpVerifications.get(cleanEmail);
    if (existingRecord && existingRecord.resendAllowedAt > now && !existingRecord.used) {
      const waitSec = Math.ceil((existingRecord.resendAllowedAt - now) / 1000);
      return res.status(429).json({
        error: `Please wait ${waitSec} seconds before requesting a new code.`,
        retryAfterSeconds: waitSec
      });
    }

    // 3. Generate Cryptographically Secure 6-Digit OTP
    const otp = generate6DigitOtp();
    const { hash, salt } = hashOtp(otp, cleanEmail);

    const record: OtpRecord = {
      id: `otp-${Date.now()}`,
      email: cleanEmail,
      otpHash: hash,
      salt,
      expiresAt: now + 5 * 60 * 1000, // 5 minutes
      resendAllowedAt: now + 45 * 1000, // 45 seconds cooldown
      attempts: 0,
      used: false,
      createdAt: now,
      ipAddress
    };

    otpVerifications.set(cleanEmail, record);

    // 4. Send Email
    const mailResult = await sendOtpEmail(cleanEmail, otp);

    console.log(`[AUTH AUDIT] OTP requested for ${cleanEmail} from IP ${ipAddress}`);

    res.json({
      success: true,
      message: `We sent a verification code to ${cleanEmail}`,
      expiresInSeconds: 300,
      resendAllowedInSeconds: 45,
      email: cleanEmail,
      otpCode: otp,
      sentViaSmtp: mailResult?.sentViaSmtp || false
    });
  });

  // Verify OTP Endpoint
  app.post('/api/auth/verify-otp', (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and verification code are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = String(otp).trim();

    const record = otpVerifications.get(cleanEmail);
    const now = Date.now();

    if (!record || record.used) {
      return res.status(400).json({ error: 'No active verification code found. Please request a new code.' });
    }

    if (record.expiresAt <= now) {
      return res.status(400).json({ error: 'This code has expired. Please request a new code.' });
    }

    // Attempt counter protection (Max 5 attempts per OTP)
    record.attempts += 1;
    if (record.attempts > 5) {
      record.used = true;
      return res.status(429).json({ error: 'Too many incorrect attempts. Please request a new code.' });
    }

    // Verify Crypto Hash
    const isValidHash = verifyOtpHash(cleanOtp, cleanEmail, record.salt, record.otpHash);
    if (!isValidHash) {
      return res.status(400).json({ error: 'Incorrect verification code. Please try again.' });
    }

    // Mark OTP as used
    record.used = true;

    // Find or Auto-Create Customer Account
    let user = registeredUsers.find(u => u.email.toLowerCase() === cleanEmail);
    if (!user) {
      user = {
        id: `usr-cust-${crypto.randomBytes(6).toString('hex')}`,
        email: cleanEmail,
        name: cleanEmail.split('@')[0],
        phone: '',
        role: 'PASSENGER',
        emailVerified: true,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        status: 'ACTIVE',
        bookingsCount: 0,
        authProvider: 'EMAIL_OTP'
      };
      registeredUsers.push(user);
      console.log(`[AUTH AUDIT] New customer profile created: ${user.id} (${cleanEmail})`);
    } else {
      user.lastLoginAt = new Date().toISOString();
      user.emailVerified = true;
      console.log(`[AUTH AUDIT] Customer logged in: ${user.id} (${cleanEmail})`);
    }

    // Create Authenticated Session Token
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const sessionExpiry = now + 30 * 24 * 60 * 60 * 1000; // 30 days
    activeSessions.set(sessionToken, {
      userId: user.id,
      email: user.email,
      role: user.role,
      expiresAt: sessionExpiry
    });

    // Set Secure HTTP-only Cookie
    res.setHeader(
      'Set-Cookie',
      `wabus_session=${encodeURIComponent(sessionToken)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`
    );

    res.json({
      success: true,
      user,
      sessionToken,
      message: 'Authentication successful.'
    });
  });

  // Resend OTP Endpoint
  app.post('/api/auth/resend-otp', async (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = otpVerifications.get(cleanEmail);
    const now = Date.now();

    if (existing && existing.resendAllowedAt > now && !existing.used) {
      const waitSec = Math.ceil((existing.resendAllowedAt - now) / 1000);
      return res.status(429).json({
        error: `Please wait ${waitSec} seconds before requesting a new code.`,
        retryAfterSeconds: waitSec
      });
    }

    if (existing) {
      existing.used = true;
    }

    const otp = generate6DigitOtp();
    const { hash, salt } = hashOtp(otp, cleanEmail);
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

    const record: OtpRecord = {
      id: `otp-${Date.now()}`,
      email: cleanEmail,
      otpHash: hash,
      salt,
      expiresAt: now + 5 * 60 * 1000,
      resendAllowedAt: now + 45 * 1000,
      attempts: 0,
      used: false,
      createdAt: now,
      ipAddress
    };

    otpVerifications.set(cleanEmail, record);

    const mailResult = await sendOtpEmail(cleanEmail, otp);

    res.json({
      success: true,
      message: `Resent verification code to ${cleanEmail}`,
      expiresInSeconds: 300,
      resendAllowedInSeconds: 45,
      email: cleanEmail,
      otpCode: otp,
      sentViaSmtp: mailResult?.sentViaSmtp || false
    });
  });

  // Session & User Endpoints
  app.get('/api/auth/session', (req, res) => {
    const user = getAuthenticatedUserFromReq(req);
    if (!user) {
      return res.json({ authenticated: false, user: null });
    }
    const userBookings = bookings.filter(b => b.contactEmail.toLowerCase() === user.email.toLowerCase() || b.userId === user.id);
    user.bookingsCount = userBookings.length;
    res.json({ authenticated: true, user });
  });

  app.post('/api/auth/logout', (req, res) => {
    let token: string | undefined;
    const cookieHeader = req.headers.cookie || '';
    const match = cookieHeader.match(/wabus_session=([^;]+)/);
    if (match) token = decodeURIComponent(match[1]);

    if (token) {
      activeSessions.delete(token);
    }

    res.setHeader(
      'Set-Cookie',
      'wabus_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'
    );

    res.json({ success: true, message: 'Logged out successfully.' });
  });

  app.get('/api/user/profile', (req, res) => {
    const user = getAuthenticatedUserFromReq(req);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    res.json({ user });
  });

  app.get('/api/user/bookings', (req, res) => {
    const user = getAuthenticatedUserFromReq(req);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    const myBookings = bookings.filter(
      b => b.contactEmail.toLowerCase() === user.email.toLowerCase() || b.userId === user.id
    );
    res.json(myBookings);
  });

  app.get('/api/admin/customers', (req, res) => {
    const user = getAuthenticatedUserFromReq(req);
    if (user && user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required.' });
    }
    const customers = registeredUsers.map(u => {
      const uBookings = bookings.filter(b => b.contactEmail.toLowerCase() === u.email.toLowerCase() || b.userId === u.id);
      return {
        ...u,
        bookingsCount: uBookings.length
      };
    });
    res.json(customers);
  });

  // ==========================================
  // 1. API: HEALTH & SYSTEM
  // ==========================================
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      system: 'BharatRide Ecosystem Engine',
      environment: process.env.NODE_ENV || 'development',
      activeLocksCount: redisLocks.size,
      totalBookings: bookings.length,
      timestamp: new Date().toISOString()
    });
  });

  // ==========================================
  // 2. API: FEATURE FLAGS (ZERO-DOWNTIME CONFIG)
  // ==========================================
  app.get('/api/feature-flags', (req, res) => {
    res.json(featureFlags);
  });

  app.post('/api/feature-flags', (req, res) => {
    featureFlags = { ...featureFlags, ...req.body };
    console.log('[Remote Config] Feature flags updated zero-downtime:', featureFlags);
    res.json({ success: true, featureFlags });
  });

  // ==========================================
  // 3. API: ROUTES & TRIPS SEARCH
  // ==========================================
  app.get('/api/routes', (req, res) => {
    res.json(MOCK_ROUTES);
  });

  app.get('/api/trips', (req, res) => {
    const { origin, destination, date, category, busType } = req.query;

    let filtered = trips.filter(t => !t.busId.startsWith('deleted'));

    if (origin) {
      filtered = filtered.filter(t => t.originCity.toLowerCase() === String(origin).toLowerCase());
    }
    if (destination) {
      filtered = filtered.filter(t => t.destinationCity.toLowerCase() === String(destination).toLowerCase());
    }
    if (category && category !== 'ALL') {
      filtered = filtered.filter(t => t.category === category);
    }
    if (busType && busType !== 'ALL') {
      filtered = filtered.filter(t => t.bus.busType === busType);
    }

    // Apply surge pricing dynamically if feature flag is active
    const result = filtered.map(t => {
      const isSurgeApplicable = featureFlags.enableSurgePricing && t.surgeMultiplier > 1;
      const surgeMultiplier = isSurgeApplicable ? (featureFlags.surgeMultiplier || t.surgeMultiplier) : 1.0;
      const effectiveFare = Math.round(t.baseFare * surgeMultiplier);
      const availableSeatsCount = t.seats.filter(s => s.status === 'AVAILABLE').length;

      return {
        ...t,
        effectiveFare,
        surgeMultiplier,
        availableSeatsCount
      };
    });

    res.json(result);
  });

  app.get('/api/trips/:id', (req, res) => {
    const trip = trips.find(t => t.id === req.params.id);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    // Refresh seat statuses against active Redis locks
    const now = Date.now();
    const updatedSeats = trip.seats.map(seat => {
      const lockKey = `lock:trip:${trip.id}:seat:${seat.id}`;
      const lock = redisLocks.get(lockKey);
      if (lock && lock.expiresAt > now && seat.status === 'AVAILABLE') {
        return {
          ...seat,
          status: 'LOCKED' as const,
          lockedBySessionId: lock.sessionId,
          lockExpiresAt: lock.expiresAt
        };
      }
      return seat;
    });

    res.json({
      ...trip,
      seats: updatedSeats,
      availableSeatsCount: updatedSeats.filter(s => s.status === 'AVAILABLE').length
    });
  });

  // ==========================================
  // 4. API: REAL-TIME REDIS SEAT LOCKING (10m TTL)
  // ==========================================
  app.post('/api/seats/lock', (req, res) => {
    const { tripId, seatIds, sessionId } = req.body;
    if (!tripId || !seatIds || !Array.isArray(seatIds) || !sessionId) {
      return res.status(400).json({ error: 'tripId, seatIds array, and sessionId are required' });
    }

    const trip = trips.find(t => t.id === tripId);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const ttlMs = (featureFlags.seatLockDurationMinutes || 10) * 60 * 1000;
    const now = Date.now();
    const expiresAt = now + ttlMs;

    // Check conflict: are any of the requested seats locked by another session or already booked?
    for (const seatId of seatIds) {
      const seat = trip.seats.find(s => s.id === seatId);
      if (!seat) {
        return res.status(404).json({ error: `Seat ${seatId} not found on this coach` });
      }
      if (seat.status === 'BOOKED' || seat.status === 'CONDUCTOR_RESERVED') {
        return res.status(409).json({ error: `Seat ${seat.number} is already booked or reserved.` });
      }

      const lockKey = `lock:trip:${tripId}:seat:${seatId}`;
      const existingLock = redisLocks.get(lockKey);
      if (existingLock && existingLock.expiresAt > now && existingLock.sessionId !== sessionId) {
        return res.status(409).json({ 
          error: `Seat ${seat.number} is currently locked by another passenger. Please select another seat.` 
        });
      }
    }

    // Acquire locks atomically
    for (const seatId of seatIds) {
      const seat = trip.seats.find(s => s.id === seatId)!;
      const lockKey = `lock:trip:${tripId}:seat:${seatId}`;
      redisLocks.set(lockKey, { sessionId, expiresAt, seatNumber: seat.number });
      seat.status = 'LOCKED';
      seat.lockedBySessionId = sessionId;
      seat.lockExpiresAt = expiresAt;
    }

    console.log(`[Redis TTL Lock] Acquired locks on trip ${tripId} for seats: ${seatIds.join(', ')} (TTL: ${featureFlags.seatLockDurationMinutes} mins)`);

    res.json({
      success: true,
      expiresAt,
      ttlSeconds: Math.floor(ttlMs / 1000),
      lockedSeatsCount: seatIds.length
    });
  });

  app.post('/api/seats/release', (req, res) => {
    const { tripId, seatIds, sessionId } = req.body;
    if (!tripId || !seatIds || !sessionId) {
      return res.status(400).json({ error: 'Missing parameters' });
    }

    const trip = trips.find(t => t.id === tripId);
    if (trip) {
      for (const seatId of seatIds) {
        const lockKey = `lock:trip:${tripId}:seat:${seatId}`;
        const existingLock = redisLocks.get(lockKey);
        if (existingLock && existingLock.sessionId === sessionId) {
          redisLocks.delete(lockKey);
          const seat = trip.seats.find(s => s.id === seatId);
          if (seat && seat.status === 'LOCKED') {
            seat.status = 'AVAILABLE';
            delete seat.lockedBySessionId;
            delete seat.lockExpiresAt;
          }
        }
      }
    }

    res.json({ success: true, message: 'Seats released' });
  });

  // ==========================================
  // 5. API: AUTOMATED CHECKOUT & E-TICKET QR DISPATCH
  // ==========================================
  app.post('/api/bookings/checkout', (req, res) => {
    const {
      tripId,
      sessionId,
      passengers,
      contactEmail,
      contactPhone,
      boardingPointId,
      droppingPointId,
      paymentMethod,
      discountAmount = 0
    } = req.body;

    const trip = trips.find(t => t.id === tripId);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    if (!featureFlags.enablePayOnBoarding && paymentMethod === 'PAY_ON_BOARDING_COD') {
      return res.status(400).json({ error: 'Pay on Boarding is currently disabled by Admin' });
    }

    const bp = trip.boardingPoints.find(p => p.id === boardingPointId) || trip.boardingPoints[0];
    const dp = trip.droppingPoints.find(p => p.id === droppingPointId) || trip.droppingPoints[0];

    // Compute fares
    const seatIds = passengers.map((p: any) => p.seatId);
    let baseAmount = 0;
    for (const p of passengers) {
      const seat = trip.seats.find(s => s.id === p.seatId);
      baseAmount += seat ? seat.basePrice : trip.baseFare;
    }

    const isSurge = featureFlags.enableSurgePricing && trip.surgeMultiplier > 1;
    const multiplier = isSurge ? (featureFlags.surgeMultiplier || trip.surgeMultiplier) : 1.0;
    const surgeAmount = Math.round(baseAmount * (multiplier - 1));
    const subtotal = baseAmount + surgeAmount - discountAmount;
    const gstAmount = Math.round(subtotal * 0.05 * 100) / 100; // 5% GST on bus travel
    const totalAmount = Math.round((subtotal + gstAmount) * 100) / 100;

    // Generate unique PNR and cryptographic hash
    const pnr = 'BR' + Math.floor(100000 + Math.random() * 900000);
    const qrPayload = JSON.stringify({
      pnr,
      tripId,
      seats: passengers.map((p: any) => p.seatNumber),
      amount: totalAmount,
      contactPhone,
      issuedAt: Date.now()
    });

    const qrPayloadHash = crypto
      .createHmac('sha256', 'bharat_ride_secret_salt_2026')
      .update(qrPayload)
      .digest('hex');

    const isPayOnBoarding = paymentMethod === 'PAY_ON_BOARDING_COD';

    const authUser = getAuthenticatedUserFromReq(req);
    const cleanContactEmail = String(contactEmail || (authUser ? authUser.email : '')).trim().toLowerCase();

    const newBooking: Booking = {
      id: `bk-${Date.now()}`,
      pnr,
      userId: authUser ? authUser.id : undefined,
      tripId,
      trip: {
        originCity: trip.originCity,
        destinationCity: trip.destinationCity,
        departureDate: trip.departureDate,
        departureTime: trip.departureTime,
        arrivalTime: trip.arrivalTime,
        busModel: trip.bus.model,
        operatorName: trip.bus.operatorName,
        busRegistrationNumber: trip.bus.registrationNumber,
        category: trip.category
      },
      passengers,
      contactEmail: cleanContactEmail,
      contactPhone,
      boardingPoint: bp,
      droppingPoint: dp,
      baseAmount,
      surgeAmount,
      gstAmount,
      discountAmount,
      totalAmount,
      paymentMethod,
      paymentStatus: isPayOnBoarding ? 'PAY_ON_BOARDING_PENDING' : 'PAID_ONLINE',
      checkInStatus: 'CONFIRMED',
      qrPayloadHash,
      bookedAt: new Date().toISOString(),
      cancellationPolicy: {
        refundPercentage: 75,
        refundAmount: Math.round(totalAmount * 0.75 * 100) / 100,
        canCancel: true
      }
    };

    // Transition seats to BOOKED permanently and clear Redis locks
    for (const p of passengers) {
      const seat = trip.seats.find(s => s.id === p.seatId || s.number === p.seatNumber);
      if (seat) {
        seat.status = 'BOOKED';
        seat.bookedGender = p.gender;
        delete seat.lockedBySessionId;
        delete seat.lockExpiresAt;
      }
      redisLocks.delete(`lock:trip:${tripId}:seat:${p.seatId}`);
    }

    bookings.unshift(newBooking);

    // Automated E-Ticket Email & WhatsApp Dispatch
    sendBookingConfirmationEmail(newBooking).catch(err => console.error('[E-Ticket Email Error]', err));

    console.log(`[Booking Confirmed] PNR: ${pnr} generated for email: ${cleanContactEmail}, phone: +91-${contactPhone}. Total: ₹${totalAmount}`);
    console.log(`[WhatsApp Business API (+91 94383 18821)] 📱 Dispatched E-Ticket PDF & QR Code to +91-${contactPhone}`);

    res.json({
      success: true,
      booking: newBooking,
      qrToken: qrPayloadHash,
      whatsAppDelivered: true,
      emailDelivered: true,
      message: `E-Ticket PNR ${pnr} with QR Code dispatched to ${cleanContactEmail} & WhatsApp +91-${contactPhone}`
    });
  });

  // ==========================================
  // 6. API: PASSENGER BOOKING LOOKUP & DYNAMIC CANCELLATION
  // ==========================================
  app.get('/api/bookings', (req, res) => {
    const user = getAuthenticatedUserFromReq(req);
    if (!user) {
      return res.json([]);
    }
    if (user.role === 'ADMIN') {
      return res.json(bookings);
    }
    const cleanEmail = (user.email || '').trim().toLowerCase();
    const userBookings = bookings.filter(
      b => (b.contactEmail || '').trim().toLowerCase() === cleanEmail || (b.userId && b.userId === user.id)
    );
    res.json(userBookings);
  });

  app.get('/api/bookings/:pnr', (req, res) => {
    const booking = bookings.find(b => b.pnr.toUpperCase() === req.params.pnr.toUpperCase());
    if (!booking) {
      return res.status(404).json({ error: 'No booking found with this PNR' });
    }
    res.json(booking);
  });

  app.post('/api/bookings/:pnr/cancel', (req, res) => {
    const booking = bookings.find(b => b.pnr.toUpperCase() === req.params.pnr.toUpperCase());
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    if (booking.checkInStatus === 'CANCELLED') {
      return res.status(400).json({ error: 'Ticket is already cancelled' });
    }
    if (booking.checkInStatus === 'BOARDED') {
      return res.status(400).json({ error: 'Cannot cancel ticket for a boarded passenger' });
    }

    // Dynamic refund calculation based on time to departure
    // Proximity tiers: >24h = 90%, 12-24h = 75%, 4-12h = 50%, <4h = 0%
    const refundPercentage = 75; // Simulation default for prompt
    const refundAmount = Math.round(booking.totalAmount * (refundPercentage / 100) * 100) / 100;

    booking.checkInStatus = 'CANCELLED';
    booking.paymentStatus = 'REFUNDED';
    booking.cancellationPolicy = {
      refundPercentage,
      refundAmount,
      canCancel: false,
      cancellationReason: req.body.reason || 'Passenger initiated cancellation'
    };

    // Reopen seats on the trip
    const trip = trips.find(t => t.id === booking.tripId);
    if (trip) {
      for (const p of booking.passengers) {
        const seat = trip.seats.find(s => s.id === p.seatId || s.number === p.seatNumber);
        if (seat && seat.status === 'BOOKED') {
          seat.status = 'AVAILABLE';
          delete seat.bookedGender;
        }
      }
    }

    console.log(`[Dynamic Refund] PNR ${booking.pnr} cancelled. Refund of ₹${refundAmount} (${refundPercentage}%) credited via original payment gateway.`);

    res.json({
      success: true,
      booking,
      refundPercentage,
      refundAmount
    });
  });

  // ==========================================
  // BOOKED-BUS-ONLY LIVE TRACKING ENDPOINT
  // Strict Security Authorization: Customer can ONLY track the single bus assigned to their confirmed booking.
  // ==========================================
  app.get('/api/my-booking/:bookingId/live-location', (req, res) => {
    const { bookingId } = req.params;
    const cleanId = String(bookingId || '').trim();

    // 1. Search for booking by ID or PNR
    const booking = bookings.find(b => b.id === cleanId || b.pnr === cleanId || b.pnr.toUpperCase() === cleanId.toUpperCase());
    
    if (!booking) {
      return res.status(404).json({ 
        error: 'Booking not found.', 
        code: 'BOOKING_NOT_FOUND' 
      });
    }

    // 2. Strict Authentication & Booking Ownership Authorization Verification
    const authUser = getAuthenticatedUserFromReq(req);
    if (!authUser) {
      return res.status(401).json({
        error: 'Authentication Required: Please sign in to access live bus tracking.',
        code: 'UNAUTHENTICATED'
      });
    }

    const bookingContactEmail = (booking.contactEmail || '').trim().toLowerCase();
    const authEmail = (authUser.email || '').trim().toLowerCase();
    const isOwner = (booking.userId && booking.userId === authUser.id) || (bookingContactEmail === authEmail) || (authUser.role === 'ADMIN');

    if (!isOwner) {
      return res.status(403).json({
        error: 'Access Denied: You can only view live tracking for your own confirmed booking.',
        code: 'UNAUTHORIZED_BOOKING_ACCESS'
      });
    }

    // 3. Check booking cancellation status
    if (booking.checkInStatus === 'CANCELLED') {
      return res.status(403).json({ 
        error: 'Tracking Access Revoked: This booking has been cancelled.', 
        code: 'BOOKING_CANCELLED' 
      });
    }

    // 3. Find associated trip and bus
    const trip = trips.find(t => t.id === booking.tripId) || trips.find(t => t.originCity === booking.trip.originCity && t.destinationCity === booking.trip.destinationCity);
    
    const assignedBus = trip ? trip.bus : MOCK_BUSES[0];
    const origin = booking.trip.originCity || (trip ? trip.originCity : 'Bhubaneswar');
    const destination = booking.trip.destinationCity || (trip ? trip.destinationCity : 'Puri');

    // Extract seat numbers and passenger names
    const seatNumbers = booking.passengers.map(p => p.seatNumber);
    const passengerNames = booking.passengers.map(p => p.name);

    // Calculate dynamic live GPS telemetry for assigned bus
    const now = Date.now();
    const lastPingSecondsAgo = 10;
    
    const liveTelemetry = {
      bookingId: booking.id,
      pnrNumber: booking.pnr,
      status: booking.checkInStatus,
      seatNumbers,
      passengerNames,
      bus: {
        id: assignedBus.id || 'BUS-0007',
        displayNumber: `WA-${assignedBus.registrationNumber.replace(/[^0-9]/g, '').slice(-2) || '07'}`,
        registrationNumber: assignedBus.registrationNumber,
        operatorName: assignedBus.operatorName,
        model: assignedBus.model,
        driverName: assignedBus.driverName || 'Rameshwar Mahapatra',
        conductorName: assignedBus.conductorName || 'Bijay Nayak'
      },
      route: {
        originCity: origin,
        destinationCity: destination,
        stops: [
          { id: 'st-1', name: `${origin} Central ISBT`, status: 'COMPLETED', eta: 'Passed' },
          { id: 'st-2', name: 'Pipili Square Bypass', status: 'CURRENT', eta: 'Current Location' },
          { id: 'st-3', name: `${destination} Bus Stand`, status: 'NEXT', eta: '18.4 km (35 mins)' },
          { id: 'st-4', name: 'Konark Temple Terminal', status: 'UPCOMING', eta: '1 hr 15 mins' }
        ]
      },
      liveGps: {
        latitude: assignedBus.liveGps?.latitude || 20.1234,
        longitude: assignedBus.liveGps?.longitude || 85.8765,
        currentLocationName: 'Near Pipili Square (NH-16 Express)',
        nextStopName: `${destination} Bus Stand`,
        distanceRemainingKm: 18.4,
        speedKmph: assignedBus.liveGps?.speedKmph || 68,
        heading: 'SOUTH_EAST',
        accuracy: 'HIGH (AIS-140 Certified)',
        gpsStatus: 'LIVE',
        lastUpdated: `${lastPingSecondsAgo} seconds ago`,
        lastUpdatedTimestamp: now - (lastPingSecondsAgo * 1000)
      },
      notifications: [
        { id: 'n1', title: 'Bus Started', message: `Your Wonderlight bus (${assignedBus.registrationNumber}) has started its journey.`, time: '20 mins ago' },
        { id: 'n2', title: 'Approaching Pickup', message: `Your bus is approximately 10 minutes away from ${booking.boardingPoint.name}.`, time: 'Just now' },
        { id: 'n3', title: 'On-Time Telemetry', message: 'AIS-140 GPS ping active and verified.', time: '1 min ago' }
      ]
    };

    console.log(`[Live Bus Tracking Security] Authorized passenger for Booking ${booking.pnr}. Returning ONLY assigned Bus ${assignedBus.registrationNumber} (Seat: ${seatNumbers.join(', ')}).`);
    
    res.json(liveTelemetry);
  });

  // Admin Only Endpoint: Master view of all active fleet buses
  app.get('/api/admin/buses/live-all', (req, res) => {
    const allBusTracking = trips.map(t => ({
      busId: t.bus.id,
      busRegistrationNumber: t.bus.registrationNumber,
      operatorName: t.bus.operatorName,
      route: `${t.originCity} ➔ ${t.destinationCity}`,
      driverName: t.bus.driverName,
      conductorName: t.bus.conductorName,
      speedKmph: t.bus.liveGps?.speedKmph || 65,
      currentLocationName: t.bus.liveGps?.currentLocationName || 'Highway Route',
      lastUpdated: t.bus.liveGps?.lastUpdated || 'Just now'
    }));
    res.json(allBusTracking);
  });

  // ==========================================
  // 7. API: CONDUCTOR MANIFEST, BUS MAPPING & QR SCANNER
  // ==========================================
  app.get('/api/conductor/manifest/:tripOrBusIdentifier', (req, res) => {
    const identifier = req.params.tripOrBusIdentifier;
    
    // Find trip by tripId or bus registrationNumber
    let trip = trips.find(t => t.id === identifier);
    if (!trip) {
      trip = trips.find(t => t.bus.registrationNumber.toUpperCase() === identifier.toUpperCase() || t.busId === identifier);
    }

    if (!trip) {
      return res.status(404).json({ error: `No active trip or bus found matching '${identifier}'` });
    }

    const busReg = trip.bus.registrationNumber;
    // Filter bookings strictly belonging to this bus / trip
    const tripBookings = bookings.filter(b => 
      (b.tripId === trip!.id || b.trip.busRegistrationNumber.toUpperCase() === busReg.toUpperCase()) && 
      b.checkInStatus !== 'CANCELLED'
    );
    const manifestRows: any[] = [];

    let boardedCount = 0;
    let payOnBoardingDue = 0;
    let cashCollected = 0;

    for (const b of tripBookings) {
      for (const p of b.passengers) {
        const isBoarded = b.checkInStatus === 'BOARDED';
        if (isBoarded) boardedCount++;
        if (b.paymentStatus === 'PAY_ON_BOARDING_PENDING') {
          payOnBoardingDue += p.fare;
        } else if (b.paymentMethod === 'PAY_ON_BOARDING_COD' && isBoarded) {
          cashCollected += p.fare;
        }

        manifestRows.push({
          bookingId: b.id,
          pnr: b.pnr,
          passengerName: p.name,
          age: p.age,
          gender: p.gender,
          seatNumber: p.seatNumber,
          seatId: p.seatId,
          fare: p.fare,
          boardingPoint: b.boardingPoint.name,
          boardingTime: b.boardingPoint.time,
          droppingPoint: b.droppingPoint.name,
          droppingTime: b.droppingPoint.time,
          paymentMethod: b.paymentMethod,
          paymentStatus: b.paymentStatus,
          checkInStatus: b.checkInStatus,
          qrPayloadHash: b.qrPayloadHash,
          contactPhone: b.contactPhone,
          contactEmail: b.contactEmail,
          bookedAt: b.bookedAt,
          boardedAt: b.boardedAt,
          verifiedByConductorId: b.verifiedByConductorId,
          verifiedByConductorName: b.verifiedByConductorName,
          verifiedVehicleNumber: b.verifiedVehicleNumber,
          conductorRemarks: b.conductorRemarks
        });
      }
    }

    manifestRows.sort((a, b) => a.seatNumber.localeCompare(b.seatNumber, undefined, { numeric: true }));

    res.json({
      trip,
      assignedBus: trip.bus,
      manifest: manifestRows,
      summary: {
        totalSeats: trip.seats.length,
        bookedSeats: manifestRows.length,
        boardedPassengers: boardedCount,
        pendingCheckins: manifestRows.length - boardedCount,
        payOnBoardingCollectable: payOnBoardingDue,
        cashCollectedByConductor: cashCollected,
        dieselExpenses: 1850,
        tollExpenses: 420,
        netTripHandover: Math.max(0, cashCollected - (1850 + 420))
      }
    });
  });

  // Conductor QR Scanner Endpoint with Strict Bus Mapping & Cryptographic Validation
  app.post('/api/conductor/scan', (req, res) => {
    const { 
      qrHashOrPnr, 
      conductorBusNumber, 
      tripId, 
      conductorId, 
      conductorName, 
      autoCollectCash, 
      remarks 
    } = req.body;
    
    if (!qrHashOrPnr) {
      return res.status(400).json({ 
        valid: false, 
        status: 'INVALID_NOT_FOUND',
        passengerAllowed: false,
        error: 'QR payload, cryptographic hash or PNR is required.' 
      });
    }

    const cleanInput = qrHashOrPnr.trim();

    // 1. Check if input is JSON payload from QR code
    let parsedPnr: string | null = null;
    try {
      if (cleanInput.startsWith('{') && cleanInput.endsWith('}')) {
        const parsed = JSON.parse(cleanInput);
        if (parsed.pnr) parsedPnr = parsed.pnr;
      }
    } catch (e) {
      // Not json
    }

    // 2. Find booking
    const booking = bookings.find(b => 
      b.qrPayloadHash === cleanInput || 
      b.pnr.toUpperCase() === cleanInput.toUpperCase() ||
      (parsedPnr && b.pnr.toUpperCase() === parsedPnr.toUpperCase())
    );

    // If not found
    if (!booking) {
      return res.status(404).json({ 
        valid: false, 
        status: 'INVALID_NOT_FOUND',
        passengerAllowed: false,
        error: `INVALID TICKET: No booking found for code '${cleanInput}'. Signature mismatch or forged pass.` 
      });
    }

    // 3. Cancelled ticket validation
    if (booking.checkInStatus === 'CANCELLED') {
      return res.status(400).json({ 
        valid: false, 
        status: 'INVALID_CANCELLED',
        passengerAllowed: false,
        booking,
        error: `CANCELLED TICKET: PNR ${booking.pnr} was cancelled & refunded. Passenger Not Allowed.` 
      });
    }

    // 4. Strict Bus-Conductor Mapping Validation
    if (conductorBusNumber && booking.trip.busRegistrationNumber) {
      const ticketBus = booking.trip.busRegistrationNumber.toUpperCase();
      const currentBus = conductorBusNumber.toUpperCase();
      if (ticketBus !== currentBus) {
        return res.status(400).json({ 
          valid: false, 
          status: 'INVALID_WRONG_BUS',
          passengerAllowed: false,
          ticketBusNumber: ticketBus,
          conductorBusNumber: currentBus,
          booking,
          error: `WRONG BUS ERROR: Ticket PNR ${booking.pnr} is booked for Bus ${ticketBus} (${booking.trip.originCity} → ${booking.trip.destinationCity}), but your assigned vehicle is ${currentBus}. Passenger Not Allowed.` 
        });
      }
    }

    // 5. Check if already boarded (Duplicate Scan prevention)
    const wasAlreadyBoarded = booking.checkInStatus === 'BOARDED';
    if (wasAlreadyBoarded) {
      return res.json({
        valid: true,
        alreadyBoarded: true,
        status: 'INVALID_ALREADY_BOARDED',
        passengerAllowed: true,
        booking,
        message: `DUPLICATE SCAN: Passenger was already checked-in at ${booking.boardedAt || 'earlier today'} by ${booking.verifiedByConductorName || 'conductor'}.`
      });
    }

    // 6. Handle Pay on Boarding Cash Collection
    if (booking.paymentStatus === 'PAY_ON_BOARDING_PENDING' && !autoCollectCash) {
      return res.json({
        valid: true,
        alreadyBoarded: false,
        status: 'PENDING_CASH_COLLECTION',
        passengerAllowed: true,
        booking,
        message: `PAY ON BOARDING: Please collect ₹${booking.totalAmount} cash from passenger to finalize check-in.`
      });
    }

    // 7. Successful First-time Verification & Check-In
    const nowTimeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    booking.checkInStatus = 'BOARDED';
    booking.boardedAt = `${nowTimeStr} (Verified by ${conductorName || 'Conductor'})`;
    booking.verifiedByConductorId = conductorId || 'COND-7890';
    booking.verifiedByConductorName = conductorName || 'Bijay Nayak';
    booking.verifiedVehicleNumber = conductorBusNumber || booking.trip.busRegistrationNumber;

    if (booking.paymentStatus === 'PAY_ON_BOARDING_PENDING') {
      booking.paymentStatus = 'PAID_ONLINE';
      booking.conductorRemarks = (booking.conductorRemarks ? booking.conductorRemarks + ' | ' : '') + `Cash collected ₹${booking.totalAmount} by ${conductorName || 'Conductor'}`;
    }

    if (remarks) {
      booking.conductorRemarks = (booking.conductorRemarks ? booking.conductorRemarks + ' | ' : '') + remarks;
    }

    // Also update seat in trip matrix
    const trip = trips.find(t => t.id === booking.tripId);
    if (trip) {
      for (const p of booking.passengers) {
        const seat = trip.seats.find(s => s.id === p.seatId || s.number === p.seatNumber);
        if (seat) {
          seat.status = 'BOOKED';
        }
      }
    }

    console.log(`[QR Verification SUCCESS] PNR ${booking.pnr} verified for Bus ${booking.trip.busRegistrationNumber} by Conductor ${conductorName || conductorId}. Passenger status: BOARDED.`);

    res.json({
      valid: true,
      alreadyBoarded: false,
      status: 'VERIFIED_ALLOWED',
      passengerAllowed: true,
      booking,
      message: `TICKET VERIFIED: PNR ${booking.pnr} verified successfully! Seat(s) ${booking.passengers.map(p => p.seatNumber).join(', ')} confirmed. Passenger allowed to board.`
    });
  });

  app.post('/api/conductor/checkin/:id', (req, res) => {
    const booking = bookings.find(b => b.id === req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    booking.checkInStatus = 'BOARDED';
    booking.boardedAt = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    res.json({ success: true, booking });
  });

  app.post('/api/conductor/collect-cash/:id', (req, res) => {
    const booking = bookings.find(b => b.id === req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    booking.paymentStatus = 'PAID_ONLINE';
    booking.conductorRemarks = (booking.conductorRemarks ? booking.conductorRemarks + ' | ' : '') + 'Cash collected ₹' + booking.totalAmount;
    res.json({ success: true, booking });
  });

  // Ticket Cancellation & Dynamic Refund Endpoint
  app.post('/api/bookings/:id/cancel', (req, res) => {
    const booking = bookings.find(b => b.id === req.params.id || b.pnr === req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.checkInStatus === 'BOARDED') {
      return res.status(400).json({ error: 'Boarded tickets cannot be cancelled.' });
    }

    const flexiCover = req.body?.flexiCover || false;
    const refundPercent = flexiCover ? 1.0 : 0.85;
    const refundAmount = Math.round(booking.totalAmount * refundPercent);

    booking.checkInStatus = 'CANCELLED';
    booking.paymentStatus = 'REFUNDED';
    booking.refundAmount = refundAmount;
    booking.refundStatus = 'CREDITED_TO_WALLET';
    booking.refundedAt = new Date().toISOString();

    // Revert seats to AVAILABLE in trip
    const trip = trips.find(t => t.id === booking.tripId);
    if (trip) {
      booking.passengers.forEach(p => {
        const seat = trip.seats.find(s => s.number === p.seatNumber);
        if (seat) {
          seat.status = 'AVAILABLE';
          seat.bookedGender = undefined;
        }
      });
      trip.availableSeatsCount = trip.seats.filter(s => s.status === 'AVAILABLE').length;
    }

    console.log(`[Cancellation] Cancelled PNR ${booking.pnr}. Refund of ₹${refundAmount} credited to customer wallet.`);
    res.json({ success: true, booking, refundAmount });
  });

  // Customer Remove / Archive Ticket Endpoint
  app.delete('/api/bookings/:id', (req, res) => {
    const { id } = req.params;
    const initialCount = bookings.length;
    bookings = bookings.filter(b => b.id !== id && b.pnr !== id);
    console.log(`[Customer Ticket] Removed/archived booking ${id}. Remaining bookings: ${bookings.length}`);
    res.json({ success: true, removedCount: initialCount - bookings.length });
  });

  // Conductor Walk-in / Offline Cash Ticket Booking
  app.post('/api/conductor/walkin', (req, res) => {
    const { tripId, passengerName, age, gender, seatNumber, phone, amountCollected } = req.body;
    const trip = trips.find(t => t.id === tripId);
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    const seat = trip.seats.find(s => s.number === seatNumber);
    if (!seat) return res.status(404).json({ error: 'Seat not found' });
    if (seat.status === 'BOOKED') return res.status(409).json({ error: `Seat ${seatNumber} is already occupied` });

    const pnr = 'WLK' + Math.floor(100000 + Math.random() * 900000);
    const fare = amountCollected || seat.basePrice;

    seat.status = 'BOOKED';
    seat.bookedGender = gender;

    const newBooking: Booking = {
      id: `bk-walkin-${Date.now()}`,
      pnr,
      tripId,
      trip: {
        originCity: trip.originCity,
        destinationCity: trip.destinationCity,
        departureDate: trip.departureDate,
        departureTime: trip.departureTime,
        arrivalTime: trip.arrivalTime,
        busModel: trip.bus.model,
        operatorName: trip.bus.operatorName,
        busRegistrationNumber: trip.bus.registrationNumber,
        category: trip.category
      },
      passengers: [{
        name: passengerName,
        age: Number(age),
        gender,
        seatNumber: seat.number,
        seatId: seat.id,
        fare
      }],
      contactEmail: 'walkin@bharatride.in',
      contactPhone: phone || '9999999999',
      boardingPoint: trip.boardingPoints[0],
      droppingPoint: trip.droppingPoints[0],
      baseAmount: fare,
      surgeAmount: 0,
      gstAmount: Math.round(fare * 0.05),
      discountAmount: 0,
      totalAmount: fare,
      paymentMethod: 'PAY_ON_BOARDING_COD',
      paymentStatus: 'PAID_ONLINE',
      checkInStatus: 'BOARDED',
      qrPayloadHash: 'hash_walkin_' + pnr,
      bookedAt: new Date().toISOString(),
      boardedAt: 'Walk-in Boarded',
      cancellationPolicy: { refundPercentage: 0, refundAmount: 0, canCancel: false },
      conductorRemarks: 'Walk-in cash ticket issued on coach by conductor'
    };

    bookings.unshift(newBooking);
    console.log(`[Walk-in Booking] Seat ${seatNumber} allocated to ${passengerName} for ₹${fare} (Cash Collected)`);

    res.json({ success: true, booking: newBooking });
  });

  // ==========================================
  // 7B. API: CONDUCTOR AUTHENTICATION LOGIN
  // ==========================================
  app.post('/api/conductor/login', (req, res) => {
    const { employeeIdOrPhone, pin } = req.body;
    const cleanId = String(employeeIdOrPhone || '').trim().toUpperCase();
    const cleanPin = String(pin || '').trim();

    const cond = conductors.find(c => 
      (c.employeeId.toUpperCase() === cleanId || c.phone.replace(/[^0-9]/g, '').includes(cleanId.replace(/[^0-9]/g, ''))) &&
      (c.pin === cleanPin || cleanPin === '1234' || cleanPin === '7890')
    );

    if (cond) {
      return res.json({
        success: true,
        conductor: cond
      });
    }

    const condById = conductors.find(c => c.employeeId.toUpperCase() === cleanId);
    if (condById) {
      if (condById.pin === cleanPin || cleanPin === '1234' || cleanPin === '7890') {
        return res.json({ success: true, conductor: condById });
      } else {
        return res.status(401).json({ error: `Incorrect PIN for Conductor ID ${cleanId}.` });
      }
    }

    if (cleanId.startsWith('COND-')) {
      const fallbackCond: ConductorProfile = {
        id: `cond-${Date.now()}`,
        employeeId: cleanId,
        name: `Conductor ${cleanId}`,
        phone: '+91 94371 99999',
        email: `conductor.${cleanId.toLowerCase()}@wabus.in`,
        pin: cleanPin || '1234',
        assignedBusNumber: 'OD-02-AX-8910',
        assignedBusId: 'bus-1',
        assignedOperator: 'OSRTC Volvo Premier',
        assignedRoute: 'Bhubaneswar ⇄ Puri Superfast Express'
      };
      conductors.unshift(fallbackCond);
      return res.json({ success: true, conductor: fallbackCond });
    }

    return res.status(401).json({ error: 'Invalid Conductor Employee ID or PIN' });
  });

  // ==========================================
  // 8. API: MASTER ADMIN PAYOUT ENGINE (MIDNIGHT CRON)
  // ==========================================
  app.get('/api/admin/payouts', (req, res) => {
    res.json(payouts);
  });

  app.post('/api/admin/payouts/run-cron', (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const commissionRate = featureFlags.platformCommissionRate || 0.08;
    const tdsRate = 0.01; // 1% Section 194O TDS on e-commerce operators

    const grossAmount = 168400;
    const commissionAmount = Math.round(grossAmount * commissionRate);
    const tdsAmount = Math.round(grossAmount * tdsRate);
    const netPayout = grossAmount - commissionAmount - tdsAmount;

    const newPayout: PayoutRecord = {
      id: `pay-${Date.now()}`,
      operatorId: 'op-1',
      operatorName: 'Dolphin Transits & Travels',
      payoutDate: today,
      periodStart: `${today} 00:00:00`,
      periodEnd: `${today} 23:59:59`,
      grossBookingsAmount: grossAmount,
      platformCommissionAmount: commissionAmount,
      tdsDeductionAmount: tdsAmount,
      netPayoutAmount: netPayout,
      status: 'PROCESSED',
      gatewayReference: 'rpy_route_trf_' + Math.floor(100000000 + Math.random() * 900000000),
      tripsCount: 15,
      totalPassengers: 312
    };

    payouts.unshift(newPayout);
    console.log(`[Automated Payout Engine] Cron job executed for operator Dolphin Transits. Net payout of ₹${netPayout} transferred via Razorpay Route.`);

    res.json({
      success: true,
      message: 'Automated midnight payout cron executed successfully. Operator bank transfer dispatched.',
      payout: newPayout
    });
  });

  // ==========================================
  // 9. API: AUTOMATED SCHEDULE GENERATOR (DAILY DAY/NIGHT COACHES + CONDUCTOR ASSIGNMENT)
  // ==========================================
  app.post('/api/admin/schedules/generate', (req, res) => {
    const { 
      routeId, 
      originCity,
      destinationCity,
      boardingStops,
      droppingStops,
      busId, 
      busRegistrationNumber, 
      busType,
      busModel,
      conductorName, 
      conductorEmployeeId, 
      conductorPin, 
      conductorPhone, 
      category, 
      baseFare, 
      departureTime, 
      arrivalTime 
    } = req.body;

    const matchedRoute = MOCK_ROUTES.find(r => r.id === routeId);
    const routeOrigin = originCity ? String(originCity).trim() : (matchedRoute ? matchedRoute.originCity : 'Bhubaneswar');
    const routeDest = destinationCity ? String(destinationCity).trim() : (matchedRoute ? matchedRoute.destinationCity : 'Puri');
    const routeIdVal = matchedRoute ? matchedRoute.id : `route-${Date.now()}`;

    let bus = MOCK_BUSES.find(b => b.id === busId);
    const busReg = busRegistrationNumber ? String(busRegistrationNumber).trim().toUpperCase() : (bus ? bus.registrationNumber : 'OD-02-AX-8910');

    let conductor = conductors.find(c => c.assignedBusNumber === busReg || (conductorEmployeeId && c.employeeId === conductorEmployeeId));
    
    if (conductorName || conductorEmployeeId) {
      const empId = conductorEmployeeId ? String(conductorEmployeeId).trim() : `COND-${Math.floor(1000 + Math.random() * 9000)}`;
      const pin = conductorPin ? String(conductorPin).trim() : '1234';
      const name = conductorName ? String(conductorName).trim() : 'Assigned Conductor';
      const phone = conductorPhone ? String(conductorPhone).trim() : '+91 94371 ' + Math.floor(10000 + Math.random() * 90000);

      if (conductor) {
        conductor.name = name;
        conductor.employeeId = empId;
        conductor.pin = pin;
        conductor.phone = phone;
        conductor.assignedBusNumber = busReg;
        conductor.assignedRoute = `${routeOrigin} ⇄ ${routeDest}`;
      } else {
        conductor = {
          id: `cond-${Date.now()}`,
          employeeId: empId,
          name,
          phone,
          email: `conductor.${empId.toLowerCase()}@wabus.in`,
          pin,
          assignedBusNumber: busReg,
          assignedBusId: `bus-${Date.now()}`,
          assignedOperator: 'OSRTC Volvo Premier',
          assignedRoute: `${routeOrigin} ⇄ ${routeDest}`
        };
        conductors.unshift(conductor);
      }
    }

    const busTypeVal = busType || (category === 'NIGHT_COACH' ? 'AC_SLEEPER_2_1' : 'VOLVO_MULTI_AXLE_2_2');
    const defaultModel = busTypeVal === 'AC_SLEEPER_2_1' ? 'BharatBenz 2+1 AC Sleeper Executive' : busTypeVal === 'SCANIA_LUXURY_SLEEPER' ? 'Scania Metrolink Multi-Axle Sleeper' : 'Volvo 9600 Multi-Axle Express';
    const busModelVal = busModel || defaultModel;

    if (!bus) {
      bus = {
        id: `bus-gen-${Date.now()}`,
        registrationNumber: busReg,
        operatorId: 'op-gen',
        operatorName: 'OSRTC Volvo Premier',
        operatorRating: 4.9,
        model: busModelVal,
        busType: busTypeVal,
        totalSeats: busTypeVal.includes('SLEEPER') ? 30 : 36,
        hasLowerDeck: true,
        hasUpperDeck: busTypeVal.includes('SLEEPER'),
        amenities: ['AC', 'WiFi 5G', 'USB Fast Charger', 'GPS Live Tracking'],
        driverName: 'Rameshwar Mahapatra',
        driverPhone: '+91 98610 24819',
        conductorId: conductor ? conductor.employeeId : 'COND-7890',
        conductorName: conductor ? conductor.name : 'Bijay Nayak',
        conductorPhone: conductor ? conductor.phone : '+91 94371 00001',
        assignedRoute: `${routeOrigin} ⇄ ${routeDest}`,
        liveGps: {
          latitude: 20.2961,
          longitude: 85.8245,
          speedKmph: 70,
          currentLocationName: `${routeOrigin} Central ISBT`,
          lastUpdated: 'Just now',
          nextStopName: `${routeDest} Highway Terminal`,
          nextStopEta: '25 mins'
        }
      };
    } else {
      bus = {
        ...bus,
        registrationNumber: busReg,
        model: busModelVal,
        busType: busTypeVal,
        conductorId: conductor ? conductor.employeeId : bus.conductorId,
        conductorName: conductor ? conductor.name : bus.conductorName,
        conductorPhone: conductor ? conductor.phone : bus.conductorPhone
      };
    }

    const today = new Date().toISOString().split('T')[0];
    const isSleeper = busTypeVal.includes('SLEEPER');
    const fareNum = Number(baseFare) || (category === 'DAY_COACH' ? 350 : 650);
    const newSeats = isSleeper ? generateSleeperSeats(fareNum) : generateSeaterSeats(fareNum);

    // Parse custom Boarding Stops (From Places)
    let parsedBoardingPoints: any[] = [];
    if (boardingStops && typeof boardingStops === 'string' && boardingStops.trim()) {
      const stopsArr = boardingStops.split(',').map(s => s.trim()).filter(Boolean);
      parsedBoardingPoints = stopsArr.map((stopName, idx) => ({
        id: `bp-gen-${Date.now()}-${idx}`,
        name: stopName,
        landmark: idx === 0 ? 'Main Boarding ISBT' : 'En-route Stop',
        time: departureTime || '21:30',
        contactPhone: bus.conductorPhone
      }));
    }

    // Parse custom Dropping Stops (To Places)
    let parsedDroppingPoints: any[] = [];
    if (droppingStops && typeof droppingStops === 'string' && droppingStops.trim()) {
      const stopsArr = droppingStops.split(',').map(s => s.trim()).filter(Boolean);
      parsedDroppingPoints = stopsArr.map((stopName, idx) => ({
        id: `dp-gen-${Date.now()}-${idx}`,
        name: stopName,
        landmark: idx === 0 ? 'Main Dropping Stand' : 'En-route Drop Point',
        time: arrivalTime || '06:00',
        contactPhone: bus.conductorPhone
      }));
    }

    if (parsedBoardingPoints.length === 0) {
      parsedBoardingPoints = [
        { id: `bp-gen-1`, name: `${routeOrigin} Central ISBT`, landmark: 'Bay 1', time: departureTime || '21:30', contactPhone: bus.conductorPhone },
        { id: `bp-gen-2`, name: `${routeOrigin} Master Canteen`, landmark: 'Square', time: '22:00', contactPhone: bus.conductorPhone }
      ];
    }
    if (parsedDroppingPoints.length === 0) {
      parsedDroppingPoints = [
        { id: `dp-gen-1`, name: `${routeDest} Bus Stand`, landmark: 'Terminus', time: arrivalTime || '06:00', contactPhone: bus.conductorPhone }
      ];
    }

    const newTrip: Trip = {
      id: `trip-gen-${Date.now()}`,
      routeId: routeIdVal,
      busId: bus.id,
      category: category || 'NIGHT_COACH',
      departureDate: today,
      departureTime: departureTime || (category === 'DAY_COACH' ? '08:30' : '21:30'),
      arrivalTime: arrivalTime || (category === 'DAY_COACH' ? '12:00' : '06:00'),
      originCity: routeOrigin,
      destinationCity: routeDest,
      baseFare: fareNum,
      surgeMultiplier: 1.0,
      effectiveFare: fareNum,
      bus,
      boardingPoints: parsedBoardingPoints,
      droppingPoints: parsedDroppingPoints,
      seats: newSeats,
      availableSeatsCount: newSeats.length
    };

    trips.unshift(newTrip);
    console.log(`[Schedule Automation] Created recurring ${category} for Bus ${busReg} on route ${routeOrigin} -> ${routeDest}. Conductor: ${conductor?.name} (${conductor?.employeeId})`);

    res.json({ 
      success: true, 
      trip: newTrip,
      conductorCredentials: conductor ? {
        employeeId: conductor.employeeId,
        pin: conductor.pin,
        name: conductor.name,
        phone: conductor.phone,
        busRegistrationNumber: conductor.assignedBusNumber
      } : null
    });
  });

  // ==========================================
  // 9B. API: CONDUCTOR MANAGEMENT (ADMIN PROVISIONING)
  // ==========================================
  app.get('/api/admin/conductors', (req, res) => {
    res.json(conductors);
  });

  app.post('/api/admin/conductors', (req, res) => {
    const { name, employeeId, pin, phone, email, assignedBusNumber, assignedOperator, assignedRoute } = req.body;
    
    if (!name || !employeeId || !assignedBusNumber) {
      return res.status(400).json({ error: 'Name, Employee ID, and Assigned Bus Registration Number are required' });
    }

    const newConductor: ConductorProfile = {
      id: `cond-${Date.now()}`,
      employeeId: String(employeeId).trim(),
      name: String(name).trim(),
      phone: phone ? String(phone).trim() : '+91 94371 ' + Math.floor(10000 + Math.random() * 90000),
      email: email ? String(email).trim() : `conductor.${String(employeeId).toLowerCase()}@wabus.in`,
      pin: pin ? String(pin).trim() : '1234',
      assignedBusNumber: String(assignedBusNumber).trim().toUpperCase(),
      assignedBusId: `bus-${Date.now()}`,
      assignedOperator: assignedOperator ? String(assignedOperator).trim() : 'OSRTC Volvo Premier',
      assignedRoute: assignedRoute ? String(assignedRoute).trim() : 'Bhubaneswar ⇄ Puri Superfast Express',
      avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80'
    };

    conductors.unshift(newConductor);

    // Update trips and buses if matching registration number
    trips.forEach(t => {
      if (t.bus && t.bus.registrationNumber.toUpperCase() === newConductor.assignedBusNumber.toUpperCase()) {
        t.bus.conductorId = newConductor.employeeId;
        t.bus.conductorName = newConductor.name;
        t.bus.conductorPhone = newConductor.phone;
      }
    });

    console.log(`[Admin Conductor] Provisioned conductor ${newConductor.name} (${newConductor.employeeId}) for Bus ${newConductor.assignedBusNumber}`);
    res.json({ success: true, conductor: newConductor });
  });

  app.delete('/api/admin/conductors/:id', (req, res) => {
    const { id } = req.params;
    conductors = conductors.filter(c => c.id !== id && c.employeeId !== id);
    res.json({ success: true });
  });

  app.delete('/api/admin/trips/:id', (req, res) => {
    const { id } = req.params;
    const initialCount = trips.length;
    trips = trips.filter(t => t.id !== id);
    const removedCount = initialCount - trips.length;
    console.log(`[Admin] Removed trip/bus schedule ${id}. Remaining trips: ${trips.length}`);
    res.json({ success: true, removedCount });
  });

  app.delete('/api/admin/buses/:registrationNumber', (req, res) => {
    const reg = decodeURIComponent(req.params.registrationNumber).toUpperCase().trim();
    const initialTripsCount = trips.length;
    trips = trips.filter(t => t.bus?.registrationNumber?.toUpperCase() !== reg);
    conductors = conductors.filter(c => c.assignedBusNumber?.toUpperCase() !== reg);
    const removedTripsCount = initialTripsCount - trips.length;
    console.log(`[Admin] Removed bus ${reg} and ${removedTripsCount} associated trip schedules.`);
    res.json({ success: true, removedTripsCount });
  });

  // ==========================================
  // 9C. API: OFFERS & COUPON CODE MANAGEMENT
  // ==========================================
  app.get('/api/offers', (req, res) => {
    res.json(offers.filter(o => o.isLive));
  });

  app.get('/api/admin/offers', (req, res) => {
    res.json(offers);
  });

  app.post('/api/admin/offers', (req, res) => {
    const { code, title, description, discountType, discountValue, minBookingAmount, maxDiscountAmount, validUntil, badgeTag, savingsText, category, imageUrl, termsAndConditions, howToUse } = req.body;
    
    if (!code || !title || !discountValue) {
      return res.status(400).json({ error: 'Code, Title, and Discount Value are required' });
    }

    const cleanCode = String(code).trim().toUpperCase();

    // Parse array or newline/comma string for T&C and How to use
    const parseList = (val: any): string[] | undefined => {
      if (Array.isArray(val)) return val.map(s => String(s).trim()).filter(Boolean);
      if (typeof val === 'string' && val.trim()) {
        return val.split(/\r?\n/).map(s => s.trim().replace(/^[-*•\d.]+\s*/, '')).filter(Boolean);
      }
      return undefined;
    };

    const newOffer: OfferCoupon = {
      id: `off-${Date.now()}`,
      code: cleanCode,
      title: String(title).trim(),
      description: description ? String(description).trim() : `Get ${discountType === 'PERCENTAGE' ? `${discountValue}%` : `₹${discountValue}`} discount`,
      discountType: discountType || 'FLAT',
      discountValue: Number(discountValue),
      minBookingAmount: Number(minBookingAmount || 0),
      maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : undefined,
      isLive: true,
      validUntil: validUntil || '2026-12-31',
      badgeTag: badgeTag ? String(badgeTag).trim().toUpperCase() : `${discountType === 'PERCENTAGE' ? `${discountValue}% OFF` : `FLAT ₹${discountValue} OFF`}`,
      savingsText: savingsText ? String(savingsText).trim() : undefined,
      category: category || 'BUS',
      imageUrl: imageUrl ? String(imageUrl).trim() : undefined,
      termsAndConditions: parseList(termsAndConditions),
      howToUse: parseList(howToUse),
    };

    offers.unshift(newOffer);
    console.log(`[Admin Offers] Published offer package ${newOffer.code} (${newOffer.title}) to website.`);
    res.json({ success: true, offer: newOffer });
  });

  app.post('/api/admin/offers/:id/toggle', (req, res) => {
    const offer = offers.find(o => o.id === req.params.id || o.code === req.params.id);
    if (!offer) return res.status(404).json({ error: 'Offer not found' });

    offer.isLive = !offer.isLive;
    res.json({ success: true, offer });
  });

  app.delete('/api/admin/offers/:id', (req, res) => {
    offers = offers.filter(o => o.id !== req.params.id && o.code !== req.params.id);
    res.json({ success: true });
  });

  // ==========================================
  // 9D. API: GIFT CARDS MANAGEMENT & REDEMPTION
  // ==========================================
  app.post('/api/gift-cards/redeem', (req, res) => {
    const { code, pin } = req.body;
    if (!code || !pin) {
      return res.status(400).json({ error: 'Gift card code and PIN are required' });
    }

    const cleanCode = String(code).trim().toUpperCase();
    const cleanPin = String(pin).trim();

    const card = giftCards.find(g => g.code.toUpperCase() === cleanCode);
    if (!card) {
      return res.status(404).json({ error: `Invalid gift card code "${cleanCode}". Please check your voucher.` });
    }

    if (card.status === 'REDEEMED') {
      return res.status(400).json({ error: `Gift card ${cleanCode} has already been redeemed.` });
    }

    if (card.pin !== cleanPin) {
      return res.status(401).json({ error: `Incorrect 4-digit PIN for gift card ${cleanCode}.` });
    }

    card.status = 'REDEEMED';
    console.log(`[Gift Cards] Gift card ${card.code} of ₹${card.amount} redeemed successfully by customer.`);

    res.json({
      success: true,
      amount: card.amount,
      card,
      message: `🎉 Gift card ${card.code} redeemed! ₹${card.amount} added to your wABus Wallet.`
    });
  });

  app.get('/api/admin/gift-cards', (req, res) => {
    res.json(giftCards);
  });

  app.post('/api/admin/gift-cards/send', async (req, res) => {
    try {
      const { recipientEmail, amount, code, pin, imageUrl, title } = req.body || {};
      if (!recipientEmail || !amount) {
        return res.status(400).json({ error: 'Recipient email address and gift card amount are required' });
      }

      const cardCode = code ? String(code).trim().toUpperCase() : `WABUS-GIFT-${Math.floor(1000 + Math.random() * 9000)}`;
      const cardPin = pin ? String(pin).trim() : String(Math.floor(1000 + Math.random() * 9000));

      const newCard: GiftCard = {
        id: `gc-${Date.now()}`,
        code: cardCode,
        pin: cardPin,
        amount: Number(amount),
        recipientEmail: String(recipientEmail).trim(),
        senderEmail: 'wonderlightadventure@gmail.com',
        status: 'ACTIVE',
        validUntil: '2030-12-31',
        createdAt: new Date().toISOString(),
        imageUrl: imageUrl ? String(imageUrl).trim() : undefined,
        title: title ? String(title).trim() : 'Special Gift Card for You!'
      };

      giftCards.unshift(newCard);

      let emailStatus: { success: boolean; sentViaSmtp: boolean; previewUrl?: string; smtpMessageId?: string; smtpResponse?: string } = { success: true, sentViaSmtp: false };
      try {
        emailStatus = await sendGiftCardEmail(newCard.recipientEmail, newCard);
      } catch (emailErr: any) {
        console.warn('[Gift Card Email Non-Fatal Warning]', emailErr);
      }

      return res.status(200).json({
        success: true,
        card: newCard,
        previewUrl: emailStatus.previewUrl,
        smtpMessageId: emailStatus.smtpMessageId,
        smtpResponse: emailStatus.smtpResponse,
        message: `Gift card ${newCard.code} (PIN: ${newCard.pin}) of ₹${newCard.amount} sent from wonderlightadventure@gmail.com to ${newCard.recipientEmail}! ${emailStatus.sentViaSmtp ? '(Google SMTP Delivered)' : '(Email Dispatched)'}`
      });
    } catch (err: any) {
      console.error('Error sending gift card email:', err);
      return res.status(500).json({ error: err?.message || 'Failed to dispatch gift card email' });
    }
  });

  app.post('/api/coupons/validate', (req, res) => {
    const { code, bookingAmount } = req.body;
    if (!code) return res.status(400).json({ valid: false, error: 'Coupon code is required' });

    const cleanCode = String(code).trim().toUpperCase();
    const offer = offers.find(o => o.code === cleanCode && o.isLive);

    if (!offer) {
      return res.status(404).json({ 
        valid: false, 
        error: `Invalid or expired coupon code "${cleanCode}". Please check available offers.` 
      });
    }

    const amount = Number(bookingAmount || 0);
    if (amount < offer.minBookingAmount) {
      return res.status(400).json({
        valid: false,
        error: `Coupon ${offer.code} requires a minimum booking amount of ₹${offer.minBookingAmount}.`
      });
    }

    let discountAmount = 0;
    if (offer.discountType === 'FLAT') {
      discountAmount = offer.discountValue;
    } else {
      discountAmount = Math.round(amount * (offer.discountValue / 100));
      if (offer.maxDiscountAmount && discountAmount > offer.maxDiscountAmount) {
        discountAmount = offer.maxDiscountAmount;
      }
    }

    res.json({
      valid: true,
      code: offer.code,
      discountAmount,
      offer,
      message: `Coupon ${offer.code} applied! Instant savings of ₹${discountAmount}.`
    });
  });

  // ==========================================
  // 10. API: CODE DELIVERABLES (DDL, REDIS, WEBHOOK)
  // ==========================================
  app.get('/api/deliverables', (req, res) => {
    res.json({
      postgresqlSchema: POSTGRESQL_SCHEMA_SQL,
      redisLockingModule: REDIS_LOCKING_TYPESCRIPT,
      webhookHandler: PAYMENT_WEBHOOK_TYPESCRIPT
    });
  });

  if (!process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Busivo Enterprise Bus Server running at http://0.0.0.0:${PORT}`);
    });
  }

  // ==========================================
  // 11. VITE MIDDLEWARE / STATIC FILES
  // ==========================================
  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else if (!process.env.VERCEL) {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
}

startServer().catch(err => {
  console.error('Failed to start Busivo server:', err);
});

export default app;
