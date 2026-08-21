import { existsSync, promises as fs } from "node:fs";
import { fileURLToPath } from "node:url";
import * as yaml from "js-yaml";
import type { Loader } from "astro/loaders";

/**
 * UN FILE .MDX PER CONTENUTO, NON DUE.
 * ====================================
 *
 * Ogni contenuto vive in un solo file, `src/content/<collezione>/<slug>/<slug>.mdx`
 * (oppure `<slug>.mdx`), e la lingua si separa al suo interno con il token `$$$`:
 *
 * - in una riga di frontmatter: `campo: "inglese" $$$ "italiano"` (se manca `$$$`, vale per entrambe le lingue);
 * - nel corpo del testo: una riga contenente solo `$$$` separa la versione inglese (in alto) da quella italiana (in basso);
 *   se manca `$$$`, il corpo vale per entrambe.
 *
 * Il loader genera DUE voci per file: `en/<slug>` e `it/<slug>`.
 */

const SEPARATORE_CAMPO = /\s\$\$\$\s/;
const SEPARATORE_CORPO = /\r?\n[ \t]*\$\$\$[ \t]*\r?\n/;
const RIGA_CAMPO = /^([A-Za-z0-9_-]+):[ \t](.*)$/;
const RIGA_ARRAY = /^([ \t]*-[ \t]+)(.*)$/;
const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

export function spaccaFrontmatter(testo: string, file: string): { en: string; it: string } {
  const righeEn: string[] = [];
  const righeIt: string[] = [];
  for (const riga of testo.split(/\r?\n/)) {
    const trovatoCampo = riga.match(RIGA_CAMPO);
    if (trovatoCampo) {
      const [, chiave, resto] = trovatoCampo;
      const parti = resto.split(SEPARATORE_CAMPO);
      if (parti.length > 2) {
        throw new Error(`${file}: più di un "$$$" nel campo "${chiave}"`);
      }
      righeEn.push(`${chiave}: ${parti[0]}`);
      righeIt.push(`${chiave}: ${parti.length === 2 ? parti[1] : parti[0]}`);
      continue;
    }

    const trovatoArray = riga.match(RIGA_ARRAY);
    if (trovatoArray) {
      const [, prefisso, resto] = trovatoArray;
      const parti = resto.split(SEPARATORE_CAMPO);
      if (parti.length > 2) {
        throw new Error(`${file}: più di un "$$$" nell'elemento "${riga}"`);
      }
      righeEn.push(`${prefisso}${parti[0]}`);
      righeIt.push(`${prefisso}${parti.length === 2 ? parti[1] : parti[0]}`);
      continue;
    }

    righeEn.push(riga);
    righeIt.push(riga);
  }
  return { en: righeEn.join("\n"), it: righeIt.join("\n") };
}

export function spaccaCorpo(testo: string, file: string): { en: string; it: string } {
  const parti = testo.split(SEPARATORE_CORPO);
  if (parti.length > 2) {
    throw new Error(`${file}: più di un "$$$" nel corpo del testo`);
  }
  return { en: parti[0].trim(), it: (parti[1] ?? parti[0]).trim() };
}

export const LINGUE = ["en", "it"] as const;

export interface LoaderBilingueOptions {
  ignore?: string[];
}

/**
 * Il content layer conserva in cache l'HTML già renderizzato e lo riusa finché il
 * digest non cambia. Il digest però guarda solo il contenuto dell'articolo: se
 * cambia la pipeline markdown (plugin remark/rehype, config), gli articoli non
 * toccati continuano a servire HTML vecchio, e in dev sembra che il plugin nuovo
 * non funzioni. Si mette quindi nel digest anche lo stato della pipeline.
 */
async function digestPipeline(root: URL): Promise<string> {
  const sorgenti = ["src/lib/remark-articolo.ts", "astro.config.mjs"];
  const contenuti = await Promise.all(
    sorgenti.map((percorso) => fs.readFile(new URL(percorso, root), "utf-8").catch(() => "")),
  );
  return contenuti.join("\u0000");
}

