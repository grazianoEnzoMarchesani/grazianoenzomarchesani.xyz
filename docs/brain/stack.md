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
  - **Il punteggio lessicale pesa i termini per rarità (IDF)** (2026-08-22): `punteggio = Σ(peso_campo × log(N/df)) + coseno × 4`, con match per **prefisso di parola** e non per sottostringa. Pesi dei campi: DOI 12, autori 6, titolo 5, tag 4, categoria 3, sommario 2. Prima la formula era `coseno × 10 + lessicale` con `includes()`: cercare un coautore dava rumore semantico ai primi posti perché un cognome tokenizzato (`na ##bon ##i`) prende ~0.30 di similarità con tutto, cioè 3 punti, mentre un match letterale esatto sul sommario ne valeva 2. L'IDF separa le scale da sé — «naboni» compare in 2 documenti su 150 e vale ~4.3×, «urban» in 48 e vale ~1.1× — quindi **non serve nessuna regola di priorità del tipo "se il match è esatto portalo in cima"**, che avrebbe fatto sfarfallare i risultati alle prime lettere digitate. Il match per prefisso è ciò che evita che «art» trovi «qu-art-ieri» e «re» trovi 107 documenti su 150, preservando la ricerca mentre si digita.
  - **Stopword EN+IT obbligatorie con l'IDF** (2026-08-22): l'IDF misura la rarità nel corpus, e il corpus indicizzato è in gran parte inglese. Senza la lista, «come» e «una» risultano rarissimi quindi importantissimi, e una domanda in italiano viene ordinata dalle sue congiunzioni — misurato: la query «come raffreddare una strada calda» peggiorava rispetto alla formula vecchia. Filtrati anche i termini sotto i 2 caratteri.
  - **`autori` e `doi` sono campi indicizzati a sé** (2026-08-22): prima gli autori stavano annegati dentro `sommario` (peso 2, il più basso) e **il DOI non era indicizzato affatto**, pur essendo presente su 34 delle 67 pubblicazioni — cercare un DOI dava zero risultati o rumore. `genera-search-index.mjs` li emette solo se valorizzati (76 documenti con DOI, 134 con autori; indice da 941 a 956 KB) ed estrae il DOI anche da `fonteUrl` nel frontmatter dei Fields, così l'identificatore trova sia la pubblicazione sia l'articolo che la racconta. `estraiTermini()` toglie il prefisso `doi.org/` perché chi incolla un DOI incolla l'URL intero.
  - **Gli identificatori esatti non passano dal modello** (2026-08-22): se la query è un DOI o non contiene nessuna parola di almeno due lettere (anni, numeri), `meritaSemantica()` salta del tutto l'embedding. Misurato: «2020», «2021», «2022», «2023», «2024» e «2025» restituivano tutti *lo stesso* documento come primo risultato semantico, con punteggi indistinguibili (0.31–0.41) — il più corto dell'indice, il cui vettore è dominato da un numero. Il modello non sa cosa sia un anno, riconosce solo «stringa di quattro cifre»: 1 azzeccato su 7. Effetto collaterale gradito: su quelle query si risparmia l'inferenza.
  - **Soglie misurate, non scelte** (2026-08-22): `SOGLIA_SEMANTICA = 0.30` e `AFFINITA_CERTA = 0.55` vengono da una misura sul corpus reale — query prive di senso semantico (un cognome, un DOI, «asdfgh») non superano mai 0.32, query con un significato vero partono da 0.53. `AFFINITA_RUMORE` è aliasato a `SOGLIA_SEMANTICA` di proposito, così «nessun segno grafico» significa esattamente «il modello non ha contribuito». **Se si cambia modello vanno rimisurate**, non adattate a occhio.
  - **Limite noto, non risolto**: `all-MiniLM-L6-v2` è addestrato **solo in inglese**, e metà dell'indice è italiano. Le query concettuali in italiano funzionano per via lessicale, non semantica: «how do I cool a hot street» trova il paper giusto con affinità 0.51, la stessa domanda in italiano no. Passare a un modello multilingue triplicherebbe i ~33 MB che si chiedono all'utente dopo il consenso — decisione rimandata, non presa.
  - **`genera-search-index.mjs --force` dopo ogni modifica allo scoring**: l'hash in `.astro/search-index-manifest.json` copre `src/content/` e `src/data/`, **non** lo script. Cambiare pesi o campi senza `--force` lascia in giro l'indice vecchio.
  - **Modello e runtime autoospitati** (2026-08-22): per impostazione predefinita `@xenova/transformers` prende i pesi da `huggingface.co` e i binari `.wasm` da `cdn.jsdelivr.net`, cioè due destinatari extra-UE che riceverebbero l'IP del visitatore. `scripts/prepara-motore-ricerca.mjs` (+ `scripts/integrazione-motore-ricerca.mjs`) scarica gli stessi file al build sotto `public/motore/` — **non versionati**, `.gitignore` — e il worker imposta `localModelPath`, `wasmPaths` e `allowRemoteModels = false`. Quest'ultimo non è ridondante: garantisce che un file mancante produca un errore, e quindi la ricerca testuale, invece di un ritorno silenzioso a Hugging Face. Delle quattro varianti `.wasm` se ne copiano due: le `threaded` richiedono cross-origin isolation, impossibile da impostare su GitHub Pages.
  - **Il worker parte solo col consenso** (2026-08-22): `SearchModal.astro` chiama `inizializzaWorker()` unicamente se `consensoDato()`. L'indice `search-index.json` si carica sempre — è first-party e non richiede consenso — quindi chi rifiuta ha comunque la ricerca testuale piena. Vedi [privacy.md](privacy.md).
  - **Interfaccia**: `SearchModal.astro` (Command Palette modale globale, richiamabile con `⌘K` o icona lente in `Nav.astro`).
  - **Cache del modello legata al secure context**: `env.useBrowserCache = typeof caches !== 'undefined'` in `search-worker.ts`. La Cache API esiste solo in secure context (HTTPS o `localhost`) e `@xenova/transformers` fa `throw` secco se manca (`hub.js`, "Browser cache is not available in this environment"), quindi non va mai impostata a `true` fisso. Con la guardia, su origin insicura il modello si riscarica a ogni sessione (~33 MB, dal nostro dominio) invece di rompersi. In produzione (GitHub Pages, HTTPS) la cache funziona normalmente.
  - **Nessun fallimento silenzioso**: `search-client.ts` gestisce sia il messaggio `error` del worker sia `worker.onerror` (un modulo worker che non si carica non passa dal `try/catch` sul costruttore) tramite `segnalaErrore()`; lo stato `StatoMotore` espone `errore: string | null` e `SearchModal.astro` ha il ramo dedicato "Solo ricerca testuale" / "Text search only" con il messaggio nel `title`. Senza questi, un motore morto resta indistinguibile da un caricamento lento.
  - **Lo stato del motore si mostra solo quando devia** (deciso 2026-08-21): allo stato normale — motore semantico pronto — la barra di stato di `SearchModal.astro` non mostra nulla, solo gli hint da tastiera `↑↓ navigate / ↵ select`. L'etichetta resta nel DOM e riappare in posizione (fade 200ms, opacità 0.7) su `:hover`/`:focus-within` della barra, senza box flottante che si sovrapponga ai risultati. Resta invece **visibile e persistente** nei tre casi in cui la ricerca è degradata: in assenza di consenso (con il collegamento «Attiva la ricerca semantica» che apre il pannello delle preferenze, dal 2026-08-22), durante il caricamento del modello (con percentuale) e nel ramo "Solo ricerca testuale". Rimosso il pallino-indicatore: tre tonalità di grigio senza legenda non comunicavano nulla. Uno `<span class="sr-only" role="status" aria-live="polite">` continua ad annunciare lo stato agli screen reader anche quando è invisibile. Limite noto e accettato: su touch non esiste hover, quindi a motore pronto lo stato è irraggiungibile da mobile.
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
- **@vitejs/plugin-basic-ssl** (devDependency, aggiunta 2026-08-22) — HTTPS con certificato autofirmato sul solo dev server. Sta in `vite.plugins` con `apply: 'serve'`, che lo esclude dal build: la produzione non ne sa nulla. Esiste per una ragione sola ma decisiva — rendere `https://<IP-di-LAN>:4321` un secure context, così che Web Share, Cache API, service worker e `crypto.subtle` esistano anche durante i test da telefono. Vedi [constraints.md](constraints.md).
- **png-to-ico** (devDependency, aggiunta 2026-08-19) — pacchetto puro JS (nessun binario nativo) per impacchettare i PNG rasterizzati da Puppeteer in `public/favicon.ico`. Usato solo da `scripts/generate-favicon.mjs`.
- **Favicon generata a build time da `logo.svg`** (2026-08-19): `scripts/generate-favicon.mjs` + `scripts/integrazione-favicon.mjs` (stesso pattern hash-manifest/no-op di `generate-patterns.mjs`) producono `public/favicon.svg` (copia 1:1 di `src/assets/logo.svg`) e `public/favicon.ico` (16/32/48px) ad ogni `astro dev`/`astro build`. `logo.svg` è quindi l'unica fonte di verità sia per il logo in nav sia per la favicon — vedi [design.md](design.md).

