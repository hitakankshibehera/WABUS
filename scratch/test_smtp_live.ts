import nodemailer from 'nodemailer';

async function testPort(name: string, config: any) {
  console.log(`\nTesting ${name}...`);
  try {
    const transporter = nodemailer.createTransport({
      ...config,
      connectionTimeout: 4000,
      greetingTimeout: 3000,
      socketTimeout: 4000,
      dnsTimeout: 3000,
      tls: { rejectUnauthorized: false }
    });

    const verifyPromise = transporter.verify();
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout 4s')), 4000));
    
    await Promise.race([verifyPromise, timeoutPromise]);
    console.log(`✅ SUCCESS: ${name} connected & authenticated!`);

    const info: any = await transporter.sendMail({
      from: `"MargPath Verification" <${config.auth.user}>`,
      to: config.auth.user,
      subject: `🧪 Test ${name}`,
      text: `Test email via ${name}`
    });
    console.log(`🚀 SENT! Message ID: ${info.messageId}`);
    return true;
  } catch (err: any) {
    console.error(`❌ FAILED ${name}:`, err?.message || err);
    return false;
  }
}

async function run() {
  const user = 'wonderlightadventure@gmail.com';
  const pass = 'yvlfriziyibeieny';

  // 1. Service: 'gmail' (Port 587)
  await testPort('Service Gmail (587)', {
    service: 'gmail',
    auth: { user, pass }
  });

  // 2. Direct smtp.gmail.com Port 587 STARTTLS
  await testPort('Direct Port 587 STARTTLS', {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    requireTLS: true,
    auth: { user, pass }
  });

  // 3. Direct smtp.gmail.com Port 465 SSL
  await testPort('Direct Port 465 SSL', {
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user, pass }
  });

  process.exit(0);
}

run();
