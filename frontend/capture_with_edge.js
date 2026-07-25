import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

(async () => {
  const edgePaths = [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
  ];

  let execPath = edgePaths.find(p => fs.existsSync(p));
  if (!execPath) {
    console.error("No system browser found in standard paths.");
    process.exit(1);
  }

  console.log(`Using system browser at: ${execPath}`);
  const browser = await chromium.launch({
    executablePath: execPath,
    headless: true
  });

  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  
  console.log("Navigating to http://localhost:5173...");
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  
  const artifactDir = 'd:/gitworkspace/ai/zerodha/dashboard-prod';
  const screenshotPath = path.join(artifactDir, 'dashboard_view.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Screenshot successfully captured to ${screenshotPath}`);

  // Also get page HTML content to inspect layout
  const content = await page.content();
  console.log(`Page title: ${await page.title()}`);
  console.log(`Body element count: ${await page.evaluate(() => document.body.childElementCount)}`);

  await browser.close();
})();
