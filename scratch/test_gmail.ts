import nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

async function testPooledTransport() {
  console.log('--- Testing Pooled Transport (Ultra Fast) ---');
  const user = 'wonderlightadventure@gmail.com';
  const pass = 'yvlfriziyibeieny';

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    pool: true,
    maxConnections: 3,
    maxMessages: 50,
    family: 4,
    auth: { user, pass },
    connectionTimeout: 5000,
    greetingTimeout: 3000,
    socketTimeout: 5000,
    tls: { rejectUnauthorized: false }
  } as SMTPTransport.Options);

  for (let i = 1; i <= 3; i++) {
    console.log(`\nAttempting pooled email #${i}...`);
    const start = Date.now();
    try {
      const info = await transporter.sendMail({
        from: `"MargPath Official" <${user}>`,
        to: user,
        subject: `🚀 Pooled Test #${i} - ${new Date().toISOString()}`,
        html: `<h3>Pooled Test #${i}</h3>`
      });

      const duration = Date.now() - start;
      console.log(`✅ SUCCESS #${i} in ${duration}ms! MessageId: ${info.messageId}`);
    } catch (err: any) {
      const duration = Date.now() - start;
      console.error(`❌ FAILED #${i} after ${duration}ms:`, err?.message || err);
    }
  }

  transporter.close();
  process.exit(0);
}

testPooledTransport();
