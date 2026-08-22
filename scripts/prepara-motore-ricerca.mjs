/**
 * Porta in casa tutto ciò che serve alla ricerca semantica.
 *
 * Senza questo passaggio il browser del visitatore scaricherebbe il modello da
 * huggingface.co e i binari WebAssembly da cdn.jsdelivr.net: due responsabili
 * del trattamento in più, entrambi extra-UE, per una funzione accessoria.
 * Scaricandoli al build e servendoli dal nostro dominio, l'unico soggetto
 * coinvolto resta l'hosting che serve già tutte le altre pagine.
 *
 * I file finiscono in public/motore/ e NON entrano in git (vedi .gitignore):
 * si rigenerano al build, che è anche il modo di tenerli allineati alle versioni
 * dichiarate in package.json.
 */

import { existsSync } from 'node:fs';
import { copyFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const MODELLO = 'Xenova/all-MiniLM-L6-v2';
const REVISIONE = 'main';

/** I file minimi per `pipeline('feature-extraction')` con `quantized: true`. */
const FILE_MODELLO = [
  'config.json',
  'tokenizer.json',
  'tokenizer_config.json',
  'onnx/model_quantized.onnx',
];

/**
 * Solo le due varianti che un browser può davvero chiedere.
 * Le versioni `threaded` richiedono cross-origin isolation (COOP/COEP), che su
 * GitHub Pages non si può impostare: non verranno mai richieste.
 * La variante non-SIMD serve perché transformers.js disattiva la SIMD su iOS 16.4.
 */
const FILE_ORT = ['ort-wasm-simd.wasm', 'ort-wasm.wasm'];

const destinazioneOrt = resolve(root, 'public/motore/ort');
const destinazioneModelli = resolve(root, 'public/motore/modelli', MODELLO);

async function copiaBinariOrt() {
  const origine = resolve(root, 'node_modules/onnxruntime-web/dist');
  await mkdir(destinazioneOrt, { recursive: true });
  for (const file of FILE_ORT) {
    const da = resolve(origine, file);
    const a = resolve(destinazioneOrt, file);
    if (existsSync(a)) continue;
    if (!existsSync(da)) throw new Error(`manca ${da}: onnxruntime-web non è installato?`);
    await copyFile(da, a);
    console.log(`[motore] copiato ${file}`);
  }
}

async function scaricaModello() {
  for (const file of FILE_MODELLO) {
    const destinazione = resolve(destinazioneModelli, file);
    if (existsSync(destinazione)) continue;

    const url = `https://huggingface.co/${MODELLO}/resolve/${REVISIONE}/${file}`;
    const risposta = await fetch(url);
    if (!risposta.ok) throw new Error(`${url} → HTTP ${risposta.status}`);

    await mkdir(dirname(destinazione), { recursive: true });
    const dati = Buffer.from(await risposta.arrayBuffer());
    await writeFile(destinazione, dati);
    console.log(`[motore] scaricato ${file} (${(dati.length / 1024 / 1024).toFixed(1)} MB)`);
  }
}

export async function preparaMotoreRicerca() {
  await copiaBinariOrt();
  await scaricaModello();
}

// Eseguibile anche a mano: `node scripts/prepara-motore-ricerca.mjs`
if (import.meta.url === `file://${process.argv[1]}`) {
  await preparaMotoreRicerca();
}
