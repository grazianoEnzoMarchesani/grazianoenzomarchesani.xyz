import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

/**
 * Le quattro collection di Fields (research, tools, teaching, projects).
 * Schemi tenuti separati e con chiavi in italiano — ereditati dal vecchio
 * sito (sitoBello2), i quattro tipi di contenuto sono troppo diversi per
 * fondersi in un unico schema senza perdere informazione (vedi
 * docs/brain/content-plan.md).
 *
 * research-projects resta fuori da Fields (categoria a sé, non ancora
 * collegata a una pagina) e non ha qui una collection.
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

/** Slug pulito: il nome della cartella, non "cartella/cartella" (che il
 *  default del loader `glob` produrrebbe per la convenzione a cartella
 *  propria usata da tutte e quattro le collection). */
const generateId = ({ entry }: { entry: string }) => entry.split("/")[0];

const research = defineCollection({
  loader: glob({ pattern: "*/*.mdx", base: "./src/content/research", generateId }),
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
  loader: glob({ pattern: "*/*.mdx", base: "./src/content/tools", generateId }),
  schema: z.object({
    nome: z.string(),
    sommario: z.string(),
    data: z.coerce.date(),
    linguaggio: z.string().optional(),
    ambiente: z.array(z.string()).default([]),
    repo: z.string().url(),
    doi: z.string().url().optional(),
    sito: z.string().url().optional(),
    licenza: z.string().optional(),
    media: mediaSchema,
  }),
});

const teaching = defineCollection({
  loader: glob({
    pattern: ["*/*.mdx", "!teaching-assistance/**", "!thesis-co-supervision/**"],
    base: "./src/content/teaching",
    generateId,
  }),
  schema: z.object({
    tipo: z.enum(["corso", "master", "seminario", "lecture", "workshop"]),
    anni: z.string(),
    /** Data puntuale dentro l'anno, opzionale: `anni` dà solo l'anno (o
     *  un intervallo) e non basta a collocare il contenuto lungo la
     *  corda/spirale di Fields. Dove manca, la posizione dentro l'anno
     *  viene generata in modo deterministico dall'id — vedi
     *  `markerYearFraction` in src/data/fields-content.ts. */
    data: z.coerce.date().optional(),
    attivo: z.boolean().default(false),
    istituzione: z.string(),
    luogo: z.string(),
    /** La lingua in cui il corso si tiene — non è la lingua della pagina. */
    lingua: z.enum(["it", "en"]),
    titolo: z.string(),
    sommario: z.string(),
    media: mediaSchema,
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: "*/*.mdx", base: "./src/content/projects", generateId }),
  schema: z.object({
    titolo: z.string(),
    anni: z.string(),
    /** Vedi la nota omonima su `teaching`. */
    data: z.coerce.date().optional(),
    luogo: z.string(),
    ruolo: z.string(),
    tipo: z.enum(["concorso", "workshop", "ricerca", "installazione"]),
    esito: z.string().optional(),
    url: z.string().url().optional(),
    inEvidenza: z.boolean().default(false),
    sommario: z.string(),
    media: mediaSchema,
  }),
});

export const collections = { research, tools, teaching, projects };
