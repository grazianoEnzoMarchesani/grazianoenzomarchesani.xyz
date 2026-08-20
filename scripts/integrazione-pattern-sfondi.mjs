/**
 * Aggancia generate-patterns.mjs al ciclo di vita di Astro, sullo stesso
 * modello di integrazione-pubblicazioni.mjs. generaPatternSfondi() è
 * no-op quando le 4 icone sorgente e l'algoritmo non sono cambiati
 * (hash in manifest.json), quindi girare a ogni "npm run dev"/"npm run
 * build" costa quasi nulla nel caso comune — Puppeteer si apre solo la
 * prima volta o dopo una modifica reale.
 */

import { generaPatternSfondi } from './generate-patterns.mjs';

export default function integrazionePatternSfondi() {
  return {
    name: 'pattern-sfondi-sezioni',
    hooks: {
      'astro:config:setup': async () => {
        try {
          await generaPatternSfondi();
        } catch (errore) {
          console.error('[pattern-sfondi] generazione fallita:', errore.message);
        }
      },
    },
  };
}
