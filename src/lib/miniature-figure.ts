import { getImage } from "astro:assets";
import type { ImageMetadata } from "astro";

/**
 * MINIATURE DELLE FIGURE, GENERATE A BUILD TIME
 * ============================================
 *
 * La rail "Figure" degli articoli di Fields (colonna sinistra, >1180px) mostra
 * un provino per ogni figura. Prima lo costruiva impagina-articolo.ts riusando
 * il file grande della figura, e solo DOPO che questa era comparsa a schermo:
 * su un'immagine in fondo all'articolo il provino restava vuoto finché non ci
 * scrollavi sopra.
 *
 * Qui si legge l'HTML già renderizzato dell'articolo (`entry.rendered.html`,
 * dove le immagini sono ancora segnaposto `__ASTRO_IMAGE_="…"`), si risolve
 * ogni immagine sulla mappa asset di astro:content e si genera un webp piccolo
 * con `getImage()`. Il risultato lo passa la PaginaXxxDettaglio a
 * FieldArticleLayout, che disegna la rail lato server: i provini sono lì dal
 * primo byte, `loading="eager"`, pochi KB l'uno.
 *
 * Grafici (isola React) e video (facciata YouTube) non hanno un file immagine:
 * restano segnaposto e li riempie impagina-articolo.ts a runtime (il grafico
 * copiando l'SVG montato, il video con l'icona ▶).
 */

const LARGHEZZA = 320;
const ALTEZZA = 240;

export type MiniaturaFigura =
  | {
      n: string;
      tipo: "immagine";
      didascalia: string;
      src: string;
      width: number;
      height: number;
    }
  | { n: string; tipo: "grafico" | "video"; didascalia: string }
  /** Le tabelle non hanno un file immagine né un provino: nella rail sono un
   *  rettangolo con la sola etichetta "Tab N". `n` viene da `data-tab`
   *  (remark-articolo), l'ancora è `#tabella-N`. */
  | { n: string; tipo: "tabella" };

const RE_FIGURA = /<figure class="([^"]*)" data-fig="(\d+)"[^>]*>([\s\S]*?)<\/figure>/g;
const RE_IMG = /__ASTRO_IMAGE_="([^"]+)"/;
const RE_CAPTION = /<figcaption>([\s\S]*?)<\/figcaption>/;

/** Entità che Astro usa nei segnaposto immagine + le comuni della didascalia. */
function decodeEntities(s: string): string {
  return s
    .replace(/&(?:#x22|quot);/g, '"')
    .replace(/&(?:#x27|apos);/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

/** Ricostruisce la chiave della mappa `astro:asset-imports` per una figura.
 *  Formato: `<src>?astroContentImageFlag=&importer=<filePath url-encoded>`. */
function chiaveImport(src: string, filePath: string): string {
  const params = new URLSearchParams("astroContentImageFlag=");
  params.set("importer", filePath);
  return `${src}?${params.toString()}`;
}

interface EntryRenderizzato {
  filePath?: string;
  rendered?: { html?: string };
}

export async function miniatureFigure(entry: EntryRenderizzato): Promise<MiniaturaFigura[]> {
  const html = entry.rendered?.html;
  if (!html || !entry.filePath) return [];

  const { default: mappaAsset } = (await import("astro:asset-imports")) as {
    default: Map<string, ImageMetadata>;
  };

  const perFig = new Map<string, MiniaturaFigura>();
  for (const [, classi, n, corpo] of html.matchAll(RE_FIGURA)) {
    const didascalia = decodeEntities((corpo.match(RE_CAPTION)?.[1] ?? "").trim());

    if (classi.includes("grafico")) {
      perFig.set(n, { n, tipo: "grafico", didascalia });
      continue;
    }
    if (classi.includes("video-yt")) {
      perFig.set(n, { n, tipo: "video", didascalia });
      continue;
    }

    // Figura con SVG inline scritto a mano (diagramma): il provino è l'SVG
    // stesso come data URI — nessun file, nessun getImage(). L'SVG porta i
    // fallback di colore (`var(--color-ink, #1a1a19)`), così regge anche
    // isolato dentro <img>.
    const svgInline = corpo.match(/<svg[\s\S]*?<\/svg>/)?.[0];
    if (svgInline) {
      const vb = svgInline.match(/viewBox="[\d.]+ [\d.]+ ([\d.]+) ([\d.]+)"/);
      perFig.set(n, {
        n,
        tipo: "immagine",
        didascalia,
        src: `data:image/svg+xml;base64,${Buffer.from(svgInline).toString("base64")}`,
        width: vb ? Number(vb[1]) : LARGHEZZA,
        height: vb ? Number(vb[2]) : ALTEZZA,
      });
      continue;
    }

    const grezzo = corpo.match(RE_IMG)?.[1];
    if (!grezzo) continue;
    let meta: { src: string };
    try {
      meta = JSON.parse(decodeEntities(grezzo));
    } catch {
      continue;
    }

    const importata = mappaAsset.get(chiaveImport(meta.src, entry.filePath));
    if (!importata) continue;

    // Gli SVG sono già leggeri e sharp non li ridimensiona: si usa il file com'è.
    if (importata.format === "svg") {
      perFig.set(n, {
        n,
        tipo: "immagine",
        didascalia,
        src: importata.src,
        width: importata.width || LARGHEZZA,
        height: importata.height || ALTEZZA,
      });
      continue;
    }

    const img = await getImage({
      src: importata,
      width: LARGHEZZA,
      height: ALTEZZA,
      fit: "cover",
      position: "center",
      format: "webp",
    });
    perFig.set(n, { n, tipo: "immagine", didascalia, src: img.src, width: LARGHEZZA, height: ALTEZZA });
  }

  // Figure e tabelle nell'ordine in cui compaiono nell'articolo: si rilegge la
  // sequenza dei marcatori `data-fig` / `data-tab` e la si usa per fondere i
  // provini (già risolti sopra) con i segnaposto delle tabelle. Le figure non
  // risolte (asset mancante) restano fuori, come prima.
  const fuori: MiniaturaFigura[] = [];
  for (const [, tipo, n] of html.matchAll(/\bdata-(fig|tab)="(\d+)"/g)) {
    if (tipo === "tab") fuori.push({ n, tipo: "tabella" });
    else {
      const f = perFig.get(n);
      if (f) fuori.push(f);
    }
  }

  return fuori;
}
