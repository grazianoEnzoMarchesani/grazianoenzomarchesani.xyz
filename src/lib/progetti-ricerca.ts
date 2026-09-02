/**
 * I PROGETTI DI RICERCA FINANZIATI
 * ================================
 *
 * Sesta sezione di `/publications`. Non fanno parte di Fields (vedi il
 * commento sulla collection in `src/content.config.ts`): sono grant a cui
 * ho partecipato come unità di ricerca, non output citabili — infatti sono
 * l'unica sezione della pagina senza pulsante Cite.
 *
 * PER AGGIUNGERNE UNO: un file `.md` in `src/content/publications/research-projects/`.
 * Basta quello — niente indici da aggiornare, niente ordine da mantenere.
 */

import { getCollection } from "astro:content";
import { perLingua } from "./contenuti";
import type { Lingua } from "../i18n/testi";

/**
 * Un progetto non è un evento datato ma uno STATO CONTINUO: dura un
 * intervallo di anni. Il campo `anni` è testo libero bilingue e li scrive
 * in due forme sole — "2023 – 2025" (chiuso) e "2024 —" (ancora aperto).
 * Da lì si ricavano i due estremi che servono al filtro per anno.
 */
const APERTO = 9999;

function intervallo(anni: string): { da: number; a: number } {
  const trovati = anni.match(/\d{4}/g)?.map(Number) ?? [];
  /* Nessun anno leggibile (frontmatter sbagliato): la voce non sparisce,
     finisce in fondo e non risponde ad alcun filtro. */
  if (!trovati.length) return { da: 0, a: 0 };
  return { da: trovati[0], a: trovati[1] ?? APERTO };
}

export interface ProgettoRicerca {
  chiave: string;
  data: {
    acronimo: string;
    titolo: string;
    programma: string;
    anni: string;
    ruolo: string;
    partner: string;
    url?: string;
    attivo: boolean;
  };
  /** Anno d'inizio: il primo dei due numeri del watermark. */
  da: number;
  /** Anno di fine, `APERTO` se il progetto e' ancora in corso. */
  a: number;
  /** Un progetto aperto non ha un secondo numero da mostrare. */
  aperto: boolean;
}

/**
 * Lista piatta, dal piu' recente. NON raggruppati per anno come le altre
 * sezioni: un progetto dura un intervallo, quindi il watermark e' la coppia
 * inizio/fine e appartiene al singolo progetto, non a un gruppo d'anno.
 * A parita' d'inizio viene prima quello che dura di piu'.
 */
export async function progettiRicerca(lingua: Lingua): Promise<ProgettoRicerca[]> {
  const voci = perLingua(await getCollection("research-projects"), lingua);

  return voci
    .map((voce) => {
      const { da, a } = intervallo(voce.data.anni);
      return { chiave: voce.chiave, data: voce.data, da, a, aperto: a === APERTO };
    })
    .sort((x, y) => y.da - x.da || y.a - x.a);
}
