/**
 * Monta un'isola React su ogni segnaposto `[data-grafico]` emesso da remark-articolo.ts.
 *
 * Sostituisce `client:visible`, che qui non è utilizzabile: le direttive Markdown
 * producono una stringa HTML, non un componente che Astro possa idratare.
 *
 * DUE TRAPPOLE, entrambe già costate un bug:
 * 1. Il sito usa <ClientRouter />: navigando fra pagine il DOM viene scambiato ma
 *    i moduli <script> NON vengono rieseguiti. Il montaggio va quindi agganciato a
 *    `astro:page-load`, che scatta sia al primo caricamento sia a ogni navigazione,
 *    altrimenti arrivando da un link interno il segnaposto resta vuoto per sempre.
 * 2. In dev il preambolo di React Fast Refresh non arriva (vedi sotto).
 */

let osservatore: IntersectionObserver | undefined;

/**
 * In dev, `@astrojs/react` inietta il preambolo di React Fast Refresh solo nelle
 * pagine con un'isola `client:` dichiarata. Qui le isole si montano a mano, quindi
 * quel preambolo non arriva mai e react-dom esplode con "$RefreshSig$ is not defined".
 * In build il refresh non esiste e questo blocco sparisce con il tree-shaking.
 */
async function preamboloDev() {
  if (!import.meta.env.DEV || "$RefreshSig$" in window) return;
  // Modulo virtuale di Vite: esiste solo in dev, TypeScript non può conoscerlo.
  const runtime = (await import(/* @vite-ignore */ "/@react-refresh" as string)) as {
    injectIntoGlobalHook: (finestra: Window) => void;
  };
  runtime.injectIntoGlobalHook(window);
  (window as unknown as Record<string, unknown>).$RefreshReg$ = () => {};
  (window as unknown as Record<string, unknown>).$RefreshSig$ = () => (tipo: unknown) => tipo;
  (window as unknown as Record<string, unknown>).__vite_plugin_react_preamble_installed__ = true;
}

async function monta(elemento: HTMLElement) {
  if (elemento.dataset.montato) return;
  elemento.dataset.montato = "1";

  await preamboloDev();
  const [{ createRoot }, { creaGrafico }] = await Promise.all([
    import("react-dom/client"),
    import("../components/charts/adattatore"),
  ]);

  const grafico = await creaGrafico(JSON.parse(elemento.dataset.grafico!));
  elemento.replaceChildren();
  createRoot(elemento).render(grafico);
}

function avvia() {
  osservatore?.disconnect();
  const segnaposti = document.querySelectorAll<HTMLElement>("[data-grafico]:not([data-montato])");
  if (segnaposti.length === 0) return;

  osservatore = new IntersectionObserver(
    (voci) => {
      for (const voce of voci) {
        if (!voce.isIntersecting) continue;
        osservatore!.unobserve(voce.target);
        monta(voce.target as HTMLElement);
      }
    },
    // Si comincia a caricare prima che il grafico entri in campo, così arriva già pronto.
    { rootMargin: "600px" },
  );

  for (const segnaposto of segnaposti) osservatore.observe(segnaposto);
}

document.addEventListener("astro:page-load", avvia);
