import fetch from 'node-fetch';

async function testLiveVercelEmail() {
  console.log('=== TESTING LIVE VERCEL EMAIL DISPATCH ===');
  const targetEmail = 'wonderlightadventure@gmail.com';

  console.log(`Sending OTP to live endpoint https://busivo.vercel.app/api/auth/send-otp ...`);
  try {
    const res = await fetch('https://busivo.vercel.app/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: targetEmail })
    });

    const status = res.status;
    const text = await res.text();
    console.log(`HTTP Status: ${status}`);
    console.log(`Response Body:\n${text}`);
  } catch (err: any) {
    console.error('Request failed:', err?.message || err);
  }
}

testLiveVercelEmail();