## Grafici

- **Bklit UI** — registry shadcn/ui specializzato in chart, **vendorizzato in `src/vendor/bklit/`** (33 item, 171 file) e non installato via `npx shadcn add`: il progetto non usa shadcn/ui, e i sorgenti devono restare modificabili e funzionanti da locale. È un fork a tutti gli effetti — gli aggiornamenti upstream non arrivano da soli, si rifanno scendere con `node scripts/scarica-bklit.mjs` (`--diff` per vedere cosa cambierebbe). Dettagli, patch all'upstream e trappole in [blocchi-articoli.md](blocchi-articoli.md).
- Dipendenze npm trascinate dal vendoring: `@visx/*` (13 pacchetti, pinnati alle **alpha** `4.0.1-alpha.0` che Bklit richiede e che il fork congela), `motion`, `d3-array/geo/sankey/scale/shape`, `@number-flow/react`, `@base-ui/react`, `react-use-measure`, `topojson-client`, `clsx`, `tailwind-merge`. Il `package.json` è passato da 13 a ~46 dipendenze.
- **Costo runtime misurato** (2026-08-21, articolo con un grafico a linea): ~54 kB gzip di React + ~50 kB di `chart-context` (visx+motion) + ~24 kB di adattatore. **Zero** sugli articoli senza grafici: il codice sta in chunk dinamici dietro `IntersectionObserver`.

