import * as yaml from "js-yaml";
import type { Code, Paragraph, Root, RootContent } from "mdast";

/**
 * Trasforma i corpi Markdown di Fields nei blocchi ricchi degli articoli.
 *
 * NIENTE SINTASSI NUOVA salvo il blocco recintato ```grafico: si usa quella che
 * Markdown ha già.
 * - ```grafico                        → segnaposto per un'isola React (montata da monta-grafici.ts)
 * - ![alt](./foto.jpg "Didascalia")   → <figure> + <figcaption>, se l'immagine è sola nel paragrafo
 * - [Titolo](https://youtu.be/ID)     → facciata video, se il link è solo nel paragrafo
 *
 * TAGLIO DELLA FIGURA. Un token iniziale nel *title* dell'immagine forza il
 * taglio e viene tolto dalla didascalia:
 *   ![alt](fig.png "@wide Didascalia vera")
 *   @inset → il testo le scorre attorno · @wide → fascia · @side → verticale · @full → forza larghezza-testo
 * Senza token il taglio lo decide impagina-articolo.ts dalle proporzioni.
 *
 * NUMERAZIONE. Ogni figura (immagine, grafico, video) riceve `data-fig="N"`
 * progressivo nell'ordine del documento; l'etichetta "Fig. N" la disegna il CSS
 * via ::before. Il render è per lingua, quindi il contatore riparte da 1 a ogni
 * lingua senza travasi.
 *
 * Gira a livello remark, non rehype: Shiki evidenzia i blocchi recintati prima
 * che rehype li veda e ne butta via il nome del linguaggio. Le immagini restano
 * nodi mdast — se diventassero HTML grezzo perderebbero l'ottimizzazione di
 * astro:assets, che il loader bilingue attiva via `assetImports`.
 *
 * Vale per tutte e quattro le collection, perché il loader chiama `renderMarkdown`,
 * che usa la config markdown del progetto.
 */

