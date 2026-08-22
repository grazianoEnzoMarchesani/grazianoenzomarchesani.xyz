/**
 * Aggancia prepara-motore-ricerca.mjs al ciclo di vita di Astro, sullo stesso
 * modello delle altre integrazioni del progetto.
 */

import { preparaMotoreRicerca } from './prepara-motore-ricerca.mjs';

export default function integrazioneMotoreRicerca() {
  return {
    name: 'motore-ricerca-locale',
    hooks: {
      'astro:config:setup': async () => {
        try {
          await preparaMotoreRicerca();
        } catch (errore) {
          // Non blocca il build: senza i file la ricerca semantica non parte e
          // resta quella testuale, che è esattamente il comportamento previsto
          // per chi non dà il consenso.
          console.error('[motore] preparazione fallita:', errore.message);
        }
      },
    },
  };
}
