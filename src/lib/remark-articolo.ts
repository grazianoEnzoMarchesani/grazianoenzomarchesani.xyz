import * as yaml from "js-yaml";
import type { Code, Paragraph, Root, RootContent } from "mdast";

/**
 * Trasforma i corpi Markdown di Fields nei blocchi ricchi degli articoli.
 *
 * NIENTE SINTASSI NUOVA: si usa quella che Markdown ha già.
 * - ```grafico                        → segnaposto per un'isola React (montata da monta-grafici.ts)
 * - ![alt](./foto.jpg "Didascalia")   → <figure> + <figcaption>, se l'immagine è sola nel paragrafo
 * - [Titolo](https://youtu.be/ID)     → facciata video, se il link è solo nel paragrafo
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
    const percorri = (nodi: RootContent[]) => {
      for (const [indice, nodo] of nodi.entries()) {
        // --- ```grafico → segnaposto per l'isola React
        if (nodo.type === "code" && (nodo as Code).lang === "grafico") {
          let config: Record<string, unknown>;
          try {
            config = (yaml.load((nodo as Code).value) ?? {}) as Record<string, unknown>;
          } catch (errore) {
            throw new Error(`${file.path ?? "articolo"}: blocco "grafico" con YAML non valido — ${(errore as Error).message}`);
          }
          const didascalia = config.didascalia ? `<figcaption>${escape(String(config.didascalia))}</figcaption>` : "";
          nodi[indice] = {
            type: "html",
            value:
              `<figure class="grafico">` +
              `<div data-grafico='${escape(JSON.stringify(config))}' style="aspect-ratio:${config.proporzione ?? "2 / 1"}">` +
              `<div class="grafico-scheletro" aria-hidden="true"></div>` +
              `</div>${didascalia}</figure>`,
          };
          continue;
        }

        // --- immagine sola nel paragrafo → <figure>, con il title come didascalia
        const immagine = figlioUnico(nodo, "image");
        if (immagine) {
          const paragrafo = nodo as Paragraph;
          paragrafo.data = { ...paragrafo.data, hName: "figure", hProperties: { className: ["figura"] } };
          if (immagine.title) {
            paragrafo.children = [
              immagine,
              { type: "paragraph", data: { hName: "figcaption" }, children: [{ type: "text", value: immagine.title }] } as never,
            ];
            immagine.title = null;
          }
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
          const titolo = collegamento.children.map((f) => ("value" in f ? f.value : "")).join("") || "Video";
          const didascalia = collegamento.title ? `<figcaption>${escape(collegamento.title)}</figcaption>` : "";
          nodi[indice] = {
            type: "html",
            value:
              `<figure class="video-yt" data-videoid="${id}" data-titolo="${escape(titolo)}" data-consenso="no">` +
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