const escape = (testo: string) => testo.replace(/&/g, "&amp;").replace(/'/g, "&#39;").replace(/</g, "&lt;");

/** `@marker` iniziale nel title dell'immagine → classe di taglio. */
const TAGLI: Record<string, string> = {
  inset: "fig--inset",
  wide: "fig--band",
  side: "fig--portrait",
  full: "fig--full",
};

/** Estrae l'id video da un URL YouTube, o null se non è YouTube. */
function idYoutube(url: string): string | null {
  const trovato = url.match(/^https?:\/\/(?:www\.)?(?:youtu\.be\/([\w-]{11})|youtube\.com\/(?:watch\?v=|embed\/)([\w-]{11}))/);
  return trovato ? (trovato[1] ?? trovato[2]) : null;
}

/** Un paragrafo che contiene un solo nodo del tipo dato, e nient'altro. */
function figlioUnico<T extends RootContent["type"]>(nodo: RootContent, tipo: T) {
  if (nodo.type !== "paragraph") return null;
  const figli = (nodo as Paragraph).children.filter((f) => !(f.type === "text" && f.value.trim() === ""));
  return figli.length === 1 && figli[0].type === tipo ? (figli[0] as Extract<RootContent, { type: T }>) : null;
}

export function remarkArticolo() {
  return async (tree: Root, file: { path?: string }) => {
    let nFig = 0;
    let nTab = 0;

    const percorri = (nodi: RootContent[]) => {
      for (const [indice, nodo] of nodi.entries()) {
        // --- <figure> scritta a mano nell'MDX senza data-fig (diagrammi SVG
        //     inline che non sono né immagine né grafico) → riceve il numero
        //     progressivo come le altre figure. Nessuna sintassi nuova: è HTML.
        if (
          nodo.type === "html" &&
          /^\s*<figure\b/i.test((nodo as { value: string }).value) &&
          !/\bdata-fig=/i.test((nodo as { value: string }).value)
        ) {
          const n = ++nFig;
          // `data-fig` va SUBITO dopo `class="…"`: è l'ordine che si aspetta
          // miniature-figure.ts (RE_FIGURA) per disegnare il provino nella rail.
          const grezzo = (nodo as { value: string }).value;
          (nodo as { value: string }).value = /<figure\s+class="[^"]*"/i.test(grezzo)
            ? grezzo.replace(/(<figure\s+class="[^"]*")/i, `$1 data-fig="${n}"`)
            : grezzo.replace(/<figure\b/i, `<figure data-fig="${n}"`);
          continue;
        }

        // --- ```grafico → segnaposto per l'isola React
        if (nodo.type === "code" && (nodo as Code).lang === "grafico") {
          let config: Record<string, unknown>;
          try {
            config = (yaml.load((nodo as Code).value) ?? {}) as Record<string, unknown>;
          } catch (errore) {
            throw new Error(`${file.path ?? "articolo"}: blocco "grafico" con YAML non valido — ${(errore as Error).message}`);
          }
          const n = ++nFig;
          const didascalia = config.didascalia ? `<figcaption>${escape(String(config.didascalia))}</figcaption>` : "";
          nodi[indice] = {
            type: "html",
            value:
              `<figure class="grafico" data-fig="${n}">` +
              `<div data-grafico='${escape(JSON.stringify(config))}' style="aspect-ratio:${config.proporzione ?? "2 / 1"}">` +
              `<div class="grafico-scheletro" aria-hidden="true"></div>` +
              `</div>${didascalia}</figure>`,
          };
          continue;
        }

        // --- tabella Markdown → avvolta in un contenitore che scorre in orizzontale
        //     su schermi stretti (la tabella da sola sfonderebbe la colonna). Lo
        //     stile della tabella vive in FieldArticleBody.astro: nessuna sintassi
        //     nuova, nessuna variante — vale per ogni tabella di ogni articolo.
        if (nodo.type === "table") {
          const n = ++nTab;
          nodi[indice] = {
            type: "tabellaAvvolta",
            data: {
              hName: "div",
              hProperties: {
                className: ["tabella-avvolta"],
                id: `tabella-${n}`,
                "data-tab": String(n),
              },
            },
            children: [nodo],
          } as never;
          continue;
        }

        // --- immagine sola nel paragrafo → <figure>, con il title come didascalia
        const immagine = figlioUnico(nodo, "image");
        if (immagine) {
          const n = ++nFig;
          const paragrafo = nodo as Paragraph;
          const classi = ["figura"];

          let didascalia = immagine.title ?? "";
          const marcatore = didascalia.match(/^@(inset|wide|side|full)\b[ \t]*/);
          if (marcatore) {
            classi.push(TAGLI[marcatore[1]]);
            didascalia = didascalia.slice(marcatore[0].length);
          }

          paragrafo.data = {
            ...paragrafo.data,
            hName: "figure",
            hProperties: { className: classi, "data-fig": String(n) },
          };
          immagine.title = null;
          paragrafo.children = didascalia
            ? [
                immagine,
                { type: "paragraph", data: { hName: "figcaption" }, children: [{ type: "text", value: didascalia }] } as never,
              ]
            : [immagine];
          continue;
        }

        // --- link YouTube solo nel paragrafo → facciata testuale, nessun contatto con Google
        //
        // Senza consenso non esce di qui NESSUNA immagine: né remota (chiamerebbe
        // i.ytimg.com al caricamento, cioè prima di qualsiasi consenso) né locale
        // (costava ~65 KB di repo per video anche a chi il consenso lo nega). Solo
        // testo dentro un normale collegamento, che senza consenso — stato
        // predefinito, e unico stato possibile senza JavaScript — porta su
        // youtube.com. La copertina vera e il player incorporato li mette
        // video-yt.ts, ma solo dopo un consenso esplicito.
        //
        // La didascalia è quella dell'autore, col title del link come per le
        // immagini: [Titolo](https://youtu.be/ID "Didascalia"). Non dice niente su
        // YouTube né sul consenso, e resta identica nei due stati.
        const collegamento = figlioUnico(nodo, "link");
        const id = collegamento && idYoutube(collegamento.url);
        if (collegamento && id) {
          const n = ++nFig;
          const titolo = collegamento.children.map((f) => ("value" in f ? f.value : "")).join("") || "Video";
          const didascalia = collegamento.title ? `<figcaption>${escape(collegamento.title)}</figcaption>` : "";
          nodi[indice] = {
            type: "html",
            value:
              `<figure class="video-yt" data-fig="${n}" data-videoid="${id}" data-titolo="${escape(titolo)}" data-consenso="no">` +
              `<a class="video-yt-facciata" href="https://www.youtube.com/watch?v=${id}"` +
              ` target="_blank" rel="noopener noreferrer">` +
              `<span lang="en">Click to play on YouTube</span>` +
              `<span lang="it">Clicca per riprodurre su YouTube</span>` +
              `</a>${didascalia}</figure>`,
          };
          continue;
        }

        if ("children" in nodo && Array.isArray(nodo.children)) percorri(nodo.children as RootContent[]);
      }
    };

    percorri(tree.children);
  };
}
