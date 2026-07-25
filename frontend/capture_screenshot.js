import { chromium } from 'playwright';

(async () => {
  console.log("Launching browser via Playwright...");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  
  console.log("Navigating to http://localhost:5173...");
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  
  const screenshotPath = 'C:/Users/admin/.gemini/antigravity/brain/0166572f-974f-4377-9b36-5f5a39f40855/dashboard_page.png';
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Screenshot saved to ${screenshotPath}`);

  await browser.close();
})();
