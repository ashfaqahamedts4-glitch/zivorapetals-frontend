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
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.goto('http://localhost:4200', { waitUntil: 'networkidle2' });
  const html = await page.evaluate(() => document.body.innerHTML);
  console.log('--- CONTACT & FOOTER CHECK ---');
  console.log('Contact section present (#contact):', html.includes('id="contact"'));
  console.log('Atelier text present:', html.includes('Visit Our Experience Atelier'));
  console.log('Footer element present:', html.includes('class="storefront-footer"'));
  console.log('Copyright text present:', html.includes('Zivora Petals Return Gifts'));
  await browser.close();
})();
