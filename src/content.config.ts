import { defineCollection, z } from "astro:content";
import { loaderBilingue } from "./lib/loader-bilingue";

/**
 * Le quattro collection di Fields (research, tools, teaching, projects).
 * Usano il loader custom bilingue per supportare la gestione EN/IT con token $$$
 * all'interno di un unico file per contenuto.
 */

const mediaSchema = z
  .array(
    z.object({
      id: z.string(),
      url: z.string(),
      tipo: z.enum(["immagine", "video"]).optional(),
    }),
  )
  .default([]);

const research = defineCollection({
  loader: loaderBilingue("research"),
  schema: z.object({
    titolo: z.string(),
    data: z.coerce.date(),
    sommario: z.string(),
    tag: z.array(z.string()).default([]),
    fonte: z.string().optional(),
    fonteUrl: z.string().url().optional(),
    media: mediaSchema,
  }),
});

const tools = defineCollection({
  loader: loaderBilingue("tools"),
  schema: z.object({
    nome: z.string(),
    sommario: z.string(),
    data: z.coerce.date(),
    linguaggio: z.string().optional(),
    ambiente: z.array(z.string()).default([]),
    tag: z.array(z.string()).default([]),
    repo: z.string().url(),
    doi: z.string().url().optional(),
    sito: z.string().url().optional(),
    licenza: z.string().optional(),
    media: mediaSchema,
  }),
});

const teaching = defineCollection({
  loader: loaderBilingue("teaching", {
    ignore: ["teaching-assistance", "thesis-co-supervision"],
  }),
  schema: z.object({
    tipo: z.enum(["corso", "master", "seminario", "lecture", "workshop"]),
    anni: z.string(),
    data: z.coerce.date().optional(),
    attivo: z.boolean().default(false),
    istituzione: z.string(),
    luogo: z.string(),
    lingua: z.enum(["it", "en"]),
    tag: z.array(z.string()).default([]),
    titolo: z.string(),
    sommario: z.string(),
    media: mediaSchema,
  }),
});

const projects = defineCollection({
  loader: loaderBilingue("projects"),
  schema: z.object({
    titolo: z.string(),
    anni: z.string(),
    data: z.coerce.date().optional(),
    luogo: z.string(),
    ruolo: z.string(),
    tipo: z.enum(["concorso", "workshop", "ricerca", "installazione"]),
    esito: z.string().optional(),
    url: z.string().url().optional(),
    inEvidenza: z.boolean().default(false),
    tag: z.array(z.string()).default([]),
    sommario: z.string(),
    media: mediaSchema,
  }),
});

/**
 * I PROGETTI DI RICERCA FINANZIATI — non fa parte di Fields.
 *
 * Categoria a sé: grant e progetti finanziati a cui ho partecipato come
 * unità di ricerca, non come titolare del finanziamento. Schema diverso
 * dalle quattro collection di Fields (acronimo/programma/anni/ruolo/partner,
 * niente tag né corpo pubblicato) — vive come sesta sezione di
 * `/publications`, resa da `PaginaPublications.astro`.
 *
 * I file sono `.md` flat in `src/content/publications/research-projects/NN-slug.md`
 * (sottocartella di Publications: la categoria vive concettualmente lì, non a livello radice):
 * il numero in testa NON conta per l'ordine, che si ricava dall'anno
 * d'inizio in `anni` (vedi `progettiRicerca()` in `src/lib/progetti-ricerca.ts`).
 */
const researchProjects = defineCollection({
  loader: loaderBilingue("publications/research-projects"),
  schema: z.object({
    acronimo: z.string(),
    titolo: z.string(),
    /** L'ente o il bando che finanzia: PNRR, Interreg, LIFE, Erasmus+… */
    programma: z.string(),
    /** "2023 – 2025" oppure "2024 —" per i progetti ancora aperti. */
    anni: z.string(),
    ruolo: z.string(),
    partner: z.string(),
    url: z.string().url().optional(),
    /** In corso: la riga lo segnala con un pallino. */
    attivo: z.boolean().default(false),
  }),
});

/**
 * L'ATTIVITÀ DI PEER REVIEW — non viene dal .bib.
 *
 * Riviste e volumi per cui ho fatto da revisore, non da autore: non sono
 * referenze bibliografiche mie, quindi non stanno in `src/data/pubblicazioni.json`
 * (generato dal `.bib` di IRIS). Prima erano l'unico contenuto manuale dentro
 * `pubblicazioni.manuale.json`; spostate in file `.md` il 2026-08-22 per lo
 * stesso motivo di `research-projects` — poche voci scritte a mano, un file
 * per voce è più comodo di una chiave JSON. Nessun bisogno di bilingue (nomi
 * di riviste/editori), ma il loader lo offre comunque per uniformità.
 */
const peerReview = defineCollection({
  loader: loaderBilingue("publications/peer-review"),
  schema: z.object({
    anno: z.number(),
    rivista: z.string(),
    editore: z.string(),
  }),
});

export const collections = {
  research,
  tools,
  teaching,
  projects,
  "research-projects": researchProjects,
  "peer-review": peerReview,
};
