import { pipeline, env } from '@xenova/transformers';

// Disabilita modelli locali per il runtime browser e abilita cache del browser
env.allowLocalModels = false;
env.useBrowserCache = true;

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
