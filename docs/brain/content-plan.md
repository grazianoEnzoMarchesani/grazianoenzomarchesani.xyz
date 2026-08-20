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
da quattro pagine separate in nav. Dettagli ancora aperti: route
esatte, URL delle singole voci — sessione dedicata quando si arriva a
quel punto dell'implementazione.

**`research-projects` non fa parte di Fields**: è una categoria a sé
(progetti/grant finanziati — acronimo/programma/anni/ruolo/partner),
concettualmente diversa da `research` (articoli divulgativi con
fonte/tag). Il contenuto resta copiato in `src/content/` ma non
collegato a nessuna pagina; dove posizionarlo (dentro About, sezione
propria, altro) è da decidere in una sessione dedicata.

**Animazione di Fields**: decisa e implementata in prima versione,
sessione del 2026-08-18 — una spirale 3D scroll-driven (Three.js), vista
d'ingresso/esplorativa non filtrabile ancora. Dettagli completi in
[fields-spiral.md](fields-spiral.md).

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
- **Bilingue**: per ogni file si estrae solo la metà EN del token
  `$$$` come contenuto attuale; la metà IT si tiene annotata da parte
  per quando si costruirà l'infrastruttura bilingue (vedi sotto). Non
  si porta il loader custom `bilingue()` del vecchio sito.
- **Media**: si abbandona la pipeline custom del vecchio sito
  (`copiaMediaLocali()`, placeholder `{{media:id}}`, copia in
  `public/<collection>/<slug>/`); le immagini migrate usano
  `astro:assets` (import diretto o schema `image()` nella collection).
- **Publications**: pipeline `references.bib` → JSON e pagina `/publications`
  completate (sessione 2026-08-18). Portati da `sitoBello2`: `scripts/lib/bibtex.mjs`,
  `scripts/genera-pubblicazioni.mjs`, `scripts/integrazione-pubblicazioni.mjs`
  (agganciato a `astro.config.mjs` su build/dev/watcher), `scripts/pubblicazioni.id.json`
  (per stabilità degli ID). Creati `src/lib/pubblicazioni.ts`, `src/lib/citazioni.ts`
  (5 stili: APA, MLA, Harvard, Chicago, BibTeX), `src/components/TastoCitazione.astro`
  e `src/pages/publications.astro` con 5 sezioni, in ordine: Timeline per anno con filtri
  interattivi e sticky year, **Software**, Datasets & Reports, Dissemination & Outreach,
  Peer Review. Testi direttamente in inglese (infrastruttura bilingue rimandata come da piano).
  **Software come sezione propria** (sessione 2026-08-20, decisione dell'utente): i tool
  software rilasciati su Zenodo (con DOI) *non* sono più esclusi dalla bibliografia — hanno
  un pulsante Cite proprio (`tipo="software"` in `citazioni.ts`, etichetta `[Software]`),
  perché lo scopo di `/publications` è dare la citazione dell'output, mentre `/tools` mostra
  gli stessi strumenti come prodotti da usare: sono pagine con funzioni diverse, non uno
  scarto del contenuto dell'altra. Resta escluso solo ciò che non è un output pubblicabile
  (es. la tesi di dottorato). Classificazione via `pubblicazioni.regole.json` → `tipo`
  (non più `escludi`) per i 10 record `@misc` di tipo software.
- **About**: completata (sessione 2026-08-19). Creato `src/lib/identita.ts` (accesso tipizzato a `src/content/about/percorso.json`, 5 paragrafi bio in inglese, collegamenti di ricerca ORCID/IRIS/GitHub e social LinkedIn/Instagram, stato CV) e `src/pages/about.astro` con layout editoriale a 2 colonne (ritratto via `astro:assets`, bio, tasto CV; record strutturati per Posizioni con indicatore `Current`, Formazione con tesi ed esito, Riconoscimenti e concorsi).
- **Skills**: completata (sessione 2026-08-19). Creato `src/lib/competenze.ts` (accesso tipizzato a `src/content/skills/competenze.json`, 32 competenze arricchite con le relazioni di collegamento, raggruppamento per 3 famiglie e 11 categorie per il glossario, statistiche `quante` e sintesi nodo 0), `src/components/MazzoCompetenze.astro` (mazzo 3D animato GSAP in stile monocromatico paper/ink con modalità stack scroll-driven senza scroll-trapping e modalità ventaglio a raggiera ellittica con campionamento d'arco uniforme) e `src/pages/skills.astro` (struttura a 2 sezioni: hero + palco interattivo in alto, glossario editoriale strutturato in basso).

**Fatto** (sessione 2026-08-18): `src/content.config.ts` scritto con le
quattro collection di Fields (`glob` loader nativo, non `bilingue()`),
struttura invariata (`research/tools/projects` nested un file per
cartella, `teaching` idem con `teaching-assistance`/
`thesis-co-supervision` esplicitamente esclusi dal pattern perché non
fanno parte dello schema principale). Convertito un primo file reale
per tipo da `.md` a `.mdx` secondo le regole sopra (`research/local-climate-zones`,
`tools/spotmapper`, `teaching/relive-2025-madrid`,
`projects/01-echo-madrid`). Verificato con `astro check` (0 errori) e
`astro build` (ok).

**Conversione completata** (sessione 2026-08-18): tutti i restanti file
`.md` di research/tools/teaching/projects convertiti a `.mdx` con lo
stesso pattern (script Node che replica `spaccaFrontmatter`/`spaccaCorpo`
del vecchio `loader-bilingue.ts` — righe di frontmatter bilingue divise
su `$$$`, EN tenuto come valore reale, IT annotato in un commento MDX in
coda solo per i campi/il corpo che avevano davvero `$$$`). 46 file
`.mdx` totali nelle 4 collection. `astro check` (0 errori) e
`astro build` confermano che tutti rispettano lo schema Zod.

Escluso di proposito: `research/prova-articolo-completo` — nel vecchio
sito era esplicitamente un articolo usa-e-getta di test ("safe to
delete once checked") per verificare insieme media/chart/LaTeX, usa
`chart` e i placeholder `{{media:id}}`/`{{chart:id}}` che lo schema
attuale non supporta (grafici Bklit e pipeline media custom entrambi
rimandati). Lasciato `.md`: il pattern `*/*.mdx` della collection lo
esclude automaticamente, nessuna azione necessaria salvo deciderne la
sorte in futuro (cancellare, o riscrivere come vero articolo quando i
chart interattivi saranno pronti).

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

## Lingua

Sito bilingue, **inglese di default** (`/`), italiano su `/it/` —
obiettivo confermato, stessa logica del vecchio sito. Riusiamo lo stesso
meccanismo custom validato in `sitoBello2` (token `$$$` dentro un unico
file per contenuto, invece di cartelle `en/`/`it/` separate).

**Non ancora costruito**: si è deciso di fissare prima il layout in una
sola lingua (inglese, quella oggi nel codice) e aggiungere
l'infrastruttura bilingue in un passaggio successivo, per non rallentare
l'iterazione sul design.

## Tipi di contenuto previsti nelle pagine/articoli (da [stack.md](stack.md))

- Testo.
- Immagini già presenti nel sito (via `astro:assets`).
- Embed esterni, es. video YouTube.
- Codice LaTeX.
- Grafici interattivi (Bklit UI).
