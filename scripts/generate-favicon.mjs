/**
 * Genera public/favicon.svg e public/favicon.ico a partire da
 * src/assets/logo.svg, a build time — stessa logica di
 * generate-patterns.mjs: hash della sorgente in un manifest, no-op se
 * il logo non è cambiato dall'ultima generazione.
 *
 * favicon.svg è una copia 1:1 del contenuto di logo.svg (nessun
 * adattamento). favicon.ico è rasterizzato con Puppeteer (già una
 * dipendenza del progetto per pattern-algorithm.js) e impacchettato in
 * formato ICO con png-to-ico.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const qui = path.dirname(fileURLToPath(import.meta.url));
const radice = path.join(qui, '..');
const logoPath = path.join(radice, 'src/assets/logo.svg');
const outDir = path.join(radice, 'public');
const svgOutPath = path.join(outDir, 'favicon.svg');
const icoOutPath = path.join(outDir, 'favicon.ico');
const manifestPath = path.join(outDir, '.favicon-manifest.json');

const ICO_SIZES = [16, 32, 48];

function sourceHash(logoRaw) {
  return crypto.createHash('sha256').update(logoRaw).update(JSON.stringify(ICO_SIZES)).digest('hex');
}

function alreadyUpToDate(hash) {
  if (!fs.existsSync(manifestPath) || !fs.existsSync(svgOutPath) || !fs.existsSync(icoOutPath)) return false;
  try {
    return JSON.parse(fs.readFileSync(manifestPath, 'utf8')).sourceHash === hash;
  } catch {
    return false;
  }
}

export async function generaFavicon({ force = false } = {}) {
  const logoRaw = fs.readFileSync(logoPath, 'utf8');
  const hash = sourceHash(logoRaw);
  if (!force && alreadyUpToDate(hash)) return { rigenerato: false };

  const { default: puppeteer } = await import('puppeteer');
  const { default: pngToIco } = await import('png-to-ico');

  fs.writeFileSync(svgOutPath, logoRaw, 'utf8');

  const browser = await puppeteer.launch();
  try {
    const page = await browser.newPage();
    const pngBuffers = [];
    for (const size of ICO_SIZES) {
      await page.setViewport({ width: size, height: size, deviceScaleFactor: 1 });
      await page.setContent(
        `<html><body style="margin:0"><img src="data:image/svg+xml;base64,${Buffer.from(logoRaw).toString('base64')}" width="${size}" height="${size}" /></body></html>`
      );
      pngBuffers.push(await page.screenshot({ type: 'png', omitBackground: true }));
    }
    fs.writeFileSync(icoOutPath, await pngToIco(pngBuffers));
  } finally {
    await browser.close();
  }

  fs.writeFileSync(manifestPath, JSON.stringify({ sourceHash: hash }, null, 2) + '\n', 'utf8');

  return { rigenerato: true };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const force = process.argv.includes('--force');
  generaFavicon({ force }).then(({ rigenerato }) => {
    console.log(rigenerato ? '[favicon] generata.' : '[favicon] già aggiornata, nessuna rigenerazione.');
  });
}
