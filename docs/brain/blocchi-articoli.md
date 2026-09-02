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

## Sintassi: quasi tutta quella che Markdown ha già

`remark-directive` valutato e **non** adottato: sarebbe stata una dipendenza, tre
plugin e una sintassi da ricordare. Resta un solo blocco recintato custom
(`grafico`); tutto il resto è Markdown standard.

| Blocco | Si scrive |
|---|---|
| Grafico | blocco recintato ` ```grafico ` con dentro YAML |
| Immagine | `![alt](./foto.jpg "Didascalia")` — sola nel paragrafo, il *title* diventa `<figcaption>` |
| Video | `[Titolo](https://youtu.be/ID "Didascalia")` — solo nel paragrafo, il *title* diventa `<figcaption>` come per le immagini |
| Matematica | `$…$` e `$$…$$` |
| Nota a margine | footnote Markdown `[^1]` — su desktop lo script la sposta nella colonna note; clic bidirezionale (vedi sotto) |
| Tabella | tabella Markdown standard — stile editoriale unico applicato a tutte, contenitore che scorre in orizzontale su mobile; `\|--:\|` marca le colonne di numeri (non vanno a capo) |

Nessun blocco "numeri chiave"/statistiche a margine: valutato e scartato, non
guadagna nulla rispetto al testo normale. Nel margine destro va solo la footnote.

Tutto in `src/lib/remark-articolo.ts`, a livello **remark** e non rehype: Shiki
evidenzia i blocchi recintati prima che rehype li veda e ne cancella il nome del
linguaggio. Le immagini restano nodi mdast — diventando HTML grezzo perderebbero
`astro:assets`.

### Numerazione e taglio delle figure (2026-08-27)

- **Numerazione.** Ogni figura (immagine, grafico, video) riceve in
  `remark-articolo.ts` un `data-fig="N"` progressivo nell'ordine del documento;
  l'etichetta "Fig. N" la disegna il CSS via `::before` (una sola resa per tutti
  e tre i tipi). Il render è per lingua, quindi il contatore riparte da 1 a ogni
  lingua senza travasi.
- **Quattro tagli.** `A` larghezza-testo (default) · `C` verticale (immagine ad
  altezza di lettura, didascalia a fianco) · `D` fascia (piena colonna, niente
  sconfinamento — le colonne laterali sono sticky e passarci sotto le sovrappone)
  · `B` incorniciata (`float`, il testo scorre attorno; va messa **prima** del
  testo che deve avvolgerla).
- **Stacco dell'immagine dal testo.** Le immagini raster (`figure.figura img`)
  hanno spesso lo sfondo bianco e non sono scontornabili: in `FieldArticleBody.astro`
  ricevono `border-radius: 0.5rem` e un'ombra morbida a tre strati (`color-mix` su
  `--color-ink`), niente bordo, niente cornice/padding bianco (valutato e scartato
  come ridondante). Grafici e video restano invariati.
- **Come si sceglie.** `C` e `D` sono automatici dalle proporzioni dell'`<img>`
  (`ratio < 0.8` → C, `> 1.8` → D) — lo fa `impagina-articolo.ts` lato client
  leggendo `width`/`height` di `astro:assets`. `B` e gli override si chiedono con
  un marcatore iniziale nel *title*: `![alt](fig.png "@wide Didascalia")` —
  `@inset` (B) · `@wide` (D) · `@side` (C) · `@full` (forza A). `remark-articolo.ts`
  toglie il token dalla didascalia e mette la classe `fig--*`.

### Tabelle: uno stile unico, nessuna variante (2026-08-28)

Esplorate 5 alternative grafiche in un canvas `/design` (A filetti editoriali ·
B barre di confronto · C schede a coppie · D connettori ante/post · E monumentale
tipografico). Scelta **A** come resa universale di *ogni* tabella Markdown: è
l'unica che non fa assunzioni sul contenuto (numero di colonne, testo o numeri,
con o senza intestazione). Le altre — E compresa, "molto bella" ma legata a una
struttura a due stati con una colonna protagonista — scartate: niente marcatore
opt-in per sceglierle («non facciamo eccezioni inutili»).

