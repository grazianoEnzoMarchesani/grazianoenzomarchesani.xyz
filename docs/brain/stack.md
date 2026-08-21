# Stack tecnico

← [index](index.md)

Vedi [constraints.md](constraints.md) per i vincoli che hanno guidato queste scelte.

## Core

- **Astro** — framework principale, output statico. Gestisce le pagine e gli articoli come contenuti tipizzati.
- **TypeScript**. Type-checking via `@astrojs/check` (devDependency, aggiunta 2026-08-18) — `npx astro check`.
- **Markdown, non MDX, per i contenuti delle collection.** `@astrojs/mdx` è installato e serve alle pagine, ma i corpi degli articoli passano da `renderMarkdown()` dentro `loaderBilingue()`: l'estensione `.mdx` dei file di contenuto è decorativa e un componente JSX nel corpo non verrebbe mai eseguito. I blocchi ricchi (grafici, video, LaTeX, figure) si ottengono con un plugin remark sulla sintassi Markdown nativa — vedi [blocchi-articoli.md](blocchi-articoli.md).

## UI framework

- **React**, adottato senza vincoli ideologici: se in futuro conviene altro, si cambia senza problemi. Necessario per i grafici (vedi Bklit UI sotto). I grafici sono l'**unico** punto del sito che spedisce React al browser: prima del 2026-08-21 non esisteva nemmeno un'isola idratata.

## Styling

- **Tailwind CSS**. Già installato e configurato (integrazione `@astrojs/react` + `@tailwindcss/vite` + `@astrojs/mdx` aggiunte allo scaffold). Necessario anche come dipendenza di shadcn/ui/Bklit.

## Animazioni