## LaTeX

- **KaTeX** con `remark-math` + `rehype-katex` (aggiunti 2026-08-21): renderizza **al build**, in pagina finiscono HTML e CSS e nessun JS. Foglio di stile importato in `FieldArticleBody.astro`, non in `global.css`, così pesa solo sulle pagine articolo.

## Embed video

- **Facciata propria, nessuna libreria** (2026-08-22). `lite-youtube-embed`, adottato il 2026-08-21, è stato **rimosso**: al semplice `pointerover` iniettava `<link rel="preconnect">` verso `google.com`, `googleads.g.doubleclick.net` e `static.doubleclick.net`, cioè spediva l'IP del visitatore a una rete pubblicitaria prima di qualunque click. Sostituito da markup nostro emesso da `src/lib/remark-articolo.ts` più `src/scripts/video-yt.ts` (~70 righe): meno JS della libreria e controllo completo su cosa parte e quando.
- **Poster scaricato al build** in `public/yt/` (invariato, e ora l'unica ragione per cui la facciata regge): senza, si chiamerebbe `i.ytimg.com` a ogni caricamento di pagina.
- **Senza consenso il video è un collegamento esterno**, non un player: click → youtube.com in una scheda nuova. Con il consenso il click costruisce l'`<iframe>` verso `youtube-nocookie.com`. Vedi [privacy.md](privacy.md).

## Deploy

- **GitHub Pages**, quando il sito sarà pronto. L'utente ha un dominio personale proprio, attualmente puntato al vecchio sito, da ricollegare in futuro. Per ora: solo sviluppo locale.

## Stato dello scaffolding

Progetto Astro inizializzato nella root del repo il 2026-08-18, con integrazioni React/Tailwind/MDX già aggiunte e build verificata. `package.json` name: `grazianoenzomarchesani-xyz`.
