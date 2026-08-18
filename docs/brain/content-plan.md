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

**Architettura di Fields decisa** (solo IA, non ancora implementata):
le quattro categorie restano riconoscibili (i quattro schemi di
contenuto sono troppo diversi per fondersi senza perdere informazione:
research ha DOI/fonte, tools ha repo/linguaggio, teaching ha
istituzione/anni, projects ha ruolo/luogo/tipo) ma navigabili da
un'unica interfaccia con filtri/facet, non da quattro pagine separate
in nav. Dettagli implementativi (route, schema content collection
unificato o meno, URL delle singole voci) non ancora decisi — sessione
dedicata da aprire quando si passa all'implementazione.

**Animazione prevista per Fields**: l'utente vuole qualcosa di
elaborato, probabilmente con una componente 3D — da discutere con
calma in una sessione dedicata. Nota: questo riapre parzialmente la
questione "cube gallery 3D / Three.js" già segnata come sospesa in
[design.md](design.md) ("troppo complessa per ora"); da riconciliare
quando si affronta il tema.

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

Da fare più avanti: importare i contenuti veri delle singole pagine
interne (articoli di ricerca, tool, attività didattiche, progetti,
pubblicazioni, competenze, bio) — oggi le pagine interne non esistono
ancora, solo la home ci punta.

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
