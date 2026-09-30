import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PROD_URL = 'https://intelligent-document-processing-three.vercel.app';

async function verifyProductionVercel() {
  console.log('===============================================================');
  console.log('🌐 VERIFYING LIVE VERCEL PRODUCTION DEPLOYMENT');
  console.log('===============================================================\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1400,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const t = msg.text();
      if (!t.includes('favicon') && !t.includes('ALPN')) {
        errors.push(t);
        console.error('Prod console error:', t);
      }
    }
  });

  try {
    // 1. Presentation Mode (Public)
    console.log('1. Checking Live Pitch Mode (/presentation)...');
    await page.goto(`${PROD_URL}/presentation`, { waitUntil: 'networkidle2' });
    const pitchLoaded = await page.evaluate(() => document.body.innerText.includes('Unstructured Documents Cripple Enterprise Workflows'));
    console.log(`   Live Pitch Deck Loaded: ${pitchLoaded}`);

    // 2. Authenticated Flow & Dashboard
    console.log('2. Checking Live Login & Instant Demo Access...');
    await page.goto(`${PROD_URL}/login`, { waitUntil: 'networkidle2' });
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const demoBtn = btns.find(b => b.innerText.includes('Instant') || b.innerText.includes('Demo') || b.innerText.includes('Access'));
      if (demoBtn) demoBtn.click();
    });
    await new Promise(r => setTimeout(r, 2000));
    console.log(`   Current URL after login: ${page.url()}`);

    const hasGlass = await page.evaluate(() => document.querySelectorAll('.liquid-glass').length > 0);
    const hasChecklist = await page.evaluate(() => document.body.innerText.includes('GETTING STARTED'));
    console.log(`   Live Liquid Glass Elements: ${hasGlass}`);
    console.log(`   Live Onboarding Checklist: ${hasChecklist}`);

    // 3. Settings Center
    console.log('3. Checking Live Settings Center (/settings)...');
    await page.goto(`${PROD_URL}/settings`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));
    const settingsLoaded = await page.evaluate(() => document.body.innerText.includes('Settings Center') || document.body.innerText.includes('Appearance'));
    console.log(`   Live Settings Center Loaded: ${settingsLoaded}`);

    // 4. About Page (Authenticated)
    console.log('4. Checking Live About Page (/about)...');
    await page.goto(`${PROD_URL}/about`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));
    const aboutLoaded = await page.evaluate(() => document.body.innerText.includes('About CineForge IDP'));
    console.log(`   Live About Page Loaded: ${aboutLoaded}`);

    // 5. Help Center (Authenticated)
    console.log('5. Checking Live Help Center (/help)...');
    await page.goto(`${PROD_URL}/help`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));
    const helpLoaded = await page.evaluate(() => document.body.innerText.includes('Understanding Statistical Confidence Scores'));
    console.log(`   Live Help Center Loaded: ${helpLoaded}`);

    console.log('\n===============================================================');
    console.log(`SUMMARY: Live Errors: ${errors.length}`);
    console.log('✅ LIVE VERCEL PRODUCTION VERIFICATION COMPLETE');
    console.log('===============================================================');
  } catch (err) {
    console.error('Production test error:', err);
  } finally {
    await browser.close();
  }
}

verifyProductionVercel();
