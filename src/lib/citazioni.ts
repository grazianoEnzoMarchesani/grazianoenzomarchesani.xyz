import type { FonteVoce, TipoPubblicazione } from "./pubblicazioni";

export type StileCitazione = "apa" | "mla" | "harvard" | "chicago" | "bibtex";

export const stiliCitazione: StileCitazione[] = ["apa", "mla", "harvard", "chicago", "bibtex"];

export const etichettaStile: Record<StileCitazione, string> = {
  apa: "APA",
  mla: "MLA",
  harvard: "Harvard",
  chicago: "Chicago",
  bibtex: "BibTeX",
};

export type TipoCitabile = TipoPubblicazione | "dataset" | "software";

export interface VoceCitabile {
  id: string;
  anno: number;
  titolo: string;
  autori: string;
  sede?: string;
  fonte?: FonteVoce;
  doi?: string;
}

interface Autore {
  cognome: string;
  iniziali: string;
}

function spezzaAutore(nome: string): Autore {
  const m = nome.match(/^(.+?)\s+((?:\p{L}\.\s*)+)$/u);
  if (!m) return { cognome: nome.trim(), iniziali: "" };
  return { cognome: m[1].trim(), iniziali: m[2].trim() };
}

function partiAutori(autori: string): Autore[] {
  return autori
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map(spezzaAutore);
}

function cognomeIniziali(a: Autore): string {
  return a.iniziali ? `${a.cognome}, ${a.iniziali}` : a.cognome;
}

function iniizialiCognome(a: Autore): string {
  return a.iniziali ? `${a.iniziali} ${a.cognome}` : a.cognome;
}

function autoriApa(lista: Autore[]): string {
  const f = lista.map(cognomeIniziali);
  if (f.length > 20) return [...f.slice(0, 19), "…", f[f.length - 1]].join(", ");
  if (f.length === 1) return f[0];
  if (f.length === 2) return f.join(" & ");
  return `${f.slice(0, -1).join(", ")}, & ${f[f.length - 1]}`;
}

function autoriMla(lista: Autore[]): string {
  if (lista.length === 1) return cognomeIniziali(lista[0]);
  if (lista.length === 2) return `${cognomeIniziali(lista[0])}, and ${iniizialiCognome(lista[1])}`;
  return `${cognomeIniziali(lista[0])}, et al.`;
}

function autoriHarvard(lista: Autore[]): string {
  const f = lista.map(cognomeIniziali);
  if (f.length > 3) return `${f[0]} et al.`;
  if (f.length === 1) return f[0];
  if (f.length === 2) return f.join(" and ");
  return `${f.slice(0, -1).join(", ")} and ${f[f.length - 1]}`;
}

function autoriChicago(lista: Autore[]): string {
  const f = lista.map(cognomeIniziali);
  if (f.length > 10) return `${f.slice(0, 7).join(", ")}, et al.`;
  if (f.length === 1) return f[0];
  if (f.length === 2) return f.join(" and ");
  return `${f.slice(0, -1).join(", ")}, and ${f[f.length - 1]}`;
}

function autoriBibtex(lista: Autore[]): string {
  return lista.map(cognomeIniziali).join(" and ");
}

function costruisciSede(tipo: TipoCitabile, fonte: FonteVoce | undefined, sede: string | undefined, stile: StileCitazione): string {
  if (!fonte) return sede ?? "";
  const paginePrefisso = stile === "mla" || stile === "chicago" ? "pp. " : "";

  if (tipo === "articolo") {
    let v = fonte.rivista ?? "";
    if (fonte.volume) v += stile === "mla" || stile === "chicago" ? `, vol. ${fonte.volume}` : `, ${fonte.volume}`;
    if (fonte.numero) v += stile === "mla" || stile === "chicago" ? `, no. ${fonte.numero}` : `(${fonte.numero})`;
    if (fonte.pagine) v += `, ${paginePrefisso}${fonte.pagine}`;
    return v;
  }
  if (tipo === "capitolo" || tipo === "atti") {
    const editoreLuogo = [fonte.editore, fonte.luogo].filter(Boolean).join(", ");
    let v = fonte.raccolta ?? "";
    if (editoreLuogo) v += (v ? ". " : "") + editoreLuogo;
    if (fonte.pagine) v += `, ${paginePrefisso}${fonte.pagine}`;
    return v;
  }
  if (tipo === "monografia") return [fonte.editore, fonte.luogo].filter(Boolean).join(", ");
  return sede ?? "";
}