- **`remark-articolo.ts`** avvolge ogni nodo `table` in
  `<div class="tabella-avvolta">` (`overflow-x: auto` + `scroll-margin-top: 6rem`)
  e la numera con un contatore per lingua: `id="tabella-N"` + `data-tab="N"`. Il
  wrapper è un nodo mdast custom `tabellaAvvolta` con `data.hName: "div"`, reso
  dall'unknown-handler di `mdast-util-to-hast`.
- **Stile** (`FieldArticleBody.astro`, `.tabella-avvolta`): intestazioni in
  `--font-display` maiuscolo + filetto spesso, righe separate da hairline
  `ink/13%`, filetto spesso di chiusura, `tabular-nums`, nessuna zebratura né
  bordo esterno — stessa lingua di figure e grafici.
- **Allineamento.** Le colonne con marcatore Markdown (`|--:|`, `|:-:|`) sono le
  colonne di numeri: `text-align` coerente + `white-space: nowrap`, così i valori
  non si spezzano e se la tabella non ci sta scorre il contenitore. Senza
  marcatore le celle vanno a capo.
- Il "delta" discreto dei mockup (`−4°`, `+20`) **non** è deducibile dal
  Markdown: cade, restano i valori come scritti.

### Rail "Figure e tabelle": provini a build time + segnaposto tabelle (2026-08-27, tabelle 2026-08-28)

- **Dove.** La colonna sinistra dell'impaginato (`>1180px`) mostra un provino per
  ogni figura e un segnaposto per ogni tabella. La disegna
  **`FieldArticleLayout.astro` lato server**, non più `impagina-articolo.ts` a
  runtime.
- **Come.** `src/lib/miniature-figure.ts` legge `entry.rendered.html` (dove le
  immagini sono ancora segnaposto `__ASTRO_IMAGE_="…"`), risolve ogni `src` sulla
  mappa `astro:asset-imports` — stessa chiave che usa Astro:
  `<src>?astroContentImageFlag=&importer=<filePath>` — e genera un webp
  `320×240 fit:cover` con `getImage()`. Gli SVG passano com'è (sharp non li
  ridimensiona, sono già leggeri). Le quattro `PaginaXxxDettaglio` chiamano
  `miniatureFigure(entry)` e passano l'elenco via prop `figure`.
- **Perché.** Prima il provino riusava il **file grande** della figura e si
  caricava solo *dopo* che la figura era comparsa a schermo: su un'immagine in
  fondo all'articolo restava vuoto finché non ci scrollavi sopra. Ora i webp
  piccoli (2–12 KB) sono nell'HTML dal primo byte, `loading="eager"`.
- **Grafici e video** non hanno un file immagine: restano segnaposto
  (`.sw.ph--chart` ▦ · `.sw.ph--video` ▶) e li rifinisce `impagina-articolo.ts`,
  che ora fa solo due cose sulla rail — aggancia il clic-per-scrollare agli
  `<a data-fig>` già renderizzati, e copia l'SVG del grafico montato da React nel
  suo segnaposto (compromesso accettato: prima dell'isola resta l'icona).
- **Tabelle nella stessa rail** (2026-08-28). Il titolo del gruppo si adatta:
  `Figure e tabelle` / `Figures & tables` con entrambe, `Tabelle` / `Tables` con
  sole tabelle, `Figure` altrimenti (chiavi `fields.figureTabelle`,
  `fields.tabelle`, `fields.tabella`). Ogni tabella è un rettangolo dedicato con
  bordo **tratteggiato** e la sola etichetta `Tab N` in `--font-display` (nessun
  provino: uno screenshot a quella scala è illeggibile); `aria-label` localizzato.
  L'ancora è `#tabella-N` sul wrapper e usa lo scroll fluido già esistente della
  rail — nessun JS nuovo. `miniature-figure.ts` rilegge la sequenza dei marcatori
  `data-fig`/`data-tab` in `entry.rendered.html` e fonde provini e segnaposto
  **nell'ordine del documento**. Nessuna modifica alle 4 `PaginaXxxDettaglio`.
