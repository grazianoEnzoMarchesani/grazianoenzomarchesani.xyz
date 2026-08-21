# Blocchi ricchi negli articoli di Fields

← [index](index.md)

Immagini con didascalia, video YouTube, LaTeX e grafici dentro il corpo degli
articoli delle quattro collection. Deciso e costruito il 2026-08-21.

## Il vincolo che governa tutto

Gli articoli **non sono MDX**, nonostante l'estensione. `loaderBilingue()` chiama
`renderMarkdown()`, che è il renderer **Markdown** di Astro: nessun componente JSX
nel corpo verrebbe mai eseguito. `@astrojs/mdx` serve alle pagine, non alle collection.

Riscrivere il loader su MDX vero significherebbe perdere `renderMarkdown` (heading,
`imagePaths`, `assetImports` — l'ottimizzazione immagini che oggi funziona gratis) e
reimplementare lo split `$$$` contro un compilatore JSX. Scartato.

## Sintassi: nessuna sintassi nuova

Si usa quella che Markdown ha già. `remark-directive` valutato e **non** adottato:
sarebbe stata una dipendenza, tre plugin e una sintassi da ricordare in più.

| Blocco | Si scrive |
|---|---|
| Grafico | blocco recintato ` ```grafico ` con dentro YAML |
| Immagine | `![alt](./foto.jpg "Didascalia")` — sola nel paragrafo, il *title* diventa `<figcaption>` |
| Video | `[Titolo](https://youtu.be/ID)` — solo nel paragrafo |
| Matematica | `$…$` e `$$…$$` |

Tutto in `src/lib/remark-articolo.ts`, a livello **remark** e non rehype: Shiki
evidenzia i blocchi recintati prima che rehype li veda e ne cancella il nome del
linguaggio. Le immagini restano nodi mdast — diventando HTML grezzo perderebbero
`astro:assets`.

## Grafici: Bklit vendorizzato, isole montate a mano

- **Fork, non dipendenza.** `node scripts/scarica-bklit.mjs` scarica il registry in
  `src/vendor/bklit/` (33 item, 171 file) tenendo la struttura `target` di shadcn e
  **senza riscrivere gli import**: due alias in `tsconfig.json` li risolvono, così i
  file restano identici all'upstream e `git diff` dopo un rilancio dice la verità.
  Esclusi gli item `example` e i blocchi `stat-card-*` (trascinerebbero `card`/`badge`
  di shadcn e l'intero `@central-icons-react`).
- **Due bug dell'upstream**, corretti da una lista `CORREZIONI` nello script che
  avvisa quando una correzione non serve più: `chart-loading-label.tsx` importa
  `../components/shimmering-text`, che nel layout shadcn è `../shimmering-text`;
  `profit-loss-line` importa un file che il registry non spedisce affatto ed è
  quindi escluso.
- **Il ponte direttiva → isola.** Una direttiva produce una stringa HTML, non un
  componente: `client:visible` è inutilizzabile. `remark-articolo.ts` emette un
  segnaposto `[data-grafico]` con uno skeleton, e `src/scripts/monta-grafici.ts`
  monta le radici React via `IntersectionObserver`.
- **Schema YAML esteso** (`src/components/charts/tipi.ts`): `tipo`, `dati`/`src`, `x`,
  `serie`, `griglia`, `assi`, `tooltip`, `riferimenti`, `titolo`, `didascalia`,
  `proporzione`, più `props:` come valvola di sfogo verso il componente Bklit.
  L'adattatore è la superficie API vera degli articoli: ciò che non espone non esiste.
- **Un tipo alla volta**: i quattro tipi si caricano con import dinamico separati, così
  un articolo con una sola linea non scarica anche barre, aree e dispersione.
- **`ReferenceArea` invece di una linea di riferimento**: Bklit non ha la seconda. Una
  soglia `y: 26` diventa una banda alta lo 0,5% del dominio — con `y1 == y2` l'area ha
  altezza zero e non viene disegnata.
- **Token**: i `--chart-*` di Bklit sono rimappati su `ink`/`paper` in `global.css`,
  invece di riscrivere i 171 file vendorizzati. Il tooltip di Bklit nasce scuro (è per
  dashboard dark) ed è stato ribaltato su carta: qui **non esiste una dark mode**.
  La scala `--chart-1..5` resta monocroma: va bene per una serie, **non distingue due
  serie**. Palette categoriale nel backlog.

## Tre trappole già costate un bug

1. **ClientRouter**: con le view transitions il DOM viene scambiato ma i moduli
   `<script>` non vengono rieseguiti. Il montaggio va agganciato a `astro:page-load`,
   altrimenti arrivando da un link interno il segnaposto resta vuoto per sempre.
2. **Cache del content layer**: il digest guardava solo il contenuto dell'articolo, così
   una modifica alla pipeline markdown non invalidava nulla e il dev server serviva HTML
   vecchio (sintomo: il plugin nuovo "non funziona"). Ora `loaderBilingue()` mette nel
   digest anche lo stato di `remark-articolo.ts` e `astro.config.mjs`.
3. **React Fast Refresh in dev**: `@astrojs/react` inietta il preambolo solo nelle pagine
   con un'isola `client:` dichiarata. Montando a mano non arriva mai e react-dom muore con
   `$RefreshSig$ is not defined` — **solo in dev**, la build funzionava. Il preambolo se lo
   inietta `monta-grafici.ts`.

## LaTeX e video

- **KaTeX** (`remark-math` + `rehype-katex`) renderizza **al build**: in pagina finiscono
  HTML e CSS, zero JS a runtime. Il foglio di stile è importato in `FieldArticleBody.astro`
  e non in `global.css`, così Astro lo include solo nelle pagine articolo; i font KaTeX li
  scarica il browser solo dove c'è davvero una formula.
- **Collisione nota e accettata**: il separatore bilingue è una riga di soli `$$$` e la
  matematica display usa `$$`. Il rischio è basso (serve un `$$$` a inizio riga) ma esiste.
- **YouTube**: `lite-youtube-embed` con **poster scaricato al build** in `public/yt/`.
  Senza poster locale la facciata contatterebbe comunque `i.ytimg.com` al caricamento
  della pagina, cioè prima di qualsiasi consenso — esattamente ciò che deve evitare.
  Verificato con Puppeteer: zero host esterni finché non si preme play.

## Pagina di regressione

`research/prova-articolo-completo` non è un contenuto: è il banco di prova permanente,
un blocco per tipo. Si verifica con Puppeteer (peso JS, idratazione, resa a 375px).

## Backlog

Locale dell'asse X (scrive "Aug 14" anche in italiano) · `area`/`barre`/`dispersione`
scritti ma mai eseguiti · caricamento `src:` da file sidecar · lightbox sulle immagini ·
palette categoriale · tabella dati `sr-only` per gli screen reader (un `<svg>` visx non
espone nulla) · banner di consenso.
