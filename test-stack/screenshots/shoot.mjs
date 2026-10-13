// Logs into the test stack, opens the newsletter and captures the mail body in
// Off / Dark / Light (each applied on a fresh preview frame) plus the settings block.
//   node shoot.mjs      (stack must be running + set up, see generate.sh)
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const BASE = process.env.BASE || 'http://127.0.0.1:8098';
const OUT = join(dirname(fileURLToPath(import.meta.url)), 'out');
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
const done = [];

async function snap(name) {
  const path = join(OUT, name);
  await page.screenshot({ path, fullPage: true });
  done.push(name);
  console.log('  ✓', name);
}

// --- Login ---
await page.goto(`${BASE}/?_task=login`, { waitUntil: 'networkidle' });
await page.fill('#rcmloginuser', 'test');
await page.fill('#rcmloginpwd', 'test');
await Promise.all([
  page.waitForNavigation({ waitUntil: 'networkidle' }).catch(() => {}),
  page.click('#rcmloginsubmit, button[type=submit]'),
]);

// Open the newsletter in the standard mail view (body in #messagecontframe)
// with the given mode preselected, so each mode is applied on a fresh frame.
async function openMail(mode) {
  await page.evaluate(m => { try { localStorage.setItem('mailbody_dark_mode', m); } catch (e) {} }, mode);
  await page.goto(`${BASE}/?_task=mail&_mbox=INBOX`, { waitUntil: 'networkidle' });
  await page.waitForSelector('#messagelist tbody tr', { timeout: 15000 });
  await page.click('#messagelist tbody tr');
  await page.waitForSelector('#messagecontframe', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(3000); // let DarkReader process the frame
}

await openMail('off');
await snap('mailbody-off.png');

await openMail('dark');
await snap('mailbody-dark.png');

await openMail('light');
await snap('mailbody-light.png');

// --- Settings block (Mailbox View) ---
await page.goto(`${BASE}/?_task=settings&_action=edit-prefs&_section=mailview`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
await snap('settings-mailbody.png');

await browser.close();
console.log(`\n${done.length} screenshots in ${OUT}`);