export function loaderBilingue(cartella: string, options: LoaderBilingueOptions = {}): Loader {
  const ignorePatterns = options.ignore ?? [];

  return {
    name: "loader-bilingue",
    load: async ({ config, store, parseData, generateDigest, renderMarkdown, logger, watcher }) => {
      const baseDir = new URL(`./src/content/${cartella}/`, config.root);
      if (!existsSync(baseDir)) {
        logger.warn(`La cartella "${fileURLToPath(baseDir)}" non esiste.`);
        return;
      }
      const baseFs = fileURLToPath(baseDir);
      const pipeline = await digestPipeline(config.root);

      const chiaveDiFile = (percorso: string) => percorso.split("/")[0].replace(/\.(mdx|md)$/, "");

      async function sincronizza(percorso: string) {
        const chiave = chiaveDiFile(percorso);
        const fileUrl = new URL(percorso, baseDir);
        const relativo = `src/content/${cartella}/${percorso}`;

        const contenuto = await fs.readFile(fileUrl, "utf-8").catch(() => undefined);
        if (contenuto === undefined) {
          for (const lingua of LINGUE) store.delete(`${lingua}/${chiave}`);
          return;
        }

        const corrispondenza = contenuto.match(FRONTMATTER);
        if (!corrispondenza) {
          logger.error(`${relativo}: manca il frontmatter fra "---"`);
          return;
        }
        const [, frontmatterGrezzo, corpoGrezzo] = corrispondenza;
        const frontmatter = spaccaFrontmatter(frontmatterGrezzo, relativo);
        const corpo = spaccaCorpo(corpoGrezzo, relativo);
        const digest = generateDigest(contenuto + pipeline);

        for (const lingua of LINGUE) {
          const id = `${lingua}/${chiave}`;
          let dataGrezza: unknown;
          try {
            dataGrezza = yaml.load(frontmatter[lingua]);
          } catch (errore) {
            logger.error(`${relativo} (${lingua}): frontmatter non valido — ${(errore as Error).message}`);
            continue;
          }

          const data = await parseData({
            id,
            data: dataGrezza as Record<string, unknown>,
            filePath: relativo,
          });

          const rendered = await renderMarkdown(corpo[lingua], { fileURL: fileUrl });
          store.set({
            id,
            data,
            body: corpo[lingua],
            filePath: relativo,
            digest,
            rendered,
            assetImports: rendered?.metadata?.imagePaths,
          });
        }
      }

      const vociRoot = await fs.readdir(baseFs, { withFileTypes: true });
      const percorsi: string[] = [];

      for (const voce of vociRoot) {
        if (ignorePatterns.some((ig) => voce.name === ig || voce.name.startsWith(ig))) {
          continue;
        }
        if (voce.isFile() && (voce.name.endsWith(".mdx") || voce.name.endsWith(".md"))) {
          percorsi.push(voce.name);
        } else if (voce.isDirectory()) {
          const candidatoMdx = `${voce.name}/${voce.name}.mdx`;
          const candidatoMd = `${voce.name}/${voce.name}.md`;
          if (existsSync(new URL(candidatoMdx, baseDir))) {
            percorsi.push(candidatoMdx);
          } else if (existsSync(new URL(candidatoMd, baseDir))) {
            percorsi.push(candidatoMd);
          }
        }
      }

      await Promise.all(percorsi.map(sincronizza));

      const chiaviValide = new Set(percorsi.map(chiaveDiFile));
      for (const id of store.keys()) {
        const [lingua, ...resto] = id.split("/");
        if (!(LINGUE as readonly string[]).includes(lingua as (typeof LINGUE)[number])) continue;
        if (!chiaviValide.has(resto.join("/"))) store.delete(id);
      }

      if (!watcher) return;
      watcher.add(baseFs);
      const tocca = (percorso: string) => percorso.startsWith(baseFs) && (percorso.endsWith(".mdx") || percorso.endsWith(".md"));
      const ricarica = async (percorso: string) => {
        if (!tocca(percorso)) return;
        const relativo = percorso.slice(baseFs.length);
        if (ignorePatterns.some((ig) => relativo.startsWith(ig))) return;
        await sincronizza(relativo);
        logger.info(`Ricaricato ${relativo}`);
      };
      watcher.on("change", ricarica);
      watcher.on("add", ricarica);
      watcher.on("unlink", ricarica);
    },
  };
}