function pulisci(s: string): string {
  return s
    .replace(/[ \t]+/g, " ")
    .replace(/ +([.,])/g, "$1")
    .replace(/\.{2,}(?!\.)/g, ".")
    .trim();
}

const ETICHETTA_TIPO: Partial<Record<TipoCitabile, string>> = {
  dataset: " [Dataset]",
  software: " [Software]",
};

function citazioneApa(v: VoceCitabile, tipo: TipoCitabile): string {
  const autori = autoriApa(partiAutori(v.autori));
  const sede = costruisciSede(tipo, v.fonte, v.sede, "apa");
  const etichetta = ETICHETTA_TIPO[tipo] ?? "";
  const doi = v.doi ? ` https://doi.org/${v.doi}` : "";
  return pulisci(`${autori} (${v.anno}). ${v.titolo}${etichetta}. ${sede ? sede + "." : ""}${doi}`);
}

function citazioneMla(v: VoceCitabile, tipo: TipoCitabile): string {
  const autori = autoriMla(partiAutori(v.autori));
  const sede = costruisciSede(tipo, v.fonte, v.sede, "mla");
  const etichetta = ETICHETTA_TIPO[tipo] ?? "";
  const doi = v.doi ? `, doi.org/${v.doi}` : "";
  return pulisci(`${autori}. "${v.titolo}${etichetta}." ${sede ? sede + ", " : ""}${v.anno}${doi}.`);
}

function citazioneHarvard(v: VoceCitabile, tipo: TipoCitabile): string {
  const autori = autoriHarvard(partiAutori(v.autori));
  const sede = costruisciSede(tipo, v.fonte, v.sede, "harvard");
  const etichetta = ETICHETTA_TIPO[tipo] ?? "";
  const doi = v.doi ? `. doi: ${v.doi}` : "";
  return pulisci(`${autori} (${v.anno}) '${v.titolo}${etichetta}'.${sede ? " " + sede + "." : ""}${doi}`);
}

function citazioneChicago(v: VoceCitabile, tipo: TipoCitabile): string {
  const autori = autoriChicago(partiAutori(v.autori));
  const sede = costruisciSede(tipo, v.fonte, v.sede, "chicago");
  const etichetta = ETICHETTA_TIPO[tipo] ?? "";
  const doi = v.doi ? ` https://doi.org/${v.doi}` : "";
  return pulisci(`${autori}. ${v.anno}. "${v.titolo}${etichetta}." ${sede ? sede + "." : ""}${doi}`);
}

const TIPO_BIBTEX: Record<TipoCitabile, string> = {
  articolo: "article",
  capitolo: "incollection",
  atti: "inproceedings",
  monografia: "book",
  dataset: "misc",
  software: "software",
};

function citazioneBibtex(v: VoceCitabile, tipo: TipoCitabile): string {
  const autori = autoriBibtex(partiAutori(v.autori));
  const righe = [`  author = {${autori}}`, `  title = {${v.titolo}}`, `  year = {${v.anno}}`];
  const f = v.fonte;

  if (tipo === "articolo" && f) {
    if (f.rivista) righe.push(`  journal = {${f.rivista}}`);
    if (f.volume) righe.push(`  volume = {${f.volume}}`);
    if (f.numero) righe.push(`  number = {${f.numero}}`);
    if (f.pagine) righe.push(`  pages = {${f.pagine}}`);
  } else if ((tipo === "capitolo" || tipo === "atti") && f) {
    if (f.raccolta) righe.push(`  booktitle = {${f.raccolta}}`);
    if (f.editore) righe.push(`  publisher = {${f.editore}}`);
    if (f.luogo) righe.push(`  address = {${f.luogo}}`);
    if (f.pagine) righe.push(`  pages = {${f.pagine}}`);
  } else if (tipo === "monografia" && f) {
    if (f.editore) righe.push(`  publisher = {${f.editore}}`);
    if (f.luogo) righe.push(`  address = {${f.luogo}}`);
  } else if (v.sede) {
    righe.push(`  note = {${v.sede}}`);
  }
  if (v.doi) righe.push(`  doi = {${v.doi}}`);

  return `@${TIPO_BIBTEX[tipo]}{${v.id},\n${righe.join(",\n")}\n}`;
}

export function generaCitazioni(voce: VoceCitabile, tipo: TipoCitabile): Record<StileCitazione, string> {
  return {
    apa: citazioneApa(voce, tipo),
    mla: citazioneMla(voce, tipo),
    harvard: citazioneHarvard(voce, tipo),
    chicago: citazioneChicago(voce, tipo),
    bibtex: citazioneBibtex(voce, tipo),
  };
}
