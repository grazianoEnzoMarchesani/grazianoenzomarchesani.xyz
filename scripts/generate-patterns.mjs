/**
 * Genera gli sfondi decorativi delle sezioni home come SVG statici, a
 * build time, invece di calcolarli nel browser del visitatore a ogni
 * caricamento pagina (vedi docs/brain: la generazione lato client con
 * canvas + fino a 6000 tentativi di piazzamento per sezione era il
 * collo di bottiglia).
 *
 * Un "bucket" = una combinazione di dimensioni rappresentativa di una
 * fascia di dispositivi (telefono verticale, laptop, widescreen...).
 * Per ognuno vengono generate più "varianti" (stesso algoritmo, seed
 * diverso) così sezioni diverse nello stesso bucket non mostrano mai
 * lo stesso sfondo — vedi src/scripts/section-patterns.ts per come
 * vengono scelte a runtime.
 *
 * L'algoritmo vero e proprio vive in scripts/pattern-algorithm.js ed è
 * iniettato in una pagina Puppeteer headless: stessa identica logica
 * (canvas/Image inclusi) che prima girava nel browser del visitatore,
 * qui gira una volta sola in fase di build.
 *
 * manifest.json registra anche l'hash delle 4 icone sorgenti: se non è
 * cambiato dall'ultima generazione, lo script non fa nulla — evita di
 * riaprire Chromium a ogni `astro dev`/`astro build` quando le forme
 * non sono cambiate (vedi scripts/integrazione-pattern-sfondi.mjs).
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { blendOver } from './colors.mjs';

const qui = path.dirname(fileURLToPath(import.meta.url));
const radice = path.join(qui, '..');
const assetsDir = path.join(radice, 'src/assets');
// public/, non src/assets/: i file vengono serviti as-is (fetch a runtime,
// non import.meta.glob eager) così il bundle JS non si porta dietro tutti
// i bucket/varianti — solo quello richiesto dal viewport reale finisce
// scaricato, vedi src/scripts/section-patterns.ts.
const outDir = path.join(radice, 'public/patterns/generated');
const manifestPath = path.join(outDir, 'manifest.json');
const algorithmPath = path.join(qui, 'pattern-algorithm.js');

const ICON_FILES = ['research.svg', 'teaching.svg', 'projects.svg', 'tools.svg'];

// Fasce di dispositivo rappresentative: verticale stretto (telefono),
// verticale largo (tablet), laptop, desktop, widescreen. Le sezioni
// home sono sempre a piena altezza viewport (h-dvh), quindi l'aspect
// ratio è quello che conta davvero — vedi pickBucket() a runtime.
export const BUCKETS = [
  { name: 'phone-portrait', w: 390, h: 844 },
  { name: 'tablet-portrait', w: 820, h: 1180 },
  { name: 'laptop', w: 1440, h: 900 },
  { name: 'desktop', w: 1920, h: 1080 },
  { name: 'ultrawide', w: 2560, h: 1080 },
];
export const VARIANTS_PER_BUCKET = 4;

// Stesse opacità di sempre (vedi section-morph.ts), ma tradotte in
// colore pieno equivalente: niente più fill-opacity, niente più somma
// quando due forme si sovrappongono.
const BIG_OPACITY = 0.035;
const SMALL_OPACITY = 0.07;
const PATTERN_INK_OPACITY = 0.12;
const BIG_COLOR = blendOver(BIG_OPACITY);
const SMALL_COLOR = blendOver(SMALL_OPACITY);
const PATTERN_INK_COLOR = blendOver(PATTERN_INK_OPACITY);

function sourceHash() {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(algorithmPath, 'utf8'));
  for (const file of ICON_FILES) {
    hash.update(fs.readFileSync(path.join(assetsDir, file), 'utf8'));
  }
  hash.update(JSON.stringify({ BUCKETS, VARIANTS_PER_BUCKET, BIG_COLOR, SMALL_COLOR, PATTERN_INK_COLOR }));
  return hash.digest('hex');
}

function alreadyUpToDate() {
  if (!fs.existsSync(manifestPath)) return false;
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    return manifest.sourceHash === sourceHash();
  } catch {
    return false;
  }
}

export async function generaPatternSfondi({ force = false } = {}) {
  if (!force && alreadyUpToDate()) return { rigenerato: false };

  const { default: puppeteer } = await import('puppeteer');

  const iconsRaw = ICON_FILES.map((file) => fs.readFileSync(path.join(assetsDir, file), 'utf8'));

  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await puppeteer.launch();
  try {
    const page = await browser.newPage();
    await page.addScriptTag({ path: algorithmPath });

    const entries = [];
    for (const bucket of BUCKETS) {
      for (let variant = 1; variant <= VARIANTS_PER_BUCKET; variant++) {
        const seed = `${bucket.name}-${variant}`;
        const svg = await page.evaluate(
          (W, H, iconsRaw, seed, bigColor, smallColor, patternInkColor) =>
            window.__generatePattern({ W, H, iconsRaw, seed, bigColor, smallColor, patternInkColor }),
          bucket.w,
          bucket.h,
          iconsRaw,
          seed,
          BIG_COLOR,
          SMALL_COLOR,
          PATTERN_INK_COLOR
        );
        const file = `${bucket.name}-${variant}.svg`;
        fs.writeFileSync(path.join(outDir, file), svg, 'utf8');
        entries.push({ bucket: bucket.name, w: bucket.w, h: bucket.h, variant, file });
      }
    }

    fs.writeFileSync(
      manifestPath,
      JSON.stringify({ sourceHash: sourceHash(), variantsPerBucket: VARIANTS_PER_BUCKET, entries }, null, 2) + '\n',
      'utf8'
    );
  } finally {
    await browser.close();
  }

  return { rigenerato: true };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const force = process.argv.includes('--force');
  generaPatternSfondi({ force }).then(({ rigenerato }) => {
    console.log(rigenerato ? '[pattern-sfondi] generati.' : '[pattern-sfondi] già aggiornati, nessuna rigenerazione.');
  });
}
