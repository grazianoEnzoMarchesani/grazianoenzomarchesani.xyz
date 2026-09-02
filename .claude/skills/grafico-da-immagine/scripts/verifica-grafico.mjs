#!/usr/bin/env node
/**
 * Screenshot di ogni <figure class="grafico"> di una pagina, per confrontare il
 * grafico nativo con l'immagine originale.
 *
 *   node verifica-grafico.mjs <url> [out-dir]
 *
 * Richiede un server in ascolto sull'URL dato (`npx astro preview`) e puppeteer
 * (già in devDependencies del progetto). Salva:
 *   <out-dir>/grafico-1.png, grafico-2.png, …   (uno per figura)
 *   <out-dir>/grafico-1-tooltip.png             (con hover, per controllare le etichette)
 * e stampa un piccolo riepilogo del DOM di ogni grafico (legenda, titoli assi).
 */
import { mkdirSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const puppeteer = require("puppeteer");

const url = process.argv[2];
const outDir = process.argv[3] ?? "/tmp/verifica-grafico";
if (!url) {
  console.error("uso: node verifica-grafico.mjs <url> [out-dir]");
  process.exit(1);
}
mkdirSync(outDir, { recursive: true });

const browser = await puppeteer.launch({ headless: "new" });
const page = await browser.newPage();
await page.setViewport({ width: 1100, height: 950, deviceScaleFactor: 2 });

const errors = [];
page.on("pageerror", (e) => errors.push(String(e.message)));

await page.goto(url, { waitUntil: "networkidle0" });

// chiudi l'eventuale banner cookie che copre il primo grafico
await page.evaluate(() => {
  const b = [...document.querySelectorAll("button")].find((x) => /rifiuta|accetta|reject|accept/i.test(x.textContent));
  b?.click();
});
await new Promise((r) => setTimeout(r, 400));

const count = await page.$$eval("figure.grafico", (els) => els.length);
if (count === 0) {
  console.error("nessuna <figure class=\"grafico\"> trovata su", url);
  await browser.close();
  process.exit(1);
}

for (let i = 0; i < count; i++) {
  const handle = (await page.$$("figure.grafico"))[i];
  await page.evaluate((n) => document.querySelectorAll("figure.grafico")[n].scrollIntoView({ block: "center" }), i);
  await new Promise((r) => setTimeout(r, 3500)); // attesa mount + animazione d'ingresso

  const info = await page.evaluate((n) => {
    const f = document.querySelectorAll("figure.grafico")[n];
    return {
      fig: f.dataset.fig,
      marks: f.querySelectorAll("svg path, svg rect, svg circle").length,
      legenda: [...f.querySelectorAll(".grafico-legenda li")].map((li) => li.textContent.trim()),
      titoloY: f.querySelector(".grafico-asse--y")?.textContent ?? null,
      titoloX: f.querySelector(".grafico-asse--x")?.textContent ?? null,
    };
  }, i);
  console.log(JSON.stringify(info));

  await handle.screenshot({ path: `${outDir}/grafico-${i + 1}.png` });

  // hover al centro per far comparire il tooltip
  const box = await handle.boundingBox();
  if (box) {
    await page.mouse.move(box.x + box.width * 0.4, box.y + box.height * 0.45);
    await new Promise((r) => setTimeout(r, 700));
    await handle.screenshot({ path: `${outDir}/grafico-${i + 1}-tooltip.png` });
    await page.mouse.move(0, 0);
  }
}

if (errors.length) console.log("ERRORI PAGINA:", JSON.stringify(errors, null, 1));
console.log(`\n${count} grafico/i salvati in ${outDir}`);
await browser.close();
