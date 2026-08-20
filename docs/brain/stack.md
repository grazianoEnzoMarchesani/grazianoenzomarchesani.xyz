# Stack tecnico

← [index](index.md)

Vedi [constraints.md](constraints.md) per i vincoli che hanno guidato queste scelte.

## Core

- **Astro** — framework principale, output statico. Gestisce le pagine e gli articoli come contenuti tipizzati.
- **TypeScript**. Type-checking via `@astrojs/check` (devDependency, aggiunta 2026-08-18) — `npx astro check`.
- **MDX** per i contenuti — serve perché nelle pagine devono poter comparire componenti veri (grafici, embed video, immagini ottimizzate), non solo sintassi Markdown.

## UI framework

- **React**, adottato senza vincoli ideologici: se in futuro conviene altro, si cambia senza problemi. Necessario comunque per i grafici (vedi Bklit UI sotto, basato su shadcn/ui = React + Radix + Tailwind).

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

## Ricerca Semantica Vettoriale Client-Side

- **`@xenova/transformers` + ONNX Runtime WebAssembly** (aggiunto 2026-08-20):
  - **Build-Time**: `scripts/genera-search-index.mjs` + `scripts/integrazione-ricerca.mjs` generano `public/search-index.json` con metadati e vettori di embedding (384 float normalizzati, `all-MiniLM-L6-v2`) per Research, Tools, Teaching, Projects, Pubblicazioni e Competenze in italiano e inglese.
  - **In-Browser Runtime**: `src/scripts/search-worker.ts` e `src/scripts/search-client.ts` gestiscono la ricerca ibrida (matching testuale immediato in-memory unito al calcolo vettoriale della query in Web Worker per il calcolo della similarità coseno).
  - **Interfaccia**: `SearchModal.astro` (Command Palette modale globale, richiamabile con `⌘K` o icona lente in `Nav.astro`).

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

- **Bklit UI** — registry shadcn/ui specializzato in chart. Installazione via CLI: `npx shadcn@latest add @bklit/<nome-componente>`. Richiede React (vedi sopra).

## Deploy

- **GitHub Pages**, quando il sito sarà pronto. L'utente ha un dominio personale proprio, attualmente puntato al vecchio sito, da ricollegare in futuro. Per ora: solo sviluppo locale.

## Stato dello scaffolding

Progetto Astro inizializzato nella root del repo il 2026-08-18, con integrazioni React/Tailwind/MDX già aggiunte e build verificata. `package.json` name: `grazianoenzomarchesani-xyz`.
