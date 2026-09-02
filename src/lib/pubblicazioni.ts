import { getCollection } from "astro:content";
import dati from "../data/pubblicazioni.json";
import { perLingua } from "./contenuti";
import { linguaDefault, type Lingua } from "../i18n/testi";

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

export interface VoceSoftware {
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
export const software = dati.software as VoceSoftware[];
export const attivita = dati.attivita as VoceAttivita[];

/**
 * Le revisioni vengono dalla collection `peer-review` (`.md` in
 * `src/content/publications/peer-review/`), non dal `.bib`: non sono referenze
 * bibliografiche mie. La lingua non conta per i loro campi (nomi propri),
 * ma il loader la richiede comunque — si prende `linguaDefault`.
 */
export async function revisioni(lingua: Lingua = linguaDefault): Promise<VoceRevisione[]> {
  const voci = perLingua(await getCollection("peer-review"), lingua);
  return voci.map((voce) => ({ id: voce.chiave, ...voce.data }));
}

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

/** Raggruppa un elenco di voci per anno, dal più recente al più vecchio. */
function raggruppaPerAnno<T extends { anno: number }>(elenco: T[]): { anno: number; voci: T[] }[] {
  const gruppi = new Map<number, T[]>();
  for (const voce of elenco) {
    const gruppo = gruppi.get(voce.anno) ?? [];
    gruppo.push(voce);
    gruppi.set(voce.anno, gruppo);
  }
  return [...gruppi.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([anno, voci]) => ({ anno, voci }));
}

/** Le voci raggruppate per anno: per la timeline. */
export function perAnno(): { anno: number; voci: Pubblicazione[] }[] {
  return raggruppaPerAnno(voci);
}

/** Le revisioni raggruppate per anno: per la timeline. */
export async function revisioniPerAnno(lingua?: Lingua): Promise<{ anno: number; voci: VoceRevisione[] }[]> {
  return raggruppaPerAnno(await revisioni(lingua));
}

/** Il software raggruppato per anno: per la timeline. */
export function softwarePerAnno(): { anno: number; voci: VoceSoftware[] }[] {
  return raggruppaPerAnno(software);
}

/** I dataset raggruppati per anno: per la timeline. */
export function datasetPerAnno(): { anno: number; voci: VoceDataset[] }[] {
  return raggruppaPerAnno(dataset);
}

/** Le attività raggruppate per anno: per la timeline. */
export function attivitaPerAnno(): { anno: number; voci: VoceAttivita[] }[] {
  return raggruppaPerAnno(attivita);
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
  software: dati.software.length,
  attivita: dati.attivita.length,
};
