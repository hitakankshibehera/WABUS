import nodemailer from 'nodemailer';

async function testTransporters() {
  console.log('=== GMAIL SMTP DIAGNOSTIC ===');
  const user = 'wonderlightadventure@gmail.com';
  const pass = 'yvlfriziyibeieny';

  // 1. Direct Port 465 SSL without pool
  console.log('\n--- Test 1: Direct Port 465 SSL (No pool) ---');
  try {
    const t1 = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user, pass },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
      tls: { rejectUnauthorized: false }
    });

    const info1 = await t1.sendMail({
      from: `"MargPath Test" <${user}>`,
      to: user,
      subject: `Test 1 Port 465 - ${Date.now()}`,
      text: 'Testing Port 465 SSL'
    });
    console.log('✅ Test 1 SUCCESS:', info1.messageId);
  } catch (err: any) {
    console.error('❌ Test 1 ERROR:', err?.message || err);
  }

  // 2. Service Gmail
  console.log('\n--- Test 2: Service Gmail ---');
  try {
    const t2 = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
      tls: { rejectUnauthorized: false }
    });

    const info2 = await t2.sendMail({
      from: `"MargPath Test" <${user}>`,
      to: user,
      subject: `Test 2 Service Gmail - ${Date.now()}`,
      text: 'Testing Service Gmail'
    });
    console.log('✅ Test 2 SUCCESS:', info2.messageId);
  } catch (err: any) {
    console.error('❌ Test 2 ERROR:', err?.message || err);
  }

  // 3. Port 587 STARTTLS
  console.log('\n--- Test 3: Port 587 STARTTLS ---');
  try {
    const t3 = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      requireTLS: true,
      auth: { user, pass },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
      tls: { rejectUnauthorized: false }
    });

    const info3 = await t3.sendMail({
      from: `"MargPath Test" <${user}>`,
      to: user,
      subject: `Test 3 Port 587 - ${Date.now()}`,
      text: 'Testing Port 587 STARTTLS'
    });
    console.log('✅ Test 3 SUCCESS:', info3.messageId);
  } catch (err: any) {
    console.error('❌ Test 3 ERROR:', err?.message || err);
  }

  process.exit(0);
}

testTransporters();
