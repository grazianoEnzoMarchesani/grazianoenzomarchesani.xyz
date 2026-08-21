# I tag di Fields — tassonomia, filtro, regole di scrittura

← [index](index.md)

## Stato

Deciso e implementato nella sessione del 2026-08-21 (seconda della
giornata), in due pezzi consecutivi: prima il layer di normalizzazione +
le pagine statiche per tag, poi il filtro interattivo sulla spirale.
Chiude il punto lasciato aperto in [content-plan.md](content-plan.md)
("navigabili da un'unica interfaccia con filtri/facet") e in
[fields-spiral.md](fields-spiral.md).

## Il problema di partenza

Le quattro collection descrivono i contenuti con campi diversi. Solo
`research` aveva `tag:`, e su 47 voci quei tag erano 21 stringhe tutte
con frequenza 1: un filtro su di essi avrebbe prodotto classi da un
elemento solo. Serviva un asse unico, non un campo in più.

## Le tre regole della tassonomia

Scritte in testa a `src/lib/tag.ts`, sono decisioni non dettagli:

1. **Lo slug è sempre inglese.** Le etichette sono bilingui ma lo slug si
   calcola dalla versione EN del contenuto, così `/fields/tag/qgis` e
   `/it/fields/tag/qgis` sono la stessa pagina in due lingue: il
   selettore di lingua continua a funzionare e la SEO non si sparpaglia
   su due set di URL.
2. **Niente tag da una voce sola** (`MIN_VOCI_PER_TAG = 2`). Un tag che
   filtra a un elemento è un link all'articolo travestito da facet: non
   genera pagina, non diventa link, non compare come satellite.
3. **Niente facet di servizio.** `teaching.lingua` (non è un tema) e
   `projects.ruolo` (testo libero, un tag per voce) sono esclusi
   deliberatamente dalle sorgenti.

## Sorgenti dei tag

Tutte e quattro le collection hanno il campo `tag: string[]` nello
schema Zod. Oltre a quello, `src/lib/tag.ts` deriva tag dalle facet già
presenti nei frontmatter:

| collection | sorgenti oltre a `tag` |
| --- | --- |
| research | — |
| tools | `ambiente[]`, `linguaggio` |
| teaching | `tipo`, `luogo`, `istituzione` |
| projects | `tipo`, `luogo` |

Gli enum italiani (`corso`, `lecture`, `ricerca`…) hanno etichette
bilingui in `ETICHETTE_ENUM`: la pagina IT dice "Lezione", la EN
"Lecture", **stesso URL**.

`ALIAS` fonde le sorgenti che dicono la stessa cosa con parole diverse,
`ETICHETTE_CANONICHE` decide come si chiama il gruppo risultante (senza,
il nome sarebbe quello della prima voce incontrata, cioè un caso).
Fusione già registrata: le cinque scritture dell'affiliazione UNICAM
(`Università di Camerino`, `— SAAD`, `SAAD UNICAM — Master di II
livello`, `Cluster Clima —`, `/ Università di Firenze`) diventano un
unico tag da 9 voci. **Se `ALIAS` cresce, il problema è nei frontmatter,
non nel codice.**

## Le pagine statiche per tag

`/fields/tag/<slug>` e `/it/fields/tag/<slug>`
(`src/components/PaginaTag.astro`), generate da `getStaticPaths()`.

**Perché una route e non una query string**: il sito è statico su GitHub
Pages, una query string non genera una pagina. Google vedrebbe lo stesso
HTML per tutti i valori — nessun contenuto nuovo, nessun ranking. La
route ha invece HTML reale (h1, elenco delle voci con sommario, link),
più un blocco "Spesso insieme a" con i tag co-occorrenti e una coda
"Tutti i tag" per il linking interno.

Le **combinazioni** multi-tag restano in query string (`?tag=a,b`) sulla
spirale, con `canonical` alla route singola: navigabili e condivisibili
ma senza generare centinaia di pagine di contenuto sottile.

`BaseHead.astro` ha ora `canonical` e `alternate` (hreflang en/it/
x-default), con normalizzazione della barra finale: canonical e hreflang
devono puntare allo stesso identico URL.

## Il filtro sulla spirale

`src/scripts/fields-tag.ts` + il markup in `PaginaFields.astro`.

