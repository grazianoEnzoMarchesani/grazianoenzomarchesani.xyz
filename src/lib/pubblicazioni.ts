import dati from "../data/pubblicazioni.json";
import manuale from "../content/publications/pubblicazioni.manuale.json";

export type TipoPubblicazione = "monografia" | "articolo" | "capitolo" | "atti";

export interface FonteVoce {
  rivista?: string;
  volume?: string;
  numero?: string;
  pagine?: string;
  raccolta?: string;
  editore?: string;
  luogo?: string;
}

export interface Pubblicazione {
  id: string;
  tipo: TipoPubblicazione;
  anno: number;
  titolo: string;
  autori: string;
  sede?: string;
  fonte?: FonteVoce;
  doi?: string;
}

export interface VoceDataset {
  id: string;
  anno: number;
  titolo: string;
  autori: string;
  doi?: string;
}

export interface VoceAttivita {
  id: string;
  anno: number;
  titolo: string;
  autori: string;
  sede?: string;
  doi?: string;
}

export interface VoceRevisione {
  id: string;
  anno: number;
  rivista: string;
  editore: string;
}

export const profili = dati.profili;
export const aggiornato = dati.aggiornato;

export const collegamentiProfili = [
  { id: "orcid", etichetta: "ORCID", url: profili.orcid },
  { id: "iris", etichetta: "IRIS UNICAM", url: profili.iris },
  { id: "github", etichetta: "GitHub", url: profili.github },
] as const;

/** Le voci, ordinate dalla più recente. A parità di anno resta l'ordine del file. */
export const voci = [...(dati.voci as Pubblicazione[])].sort((a, b) => b.anno - a.anno);

export const dataset = dati.dataset as VoceDataset[];
export const attivita = dati.attivita as VoceAttivita[];

export const revisioni = manuale.revisioni as VoceRevisione[];

export function collegamento(voce: Pubblicazione): string | undefined {
  return voce.doi ? `https://doi.org/${voce.doi}` : undefined;
}

/**
 * Spezza la stringa degli autori attorno al nome di Graziano, così il
 * componente può evidenziarlo senza usare set:html e senza markup nei dati.
 */
export function spezzaAutori(autori: string): { testo: string; io: boolean }[] {
  const io = dati.io;
  const pezzi = autori.split(io);
  if (pezzi.length === 1) return [{ testo: autori, io: false }];

  const risultato: { testo: string; io: boolean }[] = [];
  pezzi.forEach((pezzo, i) => {
    if (pezzo) risultato.push({ testo: pezzo, io: false });
    if (i < pezzi.length - 1) risultato.push({ testo: io, io: true });
  });
  return risultato;
}

/** Le voci raggruppate per anno: per la timeline. */
export function perAnno(): { anno: number; voci: Pubblicazione[] }[] {
  const gruppi = new Map<number, Pubblicazione[]>();
  for (const voce of voci) {
    const gruppo = gruppi.get(voce.anno) ?? [];
    gruppo.push(voce);
    gruppi.set(voce.anno, gruppo);
  }
  return [...gruppi.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([anno, voci]) => ({ anno, voci }));
}

const anni = voci.map((v) => v.anno);

export const quante = {
  totale: voci.length,
  dal: Math.min(...anni),
  al: Math.max(...anni),
  articoli: voci.filter((v) => v.tipo === "articolo").length,
  capitoli: voci.filter((v) => v.tipo === "capitolo").length,
  atti: voci.filter((v) => v.tipo === "atti").length,
  monografie: voci.filter((v) => v.tipo === "monografia").length,
  dataset: dati.dataset.length,
  attivita: dati.attivita.length,
};
