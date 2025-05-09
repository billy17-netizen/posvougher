// This script uses Puppeteer to take a screenshot of our POS mockup page
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function captureScreenshot() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: {
      width: 1920,
      height: 1080,
    },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    console.log('Opening page...');
    const page = await browser.newPage();
    await page.goto('http://localhost:3000/mockup', { 
      waitUntil: 'networkidle0',
      timeout: 60000 
    });

    console.log('Taking screenshot...');
    // Wait a bit to ensure everything is rendered
    await page.waitForTimeout(2000);
    
    // Create the directory if it doesn't exist
    const outputDir = path.join(__dirname, '../public/images');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const screenshotPath = path.join(outputDir, 'pos.png');
    await page.screenshot({
      path: screenshotPath,
      fullPage: false,
      quality: 100,
      type: 'png'
    });

    console.log(`Screenshot saved to: ${screenshotPath}`);
  } catch (error) {
    console.error('Error taking screenshot:', error);
  } finally {
    await browser.close();
    console.log('Browser closed');
  }
}

captureScreenshot(); 