- **Provino del grafico: si scatta a animazione FINITA, per ogni tipo**
  (linea, area, barre — 2026-08-27). Il clone dell'SVG è gestito da
  `anteprimaGrafico()`, ma il *quando* lo decide `attendiStabile()`: un loop
  `requestAnimationFrame` che campiona il bounding box dei soli segni dei dati
  (`getBBox()` sui `rect` di `g.bar-series-*`, o sui `path`) e copia quando resta
  identico per 350 ms; ripiego dopo 12 s. È l'unico segnale affidabile perché
  `motion/react` anima in modi che il `MutationObserver` spesso non vede (vedi
  Trappola 5). Prima la guardia cercava solo un `<path>` (che le barre non
  hanno) e scattava sul primo frame: le barre restavano congelate a mezz'altezza.

### Note a margine: clic bidirezionale, niente salti di pagina (2026-08-28)

Solo desktop (`>1180px`, dove le `.footnotes` sono spostate nella colonna note).
Tutto in `src/scripts/impagina-articolo.ts`, dentro il gestore in capture phase
di `agganciaScrollLisci` (che già intercetta il ClientRouter — trappola 4), più
CSS in `FieldArticleLayout.astro`. Riusa la resa "marcatore grigiastro"
dell'evidenziazione ricerca (`--color-ink` 12–14%, animazione 2.5s, stesso
easing `cubic-bezier(0.16,1,0.3,1)`).

- **Richiamo nel corpo → nota.** Clic su `a[data-footnote-ref]`: niente più
  salto all'ancora in fondo pagina (`preventDefault`, l'URL non prende `#`); si
  scrolla la nota nella colonna a margine (`block:"nearest"`) e le si accende
  sotto il rettangolo grigio (classe `nota--evidenziata` sul `<li>`).
- **Nota → corpo.** Il `<li>` della nota è `cursor:pointer`: clic ovunque nel suo
  corpo (non sui link che contiene) scrolla il testo fino al punto del richiamo
  (`block:"center"`) ed evidenzia **la frase** che lo contiene, non solo il
  numero. `evidenziaFrase()` risale al blocco (`p`/`li`/`figcaption`/…),
  concatena i nodi di testo prima del `<sup>`, trova l'ultimo confine di frase
  (`. ! ? :` + spazio), riconverte l'offset in `(nodo, offset)` e avvolge da lì
  al numero in uno `<span class="fnref--evidenziato">` con `surroundContents`.
  Se la frase attraversa un tag inline (`surroundContents` lancia) ripiega sul
  blocco intero. Lo span è disfatto (unwrap + `normalize`) a fine animazione,
  su `prefers-reduced-motion` dopo 2.5s, e in `smonta()` prima di uno swap.
- **Trappola scoping** (costata un bug): `.field-article` arriva da
  `FieldArticleBody` via `<slot />`, quindi **non** porta l'hash di scope di
  `FieldArticleLayout`. La regola dev'essere `:global(.field-article .fnref--evidenziato)`,
  interamente globale — con `.field-article :global(...)` il selettore non fa
  match e l'evidenziazione non compare mai (lo scroll, puro JS, invece sì).
- `box-decoration-break: clone` sullo span, così il marcatore regge quando la
  frase va a capo.

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
  `xTemporale`, `serie` (con `etichetta`, `colore`, `gruppo`, `tratteggio`), `griglia`,
  `legenda`, `assi` (con `titoloX`/`titoloY`), `yMin`/`yMax`, `tooltip`, `riferimenti`,
  `titolo`, `didascalia`, `proporzione`, più `props:` come valvola di sfogo verso il
  componente Bklit. L'adattatore è la superficie API vera degli articoli: ciò che non
  espone non esiste. `src:` è nello schema ma **non è cablato** — i `dati` vanno inline.
- **Un tipo alla volta**: i quattro tipi si caricano con import dinamico separati, così
  un articolo con una sola linea non scarica anche barre, aree e dispersione.
