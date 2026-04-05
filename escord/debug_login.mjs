import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER CRASH ERROR:', err.message));

  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
  
  await page.type('input[type="text"]', 'wblack');
  await page.type('input[type="password"]', 'Humam1908');
  await page.click('button[type="submit"]');

  await new Promise(r => setTimeout(r, 3000));
  
  await browser.close();
})();
