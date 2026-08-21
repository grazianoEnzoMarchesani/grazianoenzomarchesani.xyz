/**
 * Vendorizza il registry Bklit UI in src/vendor/bklit/.
 *
 * Bklit è un registry shadcn/ui, ma questo progetto non usa shadcn: i sorgenti
 * si scaricano una volta e si tengono in repo, così i grafici funzionano da
 * locale e restano modificabili. Il rovescio è che è un fork — gli aggiornamenti
 * upstream non arrivano da soli. Rilanciare questo script li rifà scendere e
 * `git diff` mostra cosa è cambiato.
 *
 *   node scripts/scarica-bklit.mjs            scarica e scrive
 *   node scripts/scarica-bklit.mjs --diff     scarica in memoria e mostra solo cosa cambierebbe
 *
 * ESCLUSI di proposito: gli item `example` (demo del sito Bklit, non componenti)
 * e i blocchi `stat-card-*`, che trascinerebbero `card`/`badge` di shadcn e
 * l'intero pacchetto icone @central-icons-react per tre card mai usate qui.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";

const REGISTRY = "https://ui.bklit.com/r";
const DESTINAZIONE = new URL("../src/vendor/bklit/", import.meta.url);
const soloDiff = process.argv.includes("--diff");

const escluso = (item) =>
  item.type === "registry:example" ||
  item.name.startsWith("stat-card") ||
  // Rotto a monte: profit-loss-line.tsx importa "./profit-loss-segments", che il
  // registry non spedisce in nessun item. Chart da fintech, qui non serve a niente.
  item.name === "profit-loss-line";

/**
 * CORREZIONI ALL'UPSTREAM — tenere il più corte possibile.
 * Ogni voce è un bug di Bklit che rende il sorgente non compilabile così com'è.
 * Se un rilancio dello script segnala che una correzione non si applica più,
 * upstream l'ha risolto e la voce va cancellata.
 */
const CORREZIONI = [
  {
    file: "components/charts/chart-loading-label.tsx",
    perche: "l'import punta a ../components/shimmering-text, che nel layout shadcn è ../shimmering-text",
    da: 'from "../components/shimmering-text"',
    a: 'from "../shimmering-text"',
  },
];

const json = async (url) => {
  const risposta = await fetch(url);
  if (!risposta.ok) throw new Error(`${url} → HTTP ${risposta.status}`);
  return risposta.json();
};

/**
 * I file si scrivono BYTE PER BYTE come li manda l'upstream: nessuna riscrittura
 * degli import. Gli alias shadcn (`@/lib/utils`, `@/components/charts/*`) sono
 * risolti da `tsconfig.json` verso questa cartella. Così `git diff` dopo un
 * rilancio mostra solo i cambiamenti veri di Bklit, non il nostro rumore.
 */

const registry = await json(`${REGISTRY}/registry.json`);
const voluti = registry.items.filter((i) => !escluso(i));

await mkdir(DESTINAZIONE, { recursive: true });

const npm = new Set();
const cssVars = {};
let scritti = 0, cambiati = 0;

for (const voce of voluti) {
  const item = await json(`${REGISTRY}/${voce.name}.json`);
  for (const dipendenza of item.dependencies ?? []) npm.add(dipendenza);
  Object.assign(cssVars, item.cssVars?.light ?? {});

  for (const file of item.files ?? []) {
    // Si tiene la struttura `target` INTERA (components/charts/…, components/…, lib/…):
    // è quella che shadcn avrebbe creato, ed è l'unica in cui gli import relativi
    // fra i file Bklit (es. ../components/shimmering-text) continuano a risolvere.
    const nome = file.target ?? file.path;
    let contenuto = file.content ?? "";
    for (const correzione of CORREZIONI) {
      if (correzione.file !== nome || !contenuto.includes(correzione.da)) continue;
      contenuto = contenuto.replaceAll(correzione.da, correzione.a);
      correzione.applicata = true;
    }
    if (!contenuto) throw new Error(`${voce.name}: il registry non ha restituito il sorgente di ${nome}`);

    const destinazione = new URL(nome, DESTINAZIONE);
    await mkdir(new URL(".", destinazione), { recursive: true });
    const precedente = existsSync(destinazione) ? await readFile(destinazione, "utf-8") : null;
    if (precedente !== contenuto) {
      cambiati++;
      console.log(`${precedente === null ? "nuovo   " : "cambiato"}  ${nome}`);
    }
    if (!soloDiff) await writeFile(destinazione, contenuto);
    scritti++;
  }
}

for (const correzione of CORREZIONI) {
  console.log(
    correzione.applicata
      ? `correzione applicata: ${correzione.file} — ${correzione.perche}`
      : `⚠ CORREZIONE NON PIÙ NECESSARIA (o non più applicabile): ${correzione.file} — controllare e togliere da CORREZIONI`,
  );
}

console.log(`\n${voluti.length} item · ${scritti} file · ${cambiati} ${soloDiff ? "cambierebbero" : "cambiati"}`);
console.log(`\nDipendenze npm richieste (${npm.size}):\n  ${[...npm].sort().join("\n  ")}`);
console.log(`\ncssVars da riportare in global.css:\n${Object.entries(cssVars).map(([k, v]) => `  ${k}: ${v};`).join("\n")}`);
