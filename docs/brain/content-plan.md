# Piano contenuti

← [index](index.md)

## Punto di partenza

Si parte dalla **home page** (prima versione fatta, vedi
[design.md](design.md)). Il resto del sito segue dopo.

## Obiettivo di conversione

**Collaborazioni di ricerca** — criterio che guida ogni scelta di
gerarchia dei contenuti (cosa sale, cosa scende). Ereditato dal vecchio
progetto `sitoBello2`, confermato invariato per questo sito.

## Struttura delle pagine

Quattro pagine interne separate (Research, Tools, Teaching, Projects)
sono state fuse in un'unica sezione/archivio chiamata **Fields**
(IT: **Ambiti**), deciso in sessione di `/grill-me` del 2026-08-18.
Pagine interne totali oggi in nav: Fields, Publications, Skills, About.

**Perché "Fields"**: nome scelto per coprire in modo equilibrato tutte
e quattro le aree (ricerca, strumenti, didattica, progetti sono tutti
"un campo" in cui si lavora), senza sbilanciare verso una sola (es.
"Workbench" era stato scartato perché comunicava troppo "Tools" e poco
il resto). Registro voluto: "il luogo dove il lavoro succede", non un
archivio istituzionale — una parola sola, leggibile in nav senza
sottotitolo. **Ambiti** è la resa italiana scelta (non "Campi",
letterale ma piatto): registro professionale-sobrio, coerente con
l'espressione già in uso "ambiti di ricerca/lavoro". Da usare quando si
costruirà l'infrastruttura bilingue (vedi sotto).

**Architettura di Fields decisa** (schema, sessione di `/grill-me` del
2026-08-18): le quattro categorie restano riconoscibili (i quattro
schemi di contenuto sono troppo diversi per fondersi senza perdere
informazione: research ha DOI/fonte, tools ha repo/linguaggio, teaching
ha istituzione/anni, projects ha ruolo/luogo/tipo) implementate come
**quattro Astro Content Collection separate e tipizzate**
(`research`, `tools`, `teaching`, `projects`), ciascuna con lo schema
Zod specifico ereditato dal vecchio sito, più un piccolo set di campi
comuni (titolo, sommario, anno, tag) per poter listare/filtrare tutto
insieme nella vista Fields. Niente collection unica a union
discriminata. Navigabili da un'unica interfaccia con filtri/facet, non
da quattro pagine separate in nav.

**Filtri/facet: fatti** (2026-08-21). Tutte e quattro le collection hanno
`tag: string[]`, e `src/lib/tag.ts` porta su un asse unico anche le facet
implicite dei frontmatter. Da lì nascono le pagine statiche per tag
(`/fields/tag/<slug>`, `/it/fields/tag/<slug>`) e il filtro a satelliti
sulla spirale. Regole, sorgenti e motivazioni in [tag.md](tag.md).

**`research-projects` non fa parte di Fields**: è una categoria a sé
(progetti/grant finanziati — acronimo/programma/anni/ruolo/partner),
concettualmente diversa da `research` (articoli divulgativi con
fonte/tag). **Posizione decisa il 2026-08-22: sesta sezione di
`/publications`**, in fondo dopo Peer Review — vedi «Progetti di ricerca
finanziati» più sotto.

**Animazione di Fields**: decisa e implementata in prima versione,
sessione del 2026-08-18 — una spirale 3D scroll-driven (Three.js), vista
d'ingresso/esplorativa, dal 2026-08-21 anche filtrabile per tag. Dettagli
completi in [fields-spiral.md](fields-spiral.md) e [tag.md](tag.md).

## Migrazione dal vecchio sito

Fonte dei contenuti reali: il progetto precedente
`/Users/grazianoenzomarchesani/Documents/GitHub/sitoBello2` (in
particolare `src/content/` e `docs`/second brain locale in `cervello/`).
Non è "oro colato": è materiale da rivedere, non da copiare 1:1 — nomi,
struttura e alcune logiche cambiano nel nuovo sito (vedi sopra e
[design.md](design.md)).

Usato finora: identità (`about/percorso.json`) e i titoli delle 4 aree
(`content/home/0*.md`) per popolare la home v1
(`src/data/home.ts`).

**Copia raw completata** (sessione 2026-08-18): tutte le cartelle di
`sitoBello2/src/content/` copiate così come sono in
`src/content/` di questo repo (about, home, projects, publications,
research, research-projects, skills, teaching, tools — 133 file). È
uno stato intermedio, non la migrazione finale: nessuno schema di
collection ancora scritto, nessun file trasformato in contenuto reale
per le pagine interne, formato ancora `.md` col token bilingue `$$$`
grezzo.

