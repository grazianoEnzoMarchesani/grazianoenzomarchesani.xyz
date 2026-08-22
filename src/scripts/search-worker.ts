import { pipeline, env } from '@xenova/transformers';

// Tutto da questo dominio, niente da terzi.
//
// Per impostazione predefinita transformers.js prende i pesi da huggingface.co e
// i binari WebAssembly da cdn.jsdelivr.net: due destinatari extra-UE che
// riceverebbero l'IP del visitatore. `prepara-motore-ricerca.mjs` scarica gli
// stessi file al build e li mette sotto /motore/, cosi' a runtime non parte
// nessuna richiesta fuori dal sito.
//
// `allowRemoteModels = false` non e' ridondante: e' la garanzia che un file
// mancante produca un errore — e quindi la ricerca testuale — invece di un
// silenzioso ritorno a Hugging Face.
env.allowLocalModels = true;
env.allowRemoteModels = false;
env.localModelPath = '/motore/modelli/';
env.backends.onnx.wasm.wasmPaths = '/motore/ort/';

// La Cache API esiste solo in secure context (https o localhost): su un dev server
// raggiunto via IP di LAN `caches` e' undefined e transformers.js farebbe throw.
env.useBrowserCache = typeof caches !== 'undefined';

let extractorPromise: Promise<any> | null = null;

async function getExtractor() {
  if (!extractorPromise) {
    extractorPromise = pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
      quantized: true,
      progress_callback: (progress: any) => {
        if (progress?.status === 'progress' && typeof progress.progress === 'number') {
          self.postMessage({ type: 'progress', percent: Math.round(progress.progress) });
        }
      },
    });
  }
  return extractorPromise;
}

self.onmessage = async (event: MessageEvent) => {
  const { id, type, query } = event.data;

  if (type === 'init') {
    try {
      await getExtractor();
      self.postMessage({ type: 'ready' });
    } catch (err: any) {
      self.postMessage({ type: 'error', error: err?.message || String(err) });
    }
    return;
  }

  if (type === 'embed') {
    try {
      const extractor = await getExtractor();
      const output = await extractor(query, { pooling: 'mean', normalize: true });
      const vector = Array.from(output.data);
      self.postMessage({ id, type: 'result', vector });
    } catch (err: any) {
      self.postMessage({ id, type: 'error', error: err?.message || String(err) });
    }
  }
};
