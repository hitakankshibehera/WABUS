import nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

async function testEmail() {
  const emailUser = 'wonderlightadventure@gmail.com';
  const emailPassword = 'yvlf rizi yibe ieny';

  console.log('Sending test email via Gmail SMTP Port 465 SSL (pool: false)...');

  const smtpOptions: SMTPTransport.Options = {
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: emailUser,
      pass: emailPassword,
    },
    tls: {
      rejectUnauthorized: false
    }
  };

  const transporter = nodemailer.createTransport(smtpOptions);

  try {
    const info = await transporter.sendMail({
      from: `"MargPath Verification" <${emailUser}>`,
      to: emailUser,
      subject: 'MargPath Email Verification Diagnostics Test',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #4d4747ff;">MargPath System Verification</h2>
          <p>This email confirms that the MargPath email service is <strong>100% operational</strong> and delivering instantly without timeouts.</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        </div>
      `
    });

    console.log('✅ EMAIL SENT SUCCESSFULLY!');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);
  } catch (err: any) {
    console.error('❌ EMAIL TEST FAILED:', err.message);
  }
}

testEmail();
