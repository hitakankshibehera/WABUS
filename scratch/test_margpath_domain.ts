import fetch from 'node-fetch';

async function testMargpathDomain() {
  console.log('=== TESTING MARGPATH VERCEL DOMAIN ===');
  const domain = 'https://margpath.vercel.app';

  try {
    console.log(`Checking homepage ${domain}/ ...`);
    const resHome = await fetch(domain);
    console.log(`Homepage Status: ${resHome.status} ${resHome.statusText}`);
    const textHome = await resHome.text();
    console.log(`Homepage snippet: ${textHome.slice(0, 300)}`);
  } catch (err: any) {
    console.error('Homepage fetch failed:', err?.message || err);
  }

  try {
    console.log(`\nChecking API endpoint ${domain}/api/auth/send-otp ...`);
    const resApi = await fetch(`${domain}/api/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'wonderlightadventure@gmail.com' })
    });
    console.log(`API Status: ${resApi.status} ${resApi.statusText}`);
    const textApi = await resApi.text();
    console.log(`API Response: ${textApi}`);
  } catch (err: any) {
    console.error('API fetch failed:', err?.message || err);
  }
}

testMargpathDomain();
