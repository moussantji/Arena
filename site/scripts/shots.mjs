// Capture d'écran du site IPFS-BK — exécuté en CI (Ubuntu) puis publié en artefact.
import { chromium } from 'playwright';
import fs from 'fs';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:5180';
const outDir = 'shots';
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ args: ['--no-sandbox'] });
const ctx = await browser.newContext({ deviceScaleFactor: 1.35 });
const page = await ctx.newPage();

await page.goto(`${BASE}/espace/connexion`, { waitUntil: 'networkidle' });
await page.evaluate(() =>
  localStorage.setItem(
    'ipfsbk.session.v1',
    JSON.stringify({
      nom: 'Bakary Samake',
      role: 'Direction des Études',
      initiales: 'BS',
      email: 'direction@ipfs-bk.ml',
      profile: 'personnel',
      connectedAt: new Date().toISOString(),
    })
  )
);

const shots = [
  ['01-accueil', '/', 1600, 1000],
  ['02-accueil-mobile', '/', 430, 932],
  ['03-formations', '/formations', 1600, 1000],
  ['04-formation-kine', '/formations/kinesitherapie', 1600, 1000],
  ['05-blog', '/blog', 1600, 1000],
  ['06-article', '/blog/licence-professionnelle-kinesitherapie-rentree-novembre-2026', 1600, 1000],
  ['07-application-mobile', '/application', 1600, 1000],
  ['08-a-propos', '/a-propos', 1600, 1000],
  ['09-admission', '/admission', 1600, 1000],
  ['10-contact', '/contact', 1600, 1000],
  ['11-connexion', '/espace/connexion', 1600, 1000],
];

for (const [name, url, w, h] of shots) {
  await page.setViewportSize({ width: w, height: h });
  await page.goto(BASE + url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let y = 0;
      const step = () => {
        y += window.innerHeight * 0.8;
        window.scrollTo(0, y);
        if (y < document.body.scrollHeight) setTimeout(step, 90);
        else {
          window.scrollTo(0, 0);
          setTimeout(resolve, 450);
        }
      };
      step();
    });
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${outDir}/${name}.png`, fullPage: w >= 600 });
  console.log('✓', name);
}

// Espace personnel — version PC
await page.setViewportSize({ width: 1600, height: 1000 });
await page.goto(`${BASE}/personnel`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
await page.screenshot({ path: `${outDir}/12-personnel-pc.png`, fullPage: true });
console.log('✓ 12-personnel-pc');

// Espace étudiant
await page.goto(`${BASE}/espace/connexion`, { waitUntil: 'networkidle' });
await page.evaluate(() =>
  localStorage.setItem(
    'ipfsbk.session.v1',
    JSON.stringify({
      nom: 'Awa Traoré',
      role: 'Étudiant IPFS-BK',
      initiales: 'AT',
      email: 'awa.traore@ipfs-bk.ml',
      profile: 'etudiant',
      connectedAt: new Date().toISOString(),
    })
  )
);
await page.goto(`${BASE}/espace`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1000);
await page.screenshot({ path: `${outDir}/13-espace-etudiant.png`, fullPage: true });
console.log('✓ 13-espace-etudiant');

await browser.close();
