/**
 * Aggancia generate-favicon.mjs al ciclo di vita di Astro, sullo stesso
 * modello di integrazione-pattern-sfondi.mjs.
 */

import { generaFavicon } from './generate-favicon.mjs';

export default function integrazioneFavicon() {
  return {
    name: 'favicon-da-logo',
    hooks: {
      'astro:config:setup': async () => {
        try {
          await generaFavicon();
        } catch (errore) {
          console.error('[favicon] generazione fallita:', errore.message);
        }
      },
    },
  };
}
