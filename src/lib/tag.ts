/**
 * LA TASSONOMIA UNIFICATA DI FIELDS
 * =================================
 *
 * Le quattro collection di Fields descrivono i contenuti con campi diversi
 * (`tag` a mano su tutte e quattro, più le facet implicite già nei
 * frontmatter: `tools.ambiente`/`linguaggio`, `teaching.tipo`/`luogo`/
 * `istituzione`, `projects.tipo`/`luogo`). Questo modulo li porta tutti su
 * un unico asse: il TAG.
 *
 * Tre regole che governano tutto il resto:
 *
 * 1. LO SLUG È SEMPRE INGLESE. Le etichette sono bilingui, ma lo slug si
 *    calcola dalla versione EN del contenuto: l'URL di un tag deve essere
 *    lo stesso in entrambe le lingue (`/fields/tag/qgis` e
 *    `/it/fields/tag/qgis`), altrimenti il selettore di lingua si rompe
 *    e la SEO si sparpaglia su due set di pagine.
 *
 * 2. NIENTE TAG DA UNA VOCE SOLA (vedi `MIN_VOCI_PER_TAG`). Un tag che
 *    filtra a un elemento è un link all'articolo travestito da facet:
 *    non genera pagina e non è cliccabile.
 *
 * 3. NIENTE FACET DI SERVIZIO. `teaching.lingua` e `projects.ruolo` sono
 *    esclusi di proposito: il primo non è un tema, il secondo è testo
 *    libero e produrrebbe un tag per voce.
 */

import { getCollection } from "astro:content";
import { perLingua } from "./contenuti";
import { linguaDefault, type Lingua } from "../i18n/testi";
import type { FieldCategory } from "../data/fields";

/** Sotto questa soglia un tag non esiste: niente pagina, niente link. */
export const MIN_VOCI_PER_TAG = 2;

export type TagVoce = {
  /** `categoria/chiave`, lo stesso id usato dai marker della spirale. */
  id: string;
  categoria: FieldCategory;
  chiave: string;
  titolo: string;
  sommario: string;
  data?: Date;
  anno: number | null;
  href: string;
};

export type Tag = {
  slug: string;
  etichetta: string;
  conteggio: number;
};

export type IndiceTag = {
  /** Tutti i tag pubblici (conteggio >= MIN_VOCI_PER_TAG), per conteggio decrescente. */
  tag: Tag[];
  /** Slug -> voci che lo portano, in ordine di data decrescente. */
  vociPerTag: Map<string, TagVoce[]>;
  /** Id della voce -> slug dei suoi tag pubblici. */
  tagPerVoce: Map<string, string[]>;
};

/**
 * Fusioni esplicite: sorgenti che dicono la stessa cosa con parole diverse.
 * Chiave = slug grezzo di partenza, valore = slug canonico d'arrivo.
 * Da tenere corto: se cresce, il problema è nei frontmatter.
 */
const ALIAS: Record<string, string> = {
  lcz: "local-climate-zones",
  "envi-met": "envimet",
  envimet: "envimet",
  gis: "qgis",
  // La famiglia UNICAM: cinque modi di scrivere la stessa affiliazione.
  "universita-di-camerino-saad": "universita-di-camerino",
  "saad-unicam-master-di-ii-livello": "universita-di-camerino",
  "universita-di-camerino-universita-di-firenze": "universita-di-camerino",
  "universita-di-camerino-compagnia-dei-folli": "universita-di-camerino",
  "cluster-clima-universita-di-camerino": "universita-di-camerino",
};

/**
 * Etichette che vincono sul testo del frontmatter. Servono ai gruppi
 * costruiti via ALIAS: senza, il nome del tag sarebbe quello della prima
 * voce incontrata (e cioè un caso).
 */
const ETICHETTE_CANONICHE: Record<string, Record<Lingua, string>> = {
  "universita-di-camerino": { en: "University of Camerino", it: "Università di Camerino" },
  envimet: { en: "ENVI-met", it: "ENVI-met" },
  qgis: { en: "QGIS", it: "QGIS" },
};

