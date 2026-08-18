/**
 * Aggancia genera-pubblicazioni.mjs al ciclo di vita di Astro, così
 * "npm run dev" e "npm run build" restano gli unici due comandi da
 * ricordare — references.bib viene letto da solo, senza un passaggio
 * manuale in più.
 *
 * astro:config:setup gira sia in dev che in build, prima che Astro legga
 * le content collection: è il punto giusto per rigenerare una volta,
 * così pubblicazioni.json è già aggiornato quando il resto parte.
 *
 * astro:server:setup gira solo in dev e ha accesso al watcher di Vite:
 * aggiungendo references.bib alla lista dei file osservati, ogni salvataggio
 * (es. un nuovo export scaricato sopra il vecchio file) rigenera subito
 * pubblicazioni.json — che Vite ricarica a sua volta, perché è un file
 * dentro src/ già importato dal sito.
 */

import { generaPubblicazioni, percorsoBib } from "./genera-pubblicazioni.mjs";

export default function integrazionePubblicazioni() {
  return {
    name: "pubblicazioni-da-bibtex",
    hooks: {
      "astro:config:setup": () => {
        try {
          generaPubblicazioni();
        } catch (errore) {
          console.error("[pubblicazioni] generazione fallita:", errore.message);
        }
      },
      "astro:server:setup": ({ server }) => {
        server.watcher.add(percorsoBib);
        server.watcher.on("change", (file) => {
          if (file !== percorsoBib) return;
          try {
            generaPubblicazioni();
          } catch (errore) {
            console.error("[pubblicazioni] generazione fallita:", errore.message);
          }
        });
      },
    },
  };
}
