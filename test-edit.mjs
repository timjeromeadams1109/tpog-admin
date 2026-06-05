import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

// Capture console messages
page.on('console', msg => console.log('BROWSER:', msg.text()));
page.on('pageerror', err => console.error('PAGE ERROR:', err));

console.log('Step 1: Navigate');
await page.goto('https://tpog-admin-beta.vercel.app', { waitUntil: 'networkidle' });

console.log('Step 2: Wait for data');
await page.waitForSelector('tbody tr', { timeout: 10000 });

console.log('Step 3: Click edit');
await page.locator('tbody tr').first().locator('button[title="Edit"]').click();

console.log('Step 4: Wait for modal');
await page.locator('div.fixed.inset-0').waitFor({ state: 'visible', timeout: 5000 });

console.log('Step 5: Get and change value');
const textarea = page.locator('textarea');
const original = await textarea.inputValue();
const newVal = original + ' [TEST]';
await textarea.fill(newVal);

console.log('Step 6: Click save and monitor response');
// Listen for network responses
let saveResponse = null;
page.on('response', async (response) => {
  if (response.url().includes('app_content') && response.request().method() === 'POST') {
    saveResponse = response;
    const status = response.status();
    const text = await response.text();
    console.log(`SAVE RESPONSE: ${status}`);
    console.log(`RESPONSE BODY: ${text.substring(0, 100)}`);
  }
});

await page.locator('button:has-text("Save")').click();

// Wait for the response or timeout
await page.waitForTimeout(3000);

if (saveResponse) {
  console.log(`✅ Save request completed with status: ${saveResponse.status()}`);
} else {
  console.log(`⚠️  No save response captured - checking page state...`);
}

// Check if modal still open and value changed
const modalOpen = await page.locator('div.fixed.inset-0').isVisible().catch(() => false);
const currentValue = await textarea.inputValue().catch(() => 'N/A');
console.log(`Modal still open: ${modalOpen}`);
console.log(`Current textarea value: "${currentValue.substring(0, 40)}..."`);

// Check page for any error messages
const errorText = await page.locator('text=Error').isVisible().catch(() => false);
console.log(`Error visible: ${errorText}`);

// Try to find the success toast anywhere
const successVisible = await page.locator(':text("Saved")').isVisible().catch(() => false);
console.log(`Success toast visible: ${successVisible}`);

await browser.close();