/** Etichette bilingui per i valori enumerati (che nei frontmatter sono in italiano). */
const ETICHETTE_ENUM: Record<string, Record<Lingua, string>> = {
  corso: { en: "Course", it: "Corso" },
  master: { en: "Master", it: "Master" },
  seminario: { en: "Seminar", it: "Seminario" },
  lecture: { en: "Lecture", it: "Lezione" },
  workshop: { en: "Workshop", it: "Workshop" },
  concorso: { en: "Competition", it: "Concorso" },
  ricerca: { en: "Research project", it: "Progetto di ricerca" },
  installazione: { en: "Installation", it: "Installazione" },
};

/** Una sorgente di tag: la stringa EN (che fa lo slug) e quella nella lingua chiesta. */
type Sorgente = { en: string; etichetta: string };

function enumSorgente(valore: string, lingua: Lingua): Sorgente | null {
  if (!valore) return null;
  const voce = ETICHETTE_ENUM[valore];
  if (!voce) return { en: valore, etichetta: valore };
  return { en: voce.en, etichetta: voce[lingua] ?? voce.en };
}

/** `Façade design` -> `facade-design`. Accenti via, tutto il resto in trattini. */
export function slugTag(testo: string): string {
  return testo
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function canonico(testo: string): string {
  const grezzo = slugTag(testo);
  return ALIAS[grezzo] ?? grezzo;
}

export function hrefTag(slug: string, lingua: Lingua | string = linguaDefault): string {
  return lingua === "it" ? `/it/fields/tag/${slug}` : `/fields/tag/${slug}`;
}

export function hrefVoce(
  categoria: FieldCategory,
  chiave: string,
  lingua: Lingua | string = linguaDefault,
): string {
  return lingua === "it" ? `/it/fields/${categoria}/${chiave}` : `/fields/${categoria}/${chiave}`;
}

function primoAnno(testo: string): number | null {
  const match = testo.match(/\d{4}/);
  return match ? Number(match[0]) : null;
}

/**
 * Accoppia le voci EN e IT della stessa collection per `chiave`: lo slug
 * del tag esce sempre dalla versione EN, l'etichetta da quella richiesta.
 */
function accoppia<T extends { id: string }>(voci: T[], lingua: Lingua) {
  const en = perLingua(voci, "en");
  const tradotte = new Map(perLingua(voci, lingua).map((v) => [v.chiave, v]));
  return en.map((voceEn) => ({
    en: voceEn,
    loc: tradotte.get(voceEn.chiave) ?? voceEn,
  }));
}

/** Le stringhe parallele EN/localizzata di un array di frontmatter. */
function daArray(arrEn: string[] = [], arrLoc: string[] = []): Sorgente[] {
  return arrEn.map((testo, i) => ({ en: testo, etichetta: arrLoc[i] ?? testo }));
}

/**
 * Costruisce l'indice completo dei tag per una lingua.
 * È l'unico punto in cui si decide cosa, di ogni collection, diventa tag.
 */
export async function getIndiceTag(lingua: Lingua | string = linguaDefault): Promise<IndiceTag> {
  const l: Lingua = lingua === "it" ? "it" : "en";

  const [rawResearch, rawTools, rawTeaching, rawProjects] = await Promise.all([
    getCollection("research"),
    getCollection("tools"),
    getCollection("teaching"),
    getCollection("projects"),
  ]);

  type Grezza = { voce: TagVoce; sorgenti: Sorgente[] };
  const grezze: Grezza[] = [];

  for (const { en, loc } of accoppia(rawResearch, l)) {
    grezze.push({
      voce: {
        id: `research/${en.chiave}`,
        categoria: "research",
        chiave: en.chiave,
        titolo: loc.data.titolo,
        sommario: loc.data.sommario,
        data: loc.data.data,
        anno: loc.data.data.getFullYear(),
        href: hrefVoce("research", en.chiave, l),
      },
      sorgenti: daArray(en.data.tag, loc.data.tag),
    });
  }

  for (const { en, loc } of accoppia(rawTools, l)) {
    const sorgenti = [
      ...daArray(en.data.tag, loc.data.tag),
      ...daArray(en.data.ambiente, loc.data.ambiente),
    ];
    if (en.data.linguaggio) {
      sorgenti.push({ en: en.data.linguaggio, etichetta: loc.data.linguaggio ?? en.data.linguaggio });
    }
    grezze.push({
      voce: {
        id: `tools/${en.chiave}`,
        categoria: "tools",
        chiave: en.chiave,
        titolo: loc.data.nome,
        sommario: loc.data.sommario,
        data: loc.data.data,
        anno: loc.data.data.getFullYear(),
        href: hrefVoce("tools", en.chiave, l),
      },
      sorgenti,
    });
  }

  for (const { en, loc } of accoppia(rawTeaching, l)) {
    const sorgenti: Sorgente[] = daArray(en.data.tag, loc.data.tag);
    const tipo = enumSorgente(en.data.tipo, l);
    if (tipo) sorgenti.push(tipo);
    if (en.data.luogo) sorgenti.push({ en: en.data.luogo, etichetta: loc.data.luogo ?? en.data.luogo });
    if (en.data.istituzione) {
      sorgenti.push({ en: en.data.istituzione, etichetta: loc.data.istituzione ?? en.data.istituzione });
    }
    grezze.push({
      voce: {
        id: `teaching/${en.chiave}`,
        categoria: "teaching",
        chiave: en.chiave,
        titolo: loc.data.titolo,
        sommario: loc.data.sommario,
        data: loc.data.data,
        anno: loc.data.data?.getFullYear() ?? primoAnno(en.data.anni),
        href: hrefVoce("teaching", en.chiave, l),
      },
      sorgenti,
    });
  }

  for (const { en, loc } of accoppia(rawProjects, l)) {
    const sorgenti: Sorgente[] = daArray(en.data.tag, loc.data.tag);
    const tipo = enumSorgente(en.data.tipo, l);
    if (tipo) sorgenti.push(tipo);
    if (en.data.luogo) sorgenti.push({ en: en.data.luogo, etichetta: loc.data.luogo ?? en.data.luogo });
    grezze.push({
      voce: {
        id: `projects/${en.chiave}`,
        categoria: "projects",
        chiave: en.chiave,
        titolo: loc.data.titolo,
        sommario: loc.data.sommario,
        data: loc.data.data,
        anno: loc.data.data?.getFullYear() ?? primoAnno(en.data.anni),
        href: hrefVoce("projects", en.chiave, l),
      },
      sorgenti,
    });
  }

  // Primo passaggio: raccolta grezza, slug -> etichetta + voci.
  const raccolta = new Map<string, { etichetta: string; voci: TagVoce[] }>();

  for (const { voce, sorgenti } of grezze) {
    const vistiInQuestaVoce = new Set<string>();
    for (const sorgente of sorgenti) {
      const slug = canonico(sorgente.en);
      if (!slug || vistiInQuestaVoce.has(slug)) continue;
      vistiInQuestaVoce.add(slug);

      const gia = raccolta.get(slug);
      if (gia) gia.voci.push(voce);
      else {
        const canonica = ETICHETTE_CANONICHE[slug];
        raccolta.set(slug, { etichetta: canonica ? canonica[l] : sorgente.etichetta, voci: [voce] });
      }
    }
  }

  // Secondo passaggio: si tiene solo ciò che filtra davvero (regola 2).
  const vociPerTag = new Map<string, TagVoce[]>();
  const tag: Tag[] = [];

  for (const [slug, { etichetta, voci }] of raccolta) {
    if (voci.length < MIN_VOCI_PER_TAG) continue;
    const ordinate = [...voci].sort(
      (a, b) => (b.data?.getTime() ?? 0) - (a.data?.getTime() ?? 0),
    );
    vociPerTag.set(slug, ordinate);
    tag.push({ slug, etichetta, conteggio: ordinate.length });
  }

  tag.sort((a, b) => b.conteggio - a.conteggio || a.etichetta.localeCompare(b.etichetta));

  const tagPerVoce = new Map<string, string[]>();
  for (const [slug, voci] of vociPerTag) {
    for (const voce of voci) {
      const gia = tagPerVoce.get(voce.id);
      if (gia) gia.push(slug);
      else tagPerVoce.set(voce.id, [slug]);
    }
  }

  return { tag, vociPerTag, tagPerVoce };
}

/** Gli slug che meritano una pagina statica. */
export async function getSlugTagPubblici(): Promise<string[]> {
  const { tag } = await getIndiceTag("en");
  return tag.map((t) => t.slug);
}
