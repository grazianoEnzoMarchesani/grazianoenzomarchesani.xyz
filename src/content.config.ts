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
    sommario: z.string(),
    media: mediaSchema,
  }),
});

export const collections = { research, tools, teaching, projects };
