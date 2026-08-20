/**
 * Aggancia genera-search-index.mjs al ciclo di vita di Astro, così
 * "npm run dev" e "npm run build" mantengono search-index.json sempre
 * sincronizzato con i contenuti MDX/JSON del sito.
 */

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generaSearchIndex } from './genera-search-index.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');
const contentDir = resolve(rootDir, 'src/content');
const dataDir = resolve(rootDir, 'src/data');

export default function integrazioneRicerca() {
  return {
    name: 'ricerca-semantica',
    hooks: {
      'astro:config:setup': async () => {
        try {
          await generaSearchIndex();
        } catch (errore) {
          console.error('[search] generazione fallita:', errore.message);
        }
      },
      'astro:server:setup': ({ server }) => {
        server.watcher.add(contentDir);
        server.watcher.add(dataDir);
        server.watcher.on('change', async (file) => {
          if (!file.startsWith(contentDir) && !file.startsWith(dataDir)) return;
          try {
            await generaSearchIndex();
          } catch (errore) {
            console.error('[search] generazione fallita:', errore.message);
          }
        });
      },
    },
  };
}