- **`ReferenceArea` invece di una linea di riferimento**: Bklit non ha la seconda. Una
  soglia `y: 26` diventa una banda alta lo 0,5% del dominio — con `y1 == y2` l'area ha
  altezza zero e non viene disegnata.
- **Token**: i `--chart-*` di Bklit sono rimappati su `ink`/`paper` in `global.css`,
  invece di riscrivere i 171 file vendorizzati. Il tooltip di Bklit nasce scuro (è per
  dashboard dark) ed è stato ribaltato su carta: qui **non esiste una dark mode**.

## Grafici monocromi: si distinguono per forma, non per colore (2026-08-27)

Decisione: la scala `--chart-1..5` resta di grigi **per scelta**, non per limite. Le
serie non si distinguono mai col colore (niente tinte, niente palette categoriale — il
punto nel backlog è chiuso). Si distinguono così, e l'adattatore lo applica da solo:

- **linea/area:** una serie piena + una `tratteggio: "5,4"` (campo nuovo su `Serie`,
  mappa su `dashFromIndex: 0` di Bklit). Con 3+ serie: forma + toni `--chart-1/2/3`.
- **barre/dispersione:** toni della scala grigi in ordine di importanza (`--chart-1`
  la più scura).

Corollari, tutti automatici (non si scrivono a mano nell'articolo):

- **Legenda** (`config.legenda`, default on con ≥2 serie con `etichetta`): elenco di
  pastiglie sotto il grafico, generato dall'adattatore — non è il componente `Legend`
  di Bklit. Il segno riflette il tipo: lineetta piena, lineetta tratteggiata, blocchetto.
- **Tooltip**: l'adattatore passa un renderer `rows` che usa le stesse `etichetta` e
  colori della legenda. Senza, il tooltip mostrava la chiave grezza del dato (`oggi`,
  `piatta`) — un riferimento diverso da quello della legenda.
- **Testo del grafico in inglese**, senza `$$$`: `titoloX`, `titoloY`, `etichetta`,
  valori categorici dell'asse X. Va bene anche per i lettori italiani, risparmia
  caratteri e tiene i titoli su una riga. La `didascalia` resta nella lingua del corpo.
- **Titolo asse Y** (`assi.titoloY`): ruotato lungo l'asse, centrato verticalmente
  sull'area di disegno (CSS in `FieldArticleBody.astro`; il fix era `justify-content`
  invece di `align-items` in `writing-mode` verticale). **Sempre con l'unità di misura.**
- **`yMin`/`yMax`** (solo linea/area): alzano la linea di base quando i dati vivono
  lontano dallo zero. Ha richiesto un'aggiunta alla copia di Bklit — `yScaleDomainMin`
  in `line-chart.tsx` e `time-series-chart-shell.tsx`, parallelo all'esistente
  `yScaleDomainMax`: da tenere presente al prossimo rilancio di `scarica-bklit.mjs`.
- **Asse X temporale**: i valori di `x` devono essere datetime ISO veri
  (`"2025-08-03T01:00"`), non interi progressivi, o tooltip e asse mostrano "1 gennaio
  1970" (l'intero letto come millisecondi dall'epoca).

C'è una skill per fare tutto questo da un'immagine: `.claude/skills/grafico-da-immagine/`
(SKILL + `references/schema.md` con lo schema completo + `scripts/verifica-grafico.mjs`).
L'articolo `research/facade-geometry-passive-cooling` è l'esempio reale (una `linea` con
asse a date/`yMin`/tratteggio, una `barre` a gruppi in scala di grigi).

## Trappole già costate un bug

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
4. **ClientRouter intercetta i click sui link con hash**: il router di Astro registra un
   listener di click su `document` dal `<head>` (prima di ogni nostro script) e sui link
   `#slug` della stessa pagina fa uno scatto istantaneo. Per lo scroll fluido dell'indice
   (`.field-rail`/`.field-toc` → `<h2 id>`) il gestore in `impagina-articolo.ts` deve stare
   in **capture phase** con `stopPropagation()`, così intercetta prima del router. Le
   miniature figure sfuggono al router perché hanno `href="#"` (hash vuoto). Gli `<h2>`
   hanno `scroll-margin-top: 6rem` per non finire sotto la nav fissa.
