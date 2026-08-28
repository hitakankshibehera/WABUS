import express from 'express';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

const app = express();
app.use(express.json());

// In-Memory store for Vercel Serverless Function instances
const otpStore = new Map<string, { hash: string; salt: string; expiresAt: number; resendAllowedAt: number }>();

function generate6DigitOtp(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

function hashOtp(otp: string, email: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(otp, salt + email.toLowerCase(), 1000, 32, 'sha256').toString('hex');
  return { hash, salt };
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
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user: emailUser, pass: emailPassword },
      connectionTimeout: 8000,
      greetingTimeout: 4000,
      socketTimeout: 8000,
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
  } catch (err: any) {
    try {
      const fallbackTransporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: { user: emailUser, pass: emailPassword },
        connectionTimeout: 8000,
        greetingTimeout: 4000,
        socketTimeout: 8000,
        tls: { rejectUnauthorized: false }
      });
      await fallbackTransporter.sendMail({
        from: emailFrom,
        to: email,
        subject: `${otp} is your 6-digit wABus Verification Code`,
        text: `Your 6-digit wABus verification code is: ${otp}`,
        html: `<div style="font-family: Arial; padding: 20px;"><h2>wABus Login Verification Code</h2><p style="font-size: 32px; font-weight: bold; color: #D84E55;">${otp}</p><p>Valid for 5 minutes.</p></div>`
      });
      return { success: true, sentViaSmtp: true };
    } catch {
      return { success: true, sentViaSmtp: false };
    }
  }
}

// Route normalizer
app.use((req, res, next) => {
  if (!req.url.startsWith('/api') && (req.url.startsWith('/auth') || req.url.startsWith('/trips') || req.url.startsWith('/feature-flags'))) {
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

export default app;