**Regole di trasformazione decise** per il passaggio da questa copia
raw a contenuto reale nelle pagine:
- **Struttura invariata**: cartelle e file restano esattamente come
  nel vecchio sito (stessi path, stessa organizzazione per tipo —
  `research/<slug>/<slug>.mdx` annidato, `tools|teaching|projects/<slug>.mdx`
  flat), nessuna normalizzazione. Anche le chiavi del frontmatter
  restano in italiano (`titolo`, `sommario`, `anno`, `tag`, `fonte`,
  `luogo`, `ruolo`, ecc.), non tradotte in inglese, per non rompere la
  logica che l'utente già conosce. Vincolo esplicito dell'utente
  (sessione 2026-08-18): non toccare la struttura, solo il formato
  file.
- **Formato**: ogni file viene convertito da `.md` a `.mdx` nel momento
  in cui viene trasformato (non un secondo passaggio successivo).
- **Bilingue**: formato unico bilingue a token `$$$` pienamente operativo (completato sessione 2026-08-20 via `loaderBilingue()`). Nel frontmatter `campo: "EN" $$$ "IT"`, nel corpo riga isolata `$$$`. Se `$$$` manca, fallback automatico a `EN`.
- **Media**: si abbandona la pipeline custom del vecchio sito
  (`copiaMediaLocali()`, placeholder `{{media:id}}`, copia in
  `public/<collection>/<slug>/`); le immagini migrate usano
  `astro:assets` (import diretto o schema `image()` nella collection).