- **Il controllo**: unico permanente sulla scena, una pillola **centrata
  in basso**, appena sopra la barra del footer. Porta l'etichetta `TAG`
  visibile — da solo, il pallino era muto: nessuno capiva cosa fosse
  finché non lo cliccava. Il pallino resta accanto come indicatore di
  stato (contorno = spento, pieno = acceso) e con un filtro attivo
  compare il numero di voci rimaste. `aria-pressed`, `Esc` chiude.
  Stava in basso a destra e collideva con il pulsante Contact: al centro
  è equidistante da RSS e Contact e non tocca niente nemmeno su
  telefono, dove la fascia bassa è l'unica zona sempre libera.
- **La fascia bassa è riservata**: i satelliti sulla spirale hanno un
  margine inferiore proprio (`MARGINE_BASSO`, più alto degli altri tre
  lati). Senza, un satellite può atterrare sopra il controllo che lo ha
  fatto comparire, o sopra RSS/Contact.
- **I satelliti**: `<button>` DOM disposti ad arco attorno alla sagoma in
  focus, mai sovrapposti a **nessun** titolo visibile — non solo a quello
  della voce in focus ma anche a quelli dei marker vicini (la spirale
  passa tutti gli ingombri in `FieldFocus.ingombri`). Il lato si sceglie:
  si preferisce quello che guarda fuori dallo schermo (il vuoto) invece
  del cuore fitto della spirale; se lì c'è un titolo il raggio cresce a
  scatti finché non lo scavalca, e se scavalcarlo porterebbe i satelliti
  oltre il bordo si passa dall'altra parte.
- **AND progressivo**: i satelliti mostrano solo i tag della voce in
  focus, che per costruzione è già sopravvissuta ai tag attivi. Ogni tag
  proposto porta quindi ad almeno un risultato — non esiste un satellite
  che porta nel vuoto, e non serve calcolare conteggi né disabilitare
  opzioni.
- **Lo stato vive nell'URL** (`?tag=a,b`), non in una variabile:
  `pushState` a ogni tag aggiunto, così il tasto indietro del browser
  toglie l'ultimo tag. `popstate` risincronizza. La riga di pillole in
  alto è il luogo persistente dello stato: senza, dopo due click non si
  sa più cosa si sta guardando.
- **Ricostruzione**: gli anni rimasti senza voci **spariscono**, le spire
  restanti si ricompattano, le etichette d'anno restano (il salto
  `2026 → 2024` è informazione, non errore).
- **Un solo risultato non è una spirale**: si va dritti all'articolo, e i
  tag vengono tolti dall'URL con `replaceState` **prima** di navigare.
  Così il ritorno col tasto indietro riapre Fields nella sua forma di
  sempre — e non rientra nella vista da un risultato rilanciando la
  navigazione all'infinito.

**Come è fatta la ricostruzione, e perché**: distruzione e re-init della
spirale con dissolvenza (0.2s fuori, rebuild, 0.35s dentro con la sua
intro), non un collasso animato delle spire. La geometria nasce da un
calcolo fatto una volta all'init: renderla incrementale per un'azione
rara sarebbe stato molto codice per mezzo secondo di resa. Se il salto
risulterà brusco all'uso, il collasso si aggiunge dopo senza rifare
nulla.

## La grafica dei tag: riempimento, mai contorno

Tutte le pillole di tag — satelliti sulla spirale, tag attivi, controllo
`TAG`, tag sotto gli articoli, correlati nella pagina di tag — passano
dalla stessa classe `.pillola-tag` in `global.css`. **Niente bordo**: la
forma nasce solo dal riempimento, un ink al 7% mescolato alla carta (13%
in hover).

Il fondo è **opaco**, non translucido, per due motivi che si tengono
insieme: deve staccarsi da una pagina dello stesso colore (togliere il
bordo da una pillola trasparente la fa sparire) e sulla spirale deve
coprire i marker che le passano sotto — con un `bg-paper/80` la spira si
vedeva attraverso il satellite.

## Le pagine di tag hanno il peso di Publications

L'elenco delle voci in `/fields/tag/<slug>` usa la voce d'elenco di
`PaginaPublications`, non il titolo d'articolo: **sans a peso normale**
(`text-lg`/`sm:text-xl`), niente `font-display`, riga di categoria e anno
in `font-mono` chiaro, sommario in `text-ink/75`, separatori `divide-y`,
hover che sottolinea il solo titolo. Il display resta al solo `h1`, cioè
al nome del tag. Venti titoli in display uno sotto l'altro trasformano
una lista da scorrere in venti titoli che gridano.