5. **Le animazioni di `motion/react` non sono osservabili col `MutationObserver`**:
   Motion anima gli attributi/lo stile in modi che spesso non generano mutazioni DOM
   notificate (valori interni, a volte WAAPI compositato). Chi da vanilla JS deve
   sapere *quando* un grafico ha finito di animare non può fidarsi né di
   `childList`/`attributes` né di un debounce sulle mutazioni: va misurata la
   geometria renderizzata (`getBBox()`) frame per frame finché non si ferma. È il
   motivo per cui il provino del grafico nella rail usa un loop `rAF` e non un
   observer (vedi sezione "Rail Figure").

## LaTeX e video

- **KaTeX** (`remark-math` + `rehype-katex`) renderizza **al build**: in pagina finiscono
  HTML e CSS, zero JS a runtime. Il foglio di stile è importato in `FieldArticleBody.astro`
  e non in `global.css`, così Astro lo include solo nelle pagine articolo; i font KaTeX li
  scarica il browser solo dove c'è davvero una formula.
- **Collisione nota e accettata**: il separatore bilingue è una riga di soli `$$$` e la
  matematica display usa `$$`. Il rischio è basso (serve un `$$$` a inizio riga) ma esiste.
- **YouTube**: facciata propria (nessuna libreria) e **nessuna immagine prima del consenso**.
  L'HTML che esce da `remark-articolo.ts` è solo testo — «Click to play on YouTube» /
  «Clicca per riprodurre su YouTube» — dentro un normale collegamento a youtube.com.
  Il poster scaricato al build in `public/yt/` **è stato eliminato**: costava ~65 KB di
  repo per video anche a chi il consenso lo nega, e il repo non è il posto dove tenere
  i fotogrammi di Google. `src/scripts/video-yt.ts` mette la copertina vera da
  `i.ytimg.com` **solo col consenso dato** (`maxresdefault`, con ripiego su
  `mqdefault` per i video non HD: il segnaposto grigio 120×90 va trattato come un 404),
  e al click monta il player `youtube-nocookie`. La revoca rimette tutto com'era.
- **Sulla facciata non va nessun marchio altrui.** Il triangolo di play compare solo
  sopra la copertina, ed è il triangolo nudo in `--color-paper` con un'ombra: la pillola
  arrotondata dietro è il logo di YouTube e non è nostra. Sulla facciata testuale non c'è
  nessun simbolo, solo la frase.
- **La didascalia del video è dell'autore e di nessun altro.** Sta fuori dall'`<a>`, il JS
  non la nomina mai, ed è identica nei tre stati (rifiutato, copertina, player) e dopo una
  revoca. Non è il posto dove scrivere avvisi sul consenso: quelli stanno nel banner e
  nell'informativa, dove si dicono una volta sola. Il testo bilingue della facciata è
  scelto via `html[lang]` in CSS, perché senza JavaScript non ci sarebbe altro modo — e
  senza JavaScript quella è comunque l'unica resa. Vedi [privacy.md](privacy.md).

## Pagina di regressione

`research/prova-articolo-completo` non è un contenuto: è il banco di prova permanente,
un blocco per tipo — dal 2026-08-27 anche i quattro tagli di figura e una nota a
margine `[^1]` (asset `vista-verticale.svg` per il taglio C).
Si verifica con Puppeteer (peso JS, idratazione, resa a 375px e a 1440px).

## Backlog

`linea` e `barre` eseguiti e testati (2026-08-27); `area` e `dispersione` ancora solo
scritti · caricamento `src:` da file sidecar · lightbox sulle immagini · tabella dati
`sr-only` per gli screen reader (un `<svg>` visx non espone nulla).

Non più nel backlog: la locale dell'asse X (il testo dei grafici è in inglese per
scelta) e la palette categoriale (i grafici sono monocromi per scelta, si distingue
per forma — vedi sezione dedicata).