- **Publications**: pipeline `references.bib` → JSON e pagina `/publications` (e `/it/publications`)
  completate. Portati da `sitoBello2`: `scripts/lib/bibtex.mjs`,
  `scripts/genera-pubblicazioni.mjs`, `scripts/integrazione-pubblicazioni.mjs`
  (agganciato a `astro.config.mjs` su build/dev/watcher), `scripts/pubblicazioni.id.json`
  (per stabilità degli ID). Creati `src/lib/pubblicazioni.ts`, `src/lib/citazioni.ts`
  (5 stili: APA, MLA, Harvard, Chicago, BibTeX), `src/components/TastoCitazione.astro`,
  `src/components/PaginaPublications.astro`, `src/pages/publications.astro` e `src/pages/it/publications.astro` con 5 sezioni: Timeline per anno con filtri
  interattivi e sticky year, **Software**, Datasets & Reports, Dissemination & Outreach,
  Peer Review.
  **Software come sezione propria** (sessione 2026-08-20, decisione dell'utente): i tool
  software rilasciati su Zenodo (con DOI) *non* sono più esclusi dalla bibliografia — hanno
  un pulsante Cite proprio (`tipo="software"` in `citazioni.ts`, etichetta `[Software]`),
  perché lo scopo di `/publications` è dare la citazione dell'output, mentre `/tools` mostra
  gli stessi strumenti come prodotti da usare: sono pagine con funzioni diverse, non uno
  scarto del contenuto dell'altra. Resta escluso solo ciò che non è un output pubblicabile
  (es. la tesi di dottorato). Classificazione via `pubblicazioni.regole.json` → `tipo`
  (non più `escludi`) per i 10 record `@misc` di tipo software.
- **About**: completata. Creato `src/lib/identita.ts` (accesso tipizzato bilingue a `src/content/about/percorso.json`, 5 paragrafi bio in EN e IT, collegamenti di ricerca ORCID/IRIS/GitHub e social LinkedIn/Instagram, stato CV) e `src/components/PaginaAbout.astro` con layout editoriale a 2 colonne (ritratto via `astro:assets`, bio, tasto CV; record strutturati per Posizioni con indicatore `Current`/`In corso`, Formazione con tesi ed esito, Riconoscimenti e concorsi).
- **Skills**: completata. Creato `src/lib/competenze.ts` (accesso tipizzato a `src/content/skills/competenze.json`, 32 competenze arricchite con le relazioni di collegamento, raggruppamento per 3 famiglie e 11 categorie per il glossario, statistiche `quante` e sintesi nodo 0), `src/components/MazzoCompetenze.astro` (mazzo 3D animato GSAP in stile monocromatico paper/ink con modalità stack scroll-driven senza scroll-trapping e modalità ventaglio a raggiera ellittica con campionamento d'arco uniforme) e `src/components/PaginaSkills.astro` (struttura a 2 sezioni: hero + palco interattivo in alto, glossario editoriale strutturato in basso) montato su `src/pages/skills.astro` e `src/pages/it/skills.astro`.

**Content Collections e Bilingue**: `src/content.config.ts` configurato con `loaderBilingue()` su tutte le 4 collezioni di Fields (`research`, `tools`, `teaching`, `projects`), struttura invariata (`research/tools/projects` nested un file per cartella, `teaching` idem con cartelle speciali escluse). Tutti i 46 file `.mdx` gestiscono nativamente la doppia lingua con token `$$$`. Pagine dinamiche generate sia su `/fields/...` che su `/it/fields/...` con `perLingua()` da `src/lib/contenuti.ts`.

`research/prova-articolo-completo` è la **pagina di regressione permanente** dei
blocchi ricchi (riscritta il 2026-08-21, non più esclusa dal loader). Non è un
contenuto: contiene un blocco per tipo — grafico, immagine con didascalia, video,
LaTeX inline e display — così una regressione si vede a occhio. La versione
precedente veniva dal vecchio sito e usava i placeholder `{{media:id}}`/`{{chart:id}}`
e un registro `chart` nel frontmatter: convenzioni del vecchio sito, abbandonate.
Sintassi attuale in [blocchi-articoli.md](blocchi-articoli.md).

**Fields collegata ai dati reali** (sessione 2026-08-18): la spirale 3D
legge ora le quattro collection vere invece dei dati placeholder
generati da seed — dettagli tecnici in [fields-spiral.md](fields-spiral.md)
("Dati"). `astro check`/`astro build` puliti, JSON generato verificato
con titoli reali.

**Pagine di dettaglio di Fields implementate** (sessione 2026-08-18):
una route dinamica Astro per collection (`src/pages/fields/research/[slug].astro`,
`tools/[slug].astro`, `teaching/[slug].astro`, `projects/[slug].astro`),
`getStaticPaths()` + `getCollection()`/`render()`, `params.slug` = `entry.id`
(coerente con l'`id` già usato dai marker della spirale, `<categoria>/<slug>`
→ URL `/fields/<categoria>/<slug>`). Quattro template separati (non uno
generico a schema unione) perché i campi mostrati differiscono per
collection: research (tag, fonte/fonteUrl), tools (linguaggio/ambiente,
repo/doi/sito/licenza), teaching (istituzione/luogo/tipo/anni), projects
(luogo/ruolo/tipo/esito/url) — coerente con la decisione sopra di non
fondere gli schemi. Corpo Markdown/MDX reso con `<Content />` dentro
`FieldArticleBody.astro` (nuovo componente condiviso, stili minimi per
h2/p/a/liste, niente plugin typography). Pulsante di ritorno estratto in
`BackToFieldsButton.astro` (stessa sequenza overlay ink + `navigate('/fields')`
già usata dalla pagina di prova). `fields.astro` aggiornato:
`onOpenMarker` naviga ora a `/fields/${marker.id}` invece della route di
prova; `src/pages/fields/prova.astro` rimossa (sostituita dalle pagine
reali). Verificato con `astro check` (0 errori), `astro build` (48 pagine,
tutte le voci delle 4 collection generate correttamente) e controllo
HTTP/HTML su dev server per una voce per categoria più uno slug
inesistente (404 corretto). Non verificato in browser reale/screenshot:
nessun tool headless (`chromium-cli`/Playwright) disponibile in questa
sessione — il click sul marker della spirale che porta alla pagina reale
non è stato confermato visivamente, solo per lettura del codice.

- `research-projects` non fa parte di Fields né del feed RSS: vive solo come sesta sezione di `/publications`.

## Progetti di ricerca finanziati

Sette progetti (2018 → in corso) a cui l'utente ha partecipato **come
membro dell'unità di ricerca, non come titolare del finanziamento** —
non è strutturato in università e non può ricevere fondi direttamente.
Ereditati dal vecchio sito `sitoBello2`, dove stavano in una pagina
`/research-projects` deliberatamente fuori dalla nav.

**Perché non restano nascosti**: l'obiettivo di conversione del sito è
«collaborazioni di ricerca», e sette grant sotto Interreg / LIFE / PNRR /
Erasmus+ con partner in Croazia, Cipro, Serbia e Portogallo sono la prova
diretta di quel criterio. La correttezza dell'attribuzione si risolve nel
formato, non nell'invisibilità: il ruolo è dichiarato per esteso su ogni
voce e la sezione si apre con una riga esplicita («partecipazione come
unità di ricerca, non come titolare del finanziamento»).

**Dove** (deciso 2026-08-22, implementato): sesta sezione di
`/publications` e `/it/publications`, dopo Peer Review. Scartate: About
(quarta sezione del percorso — plausibile, ma la pagina è già lunga e
questi sono track record più che biografia) e Fields (schema
incompatibile, decisione già presa). Scartata anche una voce di nav
propria: sette voci non reggono una quinta pagina in nav e diluiscono le
altre quattro.

**Formato**: righe compatte come Peer Review, non le card del vecchio
sito (le liste sono il linguaggio del resto della pagina). Per ogni voce
acronimo + anni + pallino «in corso», titolo esteso, poi programma /
ruolo / partner in `<dl>`, più il link al sito se c'è. **Nessun pulsante
Cite, di proposito**: è l'unica sezione della pagina che non è un output
citabile. Il paragrafo descrittivo di 3-5 righe resta nei file `.md` ma
non viene mostrato.

**Watermark doppio, un blocco per progetto** (`.anno-prog`, 7 blocchi
per 7 progetti — richiesta dell'utente, 2026-08-22). Le altre sezioni
raggruppano per anno perché una pubblicazione cade in un anno solo; un
progetto invece *dura*, quindi il suo watermark è la **coppia
inizio/fine**: anno d'inizio in alto a destra, anno di fine sotto e
leggermente a sinistra, sovrapposto al primo. Ne segue che il watermark
appartiene al progetto e non a un gruppo d'anno — due progetti iniziati
lo stesso anno ma finiti in anni diversi restano blocchi separati
(CliCCHE 2022–2024 e A_GreeNET 2022–2023).

**Stessa misura per i due numeri**, più piccola del watermark singolo
delle altre sezioni visto che qui sono due. Un progetto **ancora
aperto** ne mostra uno solo, alla stessa misura degli altri.

**Il filtro per anno matcha l'INTERVALLO, non i due numeri scritti**
(2026-08-22). Un progetto è uno *stato continuo*, non un evento datato
come una pubblicazione: filtrare il 2022 vuol dire chiedere «cosa stavo
facendo nel 2022», quindi un progetto 2021–2024 deve rispondere. Ogni
blocco porta `data-da`/`data-a` (`9999` = ancora aperto, così i progetti
in corso rispondono a qualsiasi anno recente); entrambi i numeri sono
cliccabili e filtrano il proprio anno, ma il blocco si accende per
qualunque anno compreso — anche uno che non compare in nessun watermark
della sezione (filtro 2019 → CCUHRE 2018–2021).

Lo script usa un predicato unico `sopravvive()`, condiviso fra
`inUscita()` (che prevede cosa sparirà, per l'animazione) e
`applicaFiltroAnno()` (che lo esegue): puro di proposito, non guarda lo
stato del DOM. Nessun filtro a livello di riga — con un blocco per
progetto non serve.

**Come si aggiunge un progetto**: un nuovo file `.md` in
`src/content/publications/research-projects/`, bilingue col token `$$$`
come tutto il resto. Nient'altro — l'ordine si ricava dall'anno d'inizio
nel campo `anni` (`src/lib/progetti-ricerca.ts`), il prefisso numerico
nel nome file è ereditato dal vecchio sito e non conta.

**Cartella spostata sotto `publications/`** (2026-08-22, richiesta
dell'utente): prima era `src/content/research-projects/` a livello
radice, come le quattro di Fields — ma non ne fa parte e vive solo dentro
`/publications`, quindi la posizione sul filesystem ora lo riflette. Il
loader bilingue accetta un percorso qualunque relativo a `src/content/`,
quindi lo spostamento è solo `loaderBilingue("publications/research-projects")`
invece di `loaderBilingue("research-projects")` — la CHIAVE della
collection (`"research-projects"` in `collections`) resta invariata,
così tutte le `getCollection("research-projects")` nel codice non
cambiano. Verificato che il content layer non si confonda con gli altri
file non-`.md` già dentro `publications/` (`.bib`, i tre `.json`): il
loader legge solo `.md`/`.mdx` nella sua sottocartella.

Codice: collection `research-projects` in `src/content.config.ts`
(loader bilingue, file `.md` flat), `src/lib/progetti-ricerca.ts`
(`progettiRicerca()`: lista piatta ordinata e parsing dell'intervallo),
sezione + patch al filtro in
`src/components/PaginaPublications.astro`.

## Attività di Peer Review

Stessa logica di Research Projects, applicata su richiesta dell'utente
(2026-08-22): prima le 4 voci di peer review vivevano come unica chiave
manuale (`revisioni`) dentro `pubblicazioni.manuale.json`, in mezzo a
decine di voci di bibliografia generate dal `.bib` — l'unico contenuto
scritto a mano lì in mezzo. Spostate in collection `peer-review`
(`src/content.config.ts`, loader bilingue), un file `.md` per voce in
`src/content/peer-review/NN-slug.md` (frontmatter `anno`, `rivista`,
`editore` — niente da tradurre, ma il loader bilingue si usa comunque
per uniformità col resto). `pubblicazioni.manuale.json` resta solo per
`profili` e le note (`_nota*`); la chiave `revisioni` è stata rimossa.

**Come si aggiunge una revisione**: un nuovo file `.md` in
`src/content/publications/peer-review/` (spostata sotto `publications/`
insieme a `research-projects`, stesso giorno e stesso motivo — vedi
sopra). Il prefisso numerico nel nome file non conta, l'ordine è per
`anno` decrescente.

Codice: collection `peer-review` in `src/content.config.ts`,
`revisioni()`/`revisioniPerAnno()` in `src/lib/pubblicazioni.ts` (ora
async, leggono la collection invece del JSON manuale), invariata la
sezione in `src/components/PaginaPublications.astro` a parte l'`await`.

## Feed RSS

Implementato un **feed RSS aggregato unico** per tutti i contenuti di Fields (`@astrojs/rss`), deciso in sessione `/grill-me` + `/ponytail` del 2026-08-20:
- **Endpoint**: `/rss.xml` (radice standard) e alias `/fields/rss.xml`.
- **Contenuto**: aggrega tutte e quattro le collezioni (`research`, `tools`, `teaching`, `projects`), ordinate per data decrescente (46 voci), con titoli, descrizioni sintetiche (`sommario`), link canonici assoluti e tag/categorie.
- **Scoperta & UI**: tag `<link rel="alternate" type="application/rss+xml" ...>` presente nell'`<head>` di tutte le pagine; icona/link RSS discreta nel componente `Footer.astro` attiva esclusivamente a partire da `/fields` e in tutte le sue pagine collegate (schede articolo). Foglio di stile XSLT `public/rss.xsl` collegato al feed per renderizzare una pagina HTML elegante e chiara nei browser privi di lettore RSS nativo (Safari, Chrome, Firefox).

## Lingua

Sito bilingue, **inglese di default** (`/`), italiano su `/it/` —
obiettivo e architettura completati (sessione `/grill-me` + `/ponytail` del 2026-08-20):
- **File sorgente unico con token `$$$`**: un unico file `.mdx` per contenuto; nel frontmatter `campo: "en" $$$ "it"` e nel corpo una riga isolata `$$$` separa l'inglese sopra dall'italiano sotto. In assenza di `$$$`, fallback automatico all'inglese.
- **Loader custom**: `src/lib/loader-bilingue.ts` genera per ogni file due voci nello store di Astro (`en/<slug>` e `it/<slug>`).
- **Routing & i18n**: `astro.config.mjs` con `defaultLocale: 'en'`, `locales: ['en', 'it']`, `prefixDefaultLocale: false` e `fallbackType: 'rewrite'`. Pagine `pages/` (EN) e `pages/it/` (IT) che condividono componenti DRY (`PaginaHome`, `PaginaFields`, `PaginaPublications`, `PaginaSkills`, `PaginaAbout`, `Pagina*Dettaglio`).
- **Testi UI e Selettore**: dizionario tipizzato `src/i18n/testi.ts` con funzione `t()` e selettore lingua `EN | IT` nella barra di navigazione fissa (`Nav.astro`).

## Tipi di contenuto previsti nelle pagine/articoli (da [stack.md](stack.md))

- Testo.
- Immagini già presenti nel sito (via `astro:assets`).
- Embed esterni, es. video YouTube.
- Codice LaTeX.
- Grafici interattivi (Bklit UI).

Tutti e quattro **realizzati il 2026-08-21** — sintassi, pipeline e limiti in
[blocchi-articoli.md](blocchi-articoli.md).
