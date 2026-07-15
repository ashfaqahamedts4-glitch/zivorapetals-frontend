const puppeteer = require('puppeteer-core');
const fs = require('fs');

const paths = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Users\\' + process.env.USERNAME + '\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe'
];

let executablePath = '';
for (const p of paths) {
  if (fs.existsSync(p)) {
    executablePath = p;
    break;
  }
}

(async () => {
  try {
    const browser = await puppeteer.launch({
      executablePath,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    page.on('console', msg => {
      console.log(`[CONSOLE] [${msg.type()}] ${msg.text()}`);
    });

    page.on('pageerror', err => {
      console.log(`[PAGE ERROR] ${err.toString()}`);
    });

    // Monitor network requests
    page.on('request', request => {
      console.log(`[REQ] -> ${request.url()} (${request.method()})`);
    });

    page.on('requestfailed', request => {
      console.log(`[REQ FAILED] -> ${request.url()} - ${request.failure().errorText}`);
    });

    page.on('requestfinished', request => {
      console.log(`[REQ FINISHED] -> ${request.url()}`);
    });

    console.log('Navigating to http://localhost:4200...');
    await page.goto('http://localhost:4200', { waitUntil: 'networkidle2', timeout: 15000 });
    
    console.log('Page loaded. Dumping body content:');
    const bodyHTML = await page.evaluate(() => document.body.innerHTML);
    console.log('--- BODY HTML ---');
    console.log(bodyHTML);
    console.log('-----------------');

    console.log('Closing browser.');
    await browser.close();
  } catch (error) {
    console.error('Error:', error);
  }
})();
