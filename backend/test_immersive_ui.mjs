import puppeteer from 'puppeteer-core';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const LOCAL_FRONTEND_URL = 'http://localhost:5173';

const consoleErrors = [];

async function testImmersiveUI() {
  console.log('===============================================================');
  console.log('🧪 TESTING IMMERSIVE GLASS UI & NEW PRODUCT FEATURES');
  console.log('===============================================================\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1400,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!text.includes('favicon')) {
        consoleErrors.push(text);
        console.error('Browser console error:', text);
      }
    }
  });

  try {
    // 1. Visit Login and Authenticate Demo
    console.log('1. Navigating to Login...');
    await page.goto(`${LOCAL_FRONTEND_URL}/login`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));
    
    // Find and click demo login button
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const target = btns.find(b => b.innerText.includes('Demo') || b.innerText.includes('Instant') || b.innerText.includes('Access'));
      if (target) target.click();
    });
    
    await new Promise(r => setTimeout(r, 2000));
    console.log(`Current URL after login: ${page.url()}`);

    // 2. Test Dashboard
    console.log('2. Testing Dashboard Liquid Glass & Milestones...');
    await page.goto(`${LOCAL_FRONTEND_URL}/dashboard`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));
    
    // Check LiquidGlassCard components (.liquid-glass)
    const glassCards = await page.$$('.liquid-glass');
    console.log(`Found ${glassCards.length} liquid glass elements on dashboard.`);

    // Check Onboarding Checklist
    const checklist = await page.evaluate(() => document.body.innerText.includes('GETTING STARTED'));
    console.log(`Onboarding checklist present: ${checklist}`);

    // 3. Test Tour Modal Trigger
    console.log('3. Testing Product Tour...');
    await page.waitForSelector('#start-product-tour-btn', { timeout: 3000 });
    await page.click('#start-product-tour-btn');
    await new Promise(r => setTimeout(r, 800));
    const dialog = await page.$('[role="dialog"]');
    const dialogText = dialog ? await page.evaluate(el => el.innerText, dialog) : 'NO_DIALOG';
    console.log(`Product tour dialog present: ${!!dialog}, content preview: ${dialogText.substring(0, 100)}`);
    const tourModal = dialogText.includes('Step 1 of 7') || dialogText.includes('Command Console');
    console.log(`Product tour opened at Step 1: ${tourModal}`);
    
    if (tourModal) {
      await page.waitForSelector('#tour-modal-next-btn', { timeout: 2000 });
      await page.click('#tour-modal-next-btn');
      await new Promise(r => setTimeout(r, 600));
      const step2 = await page.evaluate(() => document.body.innerText.toLowerCase().includes('step 2 of 7'));
      console.log(`Product tour navigated to Step 2: ${step2}`);
      
      await page.waitForSelector('#tour-modal-skip-btn', { timeout: 2000 });
      await page.click('#tour-modal-skip-btn');
      await new Promise(r => setTimeout(r, 400));
    }

    // 4. Test Settings Center (/settings)
    console.log('4. Testing Settings Center...');
    await page.goto(`${LOCAL_FRONTEND_URL}/settings`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));
    
    // Test tabs: Appearance
    const appearanceTab = await page.$('button ::-p-text(Appearance)');
    if (appearanceTab) {
      await appearanceTab.click();
      await new Promise(r => setTimeout(r, 400));
      console.log('Appearance tab active. Testing theme toggle...');
      const lightThemeBtn = await page.$('button ::-p-text(Light)');
      if (lightThemeBtn) {
        await lightThemeBtn.click();
        await new Promise(r => setTimeout(r, 400));
        const themeAttr = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
        console.log(`DOM data-theme applied: ${themeAttr}`);
        
        // Reset to dark
        const darkThemeBtn = await page.$('button ::-p-text(Dark)');
        if (darkThemeBtn) {
          await darkThemeBtn.click();
          await new Promise(r => setTimeout(r, 200));
        }
      }
    }

    // Test tabs: Accessibility
    const a11yTab = await page.$('button ::-p-text(Accessibility)');
    if (a11yTab) {
      await a11yTab.click();
      await new Promise(r => setTimeout(r, 400));
      console.log('Accessibility tab active.');
    }

    // Test tabs: Security & Diagnostics
    const securityTab = await page.$('button ::-p-text(Security & Environment)');
    if (securityTab) {
      await securityTab.click();
      await new Promise(r => setTimeout(r, 400));
      console.log('Security tab active.');
    }

    const diagTab = await page.$('button ::-p-text(System Diagnostics)');
    if (diagTab) {
      await diagTab.click();
      await new Promise(r => setTimeout(r, 500));
      console.log('Diagnostics tab active. Testing live backend ping...');
      const pingBtn = await page.$('button ::-p-text(Run Live Health Ping)');
      if (pingBtn) {
        await pingBtn.click();
        await new Promise(r => setTimeout(r, 2000));
        const pingResult = await page.evaluate(() => document.body.innerText.includes('HTTP 200 OK'));
        console.log(`Backend live health ping successful: ${pingResult}`);
      }
    }

    // 5. Test Help Center (/help)
    console.log('5. Testing Help Center...');
    await page.goto(`${LOCAL_FRONTEND_URL}/help`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));
    
    const searchInput = await page.$('input[placeholder*="Search"]');
    if (searchInput) {
      await searchInput.type('Confidence');
      await new Promise(r => setTimeout(r, 500));
      const hasConfidenceArticle = await page.evaluate(() => document.body.innerText.includes('Understanding Statistical Confidence Scores'));
      console.log(`Search filtering in Help Center working: ${hasConfidenceArticle}`);
    }

    // 6. Test Hackathon Presentation Mode (/presentation)
    console.log('6. Testing Hackathon Pitch Mode...');
    await page.goto(`${LOCAL_FRONTEND_URL}/presentation`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));
    
    const slide1 = await page.evaluate(() => document.body.innerText.includes('Unstructured Documents Cripple Enterprise Workflows'));
    console.log(`Slide 1 visible: ${slide1}`);

    // Navigate slides with Right Arrow key
    await page.keyboard.press('ArrowRight');
    await new Promise(r => setTimeout(r, 500));
    const slide2 = await page.evaluate(() => document.body.innerText.includes('Liquid Multipart Ingestion'));
    console.log(`Navigated to Slide 2 via ArrowRight: ${slide2}`);

    // Navigate to slide 3
    await page.keyboard.press('ArrowRight');
    await new Promise(r => setTimeout(r, 500));
    const slide3 = await page.evaluate(() => document.body.innerText.includes('Explainable Field-Level Statistical Validation'));
    console.log(`Navigated to Slide 3 via ArrowRight: ${slide3}`);

    // 7. Test About Page (/about)
    console.log('7. Testing About Page...');
    await page.goto(`${LOCAL_FRONTEND_URL}/about`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));
    const aboutTitle = await page.evaluate(() => document.body.innerText.includes('About CineForge IDP'));
    console.log(`About page loaded: ${aboutTitle}`);

    console.log('\n===============================================================');
    console.log(`SUMMARY: Console errors caught: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      console.log('Console Errors:', consoleErrors);
    }
    console.log('✅ IMMERSIVE UI & NAVIGATION VERIFICATION COMPLETE');
    console.log('===============================================================');

  } catch (err) {
    console.error('❌ Test failed with error:', err);
  } finally {
    await browser.close();
  }
}

testImmersiveUI();