- **GSAP** — installato e in uso (`ScrollTrigger`, `quickTo`, interpolazioni transform/opacity) per il contatore di sezione della home (vedi [design.md](design.md)), per il pin/scrub della spirale 3D di Fields (vedi [fields-spiral.md](fields-spiral.md)) e per il mazzo di carte interattivo 3D della pagina Skills (`MazzoCompetenze.astro`, modalità stack e ventaglio). Niente Lenis per lo scroll-snap della home: si tiene lo scroll-snap CSS nativo, coordinato con GSAP via `scroller` custom su `#scroll-container` (l'elemento che scrolla non è la window/body ma `<main>`). **Lenis** resta previsto "alla bisogna", non ancora installato/usato.
- **Three.js** — installato e in uso dalla sessione del 2026-08-18 per la spirale 3D della pagina Fields (vedi [fields-spiral.md](fields-spiral.md)); prima adozione, non più solo "prevista alla bisogna". Nota: il chunk che lo include supera i 500kB minificati (warning Vite al build) — accettato consapevolmente, da monitorare se incide sulla velocità percepita.

## Contenuti

- **Astro Content Collections** (nativo) con **`loaderBilingue()`** custom (`src/lib/loader-bilingue.ts`): estrae entrambe le lingue da un unico file `.mdx` tramite token `$$$` (nel frontmatter e nel corpo), generando `en/<slug>` e `it/<slug>` con fallback trasparente a `en`. Nessun CMS esterno per ora.
- **`@astrojs/rss`** (aggiunto 2026-08-20) — generatore ufficiale di feed RSS integrato con le Content Collections di Astro; produce `/rss.xml` e `/fields/rss.xml` con foglio di stile XSLT personalizzato `public/rss.xsl`.

## Bilingue & i18n

- **Astro i18n nativo** (`astro.config.mjs`): `defaultLocale: 'en'`, `locales: ['en', 'it']`, `routing: { prefixDefaultLocale: false, fallbackType: 'rewrite' }`, `fallback: { it: 'en' }`.
- **Dizionario UI** (`src/i18n/testi.ts`): dizionario tipizzato zero-dipendenze con helper `t(chiave, lingua)` e calcolo dinamico dell'URL opposto per il selettore di lingua `EN | IT` in `Nav.astro`.
- **Query contenuti bilingue** (`src/lib/contenuti.ts`): `perLingua(voci, lingua)` per filtrare collezioni con fallback automatico e flag `tradotto`.
- **Tassonomia bilingue** (`src/lib/tag.ts`, 2026-08-21): etichette dei tag in due lingue ma **slug sempre calcolato dall'inglese**, così una pagina di tag ha un solo URL per entrambe le lingue e il selettore EN|IT continua a funzionare. Vedi [tag.md](tag.md).
- **SEO delle pagine tradotte** (`src/components/BaseHead.astro`, 2026-08-21): props `canonical` e `alternate` che emettono `<link rel="canonical">` e `hreflang` en/it/x-default, con barra finale normalizzata perché canonical e hreflang puntino allo stesso identico URL.

## Ricerca Semantica Vettoriale Client-Side

- **`@xenova/transformers` + ONNX Runtime WebAssembly** (aggiunto 2026-08-20):
  - **Build-Time**: `scripts/genera-search-index.mjs` + `scripts/integrazione-ricerca.mjs` generano `public/search-index.json` con metadati e vettori di embedding (384 float normalizzati, `all-MiniLM-L6-v2`) per Research, Tools, Teaching, Projects, Pubblicazioni e Competenze in italiano e inglese.
  - **In-Browser Runtime**: `src/scripts/search-worker.ts` e `src/scripts/search-client.ts` gestiscono la ricerca ibrida (matching testuale immediato in-memory unito al calcolo vettoriale della query in Web Worker per il calcolo della similarità coseno).
  - **Interfaccia**: `SearchModal.astro` (Command Palette modale globale, richiamabile con `⌘K` o icona lente in `Nav.astro`).
  - **Cache del modello legata al secure context**: `env.useBrowserCache = typeof caches !== 'undefined'` in `search-worker.ts`. La Cache API esiste solo in secure context (HTTPS o `localhost`) e `@xenova/transformers` fa `throw` secco se manca (`hub.js`, "Browser cache is not available in this environment"), quindi non va mai impostata a `true` fisso. Con la guardia, su origin insicura il modello si riscarica a ogni sessione (~23 MB da HuggingFace + ~10 MB di wasm da jsDelivr) invece di rompersi. In produzione (GitHub Pages, HTTPS) la cache funziona normalmente.
  - **Nessun fallimento silenzioso**: `search-client.ts` gestisce sia il messaggio `error` del worker sia `worker.onerror` (un modulo worker che non si carica non passa dal `try/catch` sul costruttore) tramite `segnalaErrore()`; lo stato `StatoMotore` espone `errore: string | null` e `SearchModal.astro` ha il ramo dedicato "Solo ricerca testuale" / "Text search only" con il messaggio nel `title`. Senza questi, un motore morto resta indistinguibile da un caricamento lento.
  - **Lo stato del motore si mostra solo quando devia** (deciso 2026-08-21): allo stato normale — motore semantico pronto — la barra di stato di `SearchModal.astro` non mostra nulla, solo gli hint da tastiera `↑↓ navigate / ↵ select`. L'etichetta resta nel DOM e riappare in posizione (fade 200ms, opacità 0.7) su `:hover`/`:focus-within` della barra, senza box flottante che si sovrapponga ai risultati. Resta invece **visibile e persistente** nei due casi in cui la ricerca è degradata: durante il caricamento del modello (con percentuale) e nel ramo "Solo ricerca testuale". Rimosso il pallino-indicatore: tre tonalità di grigio senza legenda non comunicavano nulla. Uno `<span class="sr-only" role="status" aria-live="polite">` continua ad annunciare lo stato agli screen reader anche quando è invisibile. Limite noto e accettato: su touch non esiste hover, quindi a motore pronto lo stato è irraggiungibile da mobile.
  - **Ricerca testuale insensibile ai diacritici**: `norm()` in `search-client.ts` applica `.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()` a query e campi indicizzati, così `facade` trova `façade`. L'**embedding riceve la query originale non normalizzata**: l'indice vettoriale è generato dal testo accentato, normalizzare anche lì degraderebbe il semantico.

## Immagini/performance

- **`astro:assets`** (Astro Image). Altri strumenti da valutare solo quando servono realmente.

## Font

- Font **self-hosted** (niente Google Fonts esterni), via pacchetti
  `@fontsource`/`@fontsource-variable` (niente download manuale di file
  font, anche quando la scelta parte da una pagina Google Fonts). Scelta
  attuale (vedi [design.md](design.md)): **Anton** (`@fontsource/anton`,
  display/titoli) + **Inter Variable** (`@fontsource-variable/inter`,
  UI/testo).
- **Preload Web Font critici**: configurati in `src/components/BaseHead.astro` con `<link rel="preload" as="font" type="font/woff2" crossorigin="anonymous">` per i file binari `.woff2` primari (`anton-latin-400-normal.woff2` e `inter-latin-wght-normal.woff2`), eliminando i flash di testo non formattato (FOUT) e garantendo il rendering immediato con font corretti fin dal primo frame sia in dev che in produzione.

## Build tooling

- **Puppeteer** (devDependency, aggiunta 2026-08-19) — usato solo a build/dev time per pregenerare gli sfondi decorativi della home (Chromium headless che esegue l'algoritmo di nesting una volta per bucket/variante, vedi [design.md](design.md)) e, dalla stessa sessione, per rasterizzare `src/assets/logo.svg` in `public/favicon.ico` (`scripts/generate-favicon.mjs`); mai spedito al client. Aggancio al ciclo di vita Astro (`astro:config:setup`, no-op se l'hash sorgente non è cambiato) sullo stesso modello già in uso per `pubblicazioni.json` (vedi `scripts/integrazione-pubblicazioni.mjs`).
- **png-to-ico** (devDependency, aggiunta 2026-08-19) — pacchetto puro JS (nessun binario nativo) per impacchettare i PNG rasterizzati da Puppeteer in `public/favicon.ico`. Usato solo da `scripts/generate-favicon.mjs`.
- **Favicon generata a build time da `logo.svg`** (2026-08-19): `scripts/generate-favicon.mjs` + `scripts/integrazione-favicon.mjs` (stesso pattern hash-manifest/no-op di `generate-patterns.mjs`) producono `public/favicon.svg` (copia 1:1 di `src/assets/logo.svg`) e `public/favicon.ico` (16/32/48px) ad ogni `astro dev`/`astro build`. `logo.svg` è quindi l'unica fonte di verità sia per il logo in nav sia per la favicon — vedi [design.md](design.md).

## Grafici

- **Bklit UI** — registry shadcn/ui specializzato in chart, **vendorizzato in `src/vendor/bklit/`** (33 item, 171 file) e non installato via `npx shadcn add`: il progetto non usa shadcn/ui, e i sorgenti devono restare modificabili e funzionanti da locale. È un fork a tutti gli effetti — gli aggiornamenti upstream non arrivano da soli, si rifanno scendere con `node scripts/scarica-bklit.mjs` (`--diff` per vedere cosa cambierebbe). Dettagli, patch all'upstream e trappole in [blocchi-articoli.md](blocchi-articoli.md).
- Dipendenze npm trascinate dal vendoring: `@visx/*` (13 pacchetti, pinnati alle **alpha** `4.0.1-alpha.0` che Bklit richiede e che il fork congela), `motion`, `d3-array/geo/sankey/scale/shape`, `@number-flow/react`, `@base-ui/react`, `react-use-measure`, `topojson-client`, `clsx`, `tailwind-merge`. Il `package.json` è passato da 13 a ~46 dipendenze.
- **Costo runtime misurato** (2026-08-21, articolo con un grafico a linea): ~54 kB gzip di React + ~50 kB di `chart-context` (visx+motion) + ~24 kB di adattatore. **Zero** sugli articoli senza grafici: il codice sta in chunk dinamici dietro `IntersectionObserver`.

## LaTeX

- **KaTeX** con `remark-math` + `rehype-katex` (aggiunti 2026-08-21): renderizza **al build**, in pagina finiscono HTML e CSS e nessun JS. Foglio di stile importato in `FieldArticleBody.astro`, non in `global.css`, così pesa solo sulle pagine articolo.

## Embed video

- **`lite-youtube-embed`** (aggiunto 2026-08-21) con **poster scaricato al build** in `public/yt/`: il sito non contatta Google finché l'utente non preme play. Senza poster locale la facciata chiamerebbe `i.ytimg.com` a ogni caricamento di pagina, prima di qualsiasi consenso.

## Deploy

- **GitHub Pages**, quando il sito sarà pronto. L'utente ha un dominio personale proprio, attualmente puntato al vecchio sito, da ricollegare in futuro. Per ora: solo sviluppo locale.

## Stato dello scaffolding

Progetto Astro inizializzato nella root del repo il 2026-08-18, con integrazioni React/Tailwind/MDX già aggiunte e build verificata. `package.json` name: `grazianoenzomarchesani-xyz`.