Il metadato è mono, il contenuto è sans: è questa distinzione, non la
dimensione, a rendere leggera la pagina.

## In "Spesso insieme a" non c'è nessun numero

I tag correlati sono ordinati per **voci in comune** con il tag della
pagina, ma quel numero non si scrive. Scritto accanto a un tag si legge
inevitabilmente come "quante voci ha questo tag" — che è un'altra
grandezza (`Tag.conteggio`), per giunta dichiarata in testa alla stessa
pagina. Su `/fields/tag/master` compariva `Milano 1` mentre Milano ha 2
voci, e `Ascoli Piceno 2` mentre ne ha 10: aritmetica giusta, etichetta
che mente.

L'intersezione vive in un campo separato dentro il componente, decide
l'ordine e non esce mai. **`Tag.conteggio` significa una cosa sola in
tutto il codice**: il totale del tag.

## Il giro completo

articolo → tag cliccato (`ElencoTag.astro`) → pagina statica del tag →
"See in Fields" / "Guarda in Ambiti" → vista filtrata. Il link **non
nomina la spirale**: su telefono quella vista è una corda, e la chiave
i18n è `tag.vediInFields` — un nome che prometta una forma sola è la
prossima incoerenza. La pagina statica è la
destinazione indicizzabile e senza JS, la spirale quella esplorativa.

In `ElencoTag.astro` i tag pubblici sono link; le etichette di
frontmatter che non filtrano nulla restano **pillole mute**: portare a
una pagina da un elemento solo significherebbe promettere un filtro che
non filtra.

## Regole per scrivere i tag

Si scrivono **solo nel frontmatter dei file `.mdx`**, niente JSON né
altri registri. Due forme:

```yaml
tag: ["Urban climate", "Thermography"]        # uguale in EN e IT
tag:
  - "Urban climate" $$$ "Clima urbano"        # bilingue, uno per riga
  - "Thermography" $$$ "Termografia"
```

Il `$$$` inline vale per riga: in un array su una riga sola spaccherebbe
tutta la riga, quindi le traduzioni per elemento vogliono la lista
multi-riga.

1. **Mai un tag da una voce sola.** Se non riesci a nominare almeno due
   contenuti che lo porterebbero, non è un tag: è il titolo di quel
   contenuto. Scrivilo solo quando arriva il secondo.
2. **3–5 tag per voce.** Sono i satelliti attorno al marker: sopra i
   cinque l'arco si affolla e il raggio comincia a spingerli verso i
   bordi dello schermo.
3. **Corti.** Una o due parole, al massimo tre. Il satellite è una
   pillola su una riga sola: "Mean radiant temperature" occupa mezzo
   arco.
4. **Sostantivi, non frasi.** `Urban climate`, non `How urban climate
   works`.
5. **Un tag risponde a "di cosa parla" o "con cosa è fatto"**, non a
   "com'è andata". Temi (`Urban climate`), strumenti (`QGIS`,
   `ENVI-met`), luoghi (`Ascoli Piceno`). Mai giudizi o stati.
6. **Riusa quelli che esistono già** prima di inventarne uno. La lista
   viva è in fondo a ogni pagina di tag ("Tutti i tag").
7. **Una grafia sola per una cosa sola.** `ENVI-met` o `envimet`, non
   entrambi. Se scopri un doppione già sparso nei file, la correzione
   giusta è **sistemare i frontmatter**; `ALIAS` in `src/lib/tag.ts` è
   una pezza per i casi che non si possono riscrivere.
8. **Le facet dedotte non si riscrivono a mano.** `tipo`, `luogo`,
   `istituzione`, `linguaggio`, `ambiente` diventano già tag da soli:
   ripeterli in `tag:` non aggiunge niente (il codice li deduplica per
   voce, ma resta rumore nel file).
9. **Il tag è inglese nella sorgente.** L'italiano è la traduzione dopo
   `$$$`, mai il contrario: lo slug e quindi l'URL nascono dall'inglese.

## Lavoro editoriale aperto

La tassonomia sta oggi in piedi grazie alle facet dedotte di `tools` e
`teaching`, non ai tag scritti a mano: dei 21 tag di `research` ne
sopravvivono 4 (`ascoli-piceno`, `qgis`, `thermography`, `envimet`).
Taggare le voci ancora scoperte è lavoro dell'utente — la macchina è
pronta a riceverlo, ogni tag che supera le due voci diventa una pagina
da solo.
