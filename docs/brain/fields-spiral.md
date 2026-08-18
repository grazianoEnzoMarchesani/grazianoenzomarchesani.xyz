# Animazione 3D di Fields — la spirale

← [index](index.md)

## Stato

Prima versione decisa (sessione di `/grill-me` del 2026-08-18) e implementata
subito dopo nella stessa sessione: `src/pages/fields.astro`,
`src/scripts/fields-spiral.ts`, `src/data/fields.ts`. Risolve il punto
"sospeso" cube gallery 3D/Three.js segnato in [design.md](design.md) e
[content-plan.md](content-plan.md) — non più sospeso, prima iterazione
implementata e verificata (dev server, `astro check`, `astro build`,
screenshot Playwright headless senza errori console).

## Ruolo nell'architettura di Fields

La spirale è la **vista d'ingresso/esplorativa** di `/fields`, non l'unica
interfaccia di navigazione: filtri/facet per anno e tag restano previsti
(vedi [content-plan.md](content-plan.md)) ma non ancora progettati né
costruiti — capitolo futuro separato. In questa prima iterazione `/fields`
contiene *solo* la spirale, nessun titolo statico o frame attorno (scelta
esplicita: massima immersione).

## Concetto visivo

Entrando nella pagina, dal vuoto compare una spirale/elica vista dal lato
delle spire in prospettiva (si guarda dentro come in un tunnel). Ogni giro
completo = un anno di contenuti. Scrollando, la spirale si avvita/svita
fisicamente **verso l'utente** (rotazione + avanzamento lungo il proprio
asse, non un dolly di camera — la camera resta fissa).

- **Direzione cronologica**: l'anno corrente (2026) è la spira più
  vicina/prima visibile; scrollando in avanti ci si allontana verso il
  passato (2025, 2024, ...).
- **Marker sulla spira**: cerchio, quadrato, X, triangolo, mappati 1:1
  sulle quattro categorie fuse in Fields (Research, Tools, Teaching,
  Projects). **Sagome piene** (colore ink), non più solo contorno —
  cambiato in sessione di `/grill-me` del 2026-08-18 insieme al design
  della transizione di apertura (vedi sotto): il filo dell'elica resta
  invece wireframe/linea sottile, nessun cambiamento lì.
  **Geometria vettoriale vera** (`THREE.CircleGeometry`/`PlaneGeometry`/
  `ShapeGeometry`, non più una texture canvas su sprite): l'utente ha
  segnalato che una texture raster ingrandita ~60× nello zoom-to-fill si
  sarebbe sgranata, come qualunque bitmap zoomata — cambiato prima di
  implementare la transizione per questo motivo. Il billboard verso
  camera, gratuito con `THREE.Sprite`, va ora fatto a mano (quaternion
  copiato dalla camera ogni frame in `animate()`).
- **Disposizione**: i marker di uno stesso anno sono raggruppati per
  quadrante di categoria (90° ciascuna), non distribuiti cronologicamente
  lungo il giro.
- **Anni senza contenuti**: saltati del tutto, nessuna spira vuota
  costruita. Un anno con anche un solo contenuto ottiene comunque una
  spira intera.
- **Stile**: wireframe/line art per il filo dell'elica, marker a sagoma
  piena (vedi sopra) — coerente con la palette a due soli colori
  (`--color-ink`/`--color-paper`, niente accento, niente dark mode: sfondo
  scena color paper, tratti/sagome in ink). Fog che sfuma le spire più
  lontane per rinforzare la profondità (vedi anche "Fog in primo piano"
  sotto, simmetrico ma ancorato allo schermo invece che alla distanza).
- **Marker sempre billboard** verso la camera (mai di taglio durante la
  rotazione), per restare leggibili/cliccabili.
- **Preview al hover/tap**: pannello fisso 2D (non etichetta 3D
  fluttuante) con categoria + titolo. Nessuna navigazione reale
  implementata ancora — i contenuti placeholder non hanno una
  destinazione (articoli non ancora migrati).
- **Limiti di scroll**: resistenza elastica; uno scroll deciso vince e fa
  avanzare/tornare all'inizio, uno scroll delicato dà solo un piccolo
  rimbalzo. Implementato con `pin`+`scrub` di GSAP `ScrollTrigger`
  (nessun sistema di rubber-band custom aggiuntivo — il pin nativo più il
  limite naturale di scroll della pagina bastano per questa prima
  iterazione).
- **Animazione d'ingresso**: parte automatica al caricamento della
  pagina, una sola volta per sessione (flag in `sessionStorage`).
- **Nav fissa e footer** del sito restano visibili sopra la scena, nessuna
  eccezione full-immersive.

## Dati

**Reali, non più placeholder** (sessione 2026-08-18): `src/data/fields-content.ts`
(server-only, usa `astro:content`) costruisce la timeline leggendo le
quattro collection (`research`, `tools`, `teaching`, `projects`) — anno
da `data`/prima cifra a 4 di `anni`, titolo da `titolo`/`nome`, id
`<categoria>/<slug>`. Chiamato solo dal frontmatter di `fields.astro`
(server/build-time); il risultato viene serializzato in un
`<script type="application/json" id="fields-data">` e letto da lì dallo
script client della spirale, che non può importare `astro:content`
(gira nel browser). `src/data/fields.ts` resta solo tipi/costanti puri
(`FieldCategory`, `FIELD_CATEGORY_LABELS`/`_ORDER`, `FieldMarker`,
`FieldYear`), condivisi da server e client senza portarsi dietro
`astro:content` nel bundle browser. Verificato con `astro check`,
`astro build` e ispezione del JSON generato (titoli reali, non più
generati da seed).

## Performance

Nessun cap/culling sul numero di marker per ora — deciso esplicitamente di
affrontarlo solo quando il volume di contenuti reali lo renderà un
problema concreto (pochi contenuti previsti nel primo anno). Nota tecnica
aperta: il chunk di build che include Three.js supera i 500kB minificati
(warning Vite) — coerente con l'aver scelto Three.js consapevolmente
([stack.md](stack.md)), da tenere d'occhio se in futuro la velocità
percepita ne risente (code-splitting/dynamic import valutabili allora).

## Accessibilità

Decisa e implementata subito, non rimandata:

- Lista semantica (`<ul>` anno → categoria → titoli) sempre presente nel
  DOM, con classe `sr-only` di default — canale accessibile primario.
- Con `prefers-reduced-motion: reduce`, la scena 3D **non viene montata
  affatto**: la sezione pinnata viene rimossa e la lista diventa visibile
  (stile minimo coerente col resto del sito), come esperienza primaria
  per chi ha questa preferenza.
- Navigazione da tastiera solo sulla lista `sr-only`/visibile — la scena
  3D non è raggiungibile da tastiera (nessun focus-follow della camera).

## Transizione di apertura (click su un marker)

Decisa in sessione di `/grill-me` del 2026-08-18, implementata subito
dopo contro una pagina di prova (route reali di Fields non ancora
costruite). Sostituisce, per questa transizione, il pannello di preview
come unico esito del click/tap.

- **Sequenza**: (1) la sagoma piena del marker cliccato si avvicina alla
  camera fino a riempire tutto lo schermo (zoom, non dolly — stesso
  principio della camera fissa già in uso per l'avvitamento),
  **convergendo anche verso il centro dello schermo** (non solo
  crescendo sul posto: un marker decentrato sulla spira deve arrivare a
  "colpire in faccia" lo spettatore, non restare decentrato mentre
  cresce — segnalato dall'utente durante l'implementazione, corretto
  animando anche x/y locali verso 0 insieme alla scala, non solo z); (2)
  solo a copertura totale raggiunta, fade-out che rivela la pagina di
  destinazione già caricata sotto.
- **Colore di copertura**: ink pieno (coerente col colore dei marker).
- **Timing**: rapido e deciso, non cinematico — zoom-to-fill
  ~0.4–0.5s, fade-out ~0.2–0.3s, ~0.6–0.9s totali. Volutamente diverso
  dal timing più disteso (1.8s) dell'animazione d'ingresso della
  spirale: qui la sensazione voluta è "si entra subito dentro", non un
  momento cinematico a sé.
- **Uniforme per le quattro forme**: stessa animazione (zoom, colore,
  timing) per cerchio/quadrato/X/triangolo, cambia solo la sagoma.
- **Meccanismo tecnico**: Astro View Transitions native (`<ClientRouter />`,
  mai usato finora nel sito) per il caricamento/swap di pagina;
  l'animazione della forma si innesta come transizione custom sopra il
  meccanismo nativo, non un fetch/prefetch scritto a mano.
- **Trigger**: desktop, click sul marker già in hover avvia la
  transizione (l'hover mostra comunque la preview come oggi). Touch: il
  primo tap mostra la preview come oggi; serve un **secondo tap sullo
  stesso marker** (non sul pannello di preview) per avviare la
  transizione — nessuna vincolo di tempo tra i due tap. Esplicitamente
  non un problema di "schermo piccolo": quando in futuro arriverà una
  visualizzazione dedicata per mobile/verticale (vedi "Rimandato" sotto),
  questa logica touch-su-spirale non si intreccerà con quella, sono due
  esperienze distinte.
- **Ritorno** (indietro dalla pagina di dettaglio a Fields): implementato
  come fade-in dell'overlay ink (0.3s) prima di navigare via
  `navigate('/fields')`, poi fade-out automatico a pagina caricata —
  stesso overlay persistito (vedi sotto), non un rientro animato del
  marker specifico nella sua posizione esatta nell'elica (semplificazione
  consapevole: tracciare "quale marker esatto" attraverso una
  navigazione via ClientRouter avrebbe richiesto molto più stato da
  portarsi dietro, per un guadagno visivo marginale). Il pulsante
  "Torna a Fields" nella pagina di prova attiva questa sequenza; il
  tasto indietro nativo del browser passa comunque dall'overlay (fade-out
  automatico su `astro:page-load`) ma senza il fade-in preventivo, che
  richiede un gesto intercettabile via click.

## Fog in primo piano

Deciso in sessione di `/grill-me` del 2026-08-18, implementato subito dopo,
**corretto nella stessa sessione** dopo un primo tentativo sbagliato (vedi
"Correzione" sotto). Il `THREE.Fog` di sfondo sfuma per **distanza dalla
camera** (le spire più lontane/nel passato); questo secondo fog usa la
**stessa identica metrica di distanza, lato opposto**: sfuma quando un
elemento è troppo *vicino* alla camera, non quando è lontano. Risolve il
fatto che le spire più vicine alla camera (le più recenti) uscivano dal
viewport tagliate di netto dal bordo del canvas invece di dissolversi.

- **Meccanismo**: shader condiviso via `onBeforeCompile`, applicato sia al
  materiale dei marker (`MeshBasicMaterial`) sia a quello del filo
  dell'elica (`LineBasicMaterial`). Ogni vertice calcola `-mvPosition.z`
  (profondità in view-space, la stessa metrica che three.js usa
  internamente per `vFogDepth` nel fog di sfondo) e sfuma il colore verso
  `PAPER` quando la profondità scende sotto una soglia fissa (world units,
  non dipende dal resize) — lerp di colore, non opacity/trasparenza
  (stesso risultato visivo dato che lo sfondo è `PAPER` pieno, ma senza
  introdurre blending). Si aggancia al chunk `<fog_fragment>` già presente
  sui materiali invece di duplicarne la logica.
- **Soglia**: fissa (`NEAR_FADE_START = 6.0`, `NEAR_FADE_CLOSE = 2.0`),
  non ricalcolata dinamicamente in base a quale marker sta uscendo —
  sempre attiva indipendentemente dallo stato di scroll/rotazione.
  Volutamente ampia: il raggio fisso della spirale rispetto al cono
  visivo che si restringe vicino alla camera fa sì che il "clipping"
  avvenga a profondità leggermente diverse a seconda della posizione
  angolare del marker (bordo verticale, orizzontale o angolo — frustum
  non isotropo), quindi la banda di dissolvenza copre con margine tutti i
  casi invece di essere tarata sul solo caso verticale.
- **Ambito**: sia le forme sia il filo, in modo continuo lungo tutta la sua
  lunghezza — non solo i marker.
- **Hit-testing**: quando un marker è sfumato oltre ~85%, il suo
  `hitPlane` viene escluso dal raycasting (flag `interactable` su
  `MarkerObject`, ricalcolato ogni frame su CPU con la stessa metrica di
  profondità dello shader — calcolo separato, serve solo per i marker non
  per il filo). Evita hover/click su una forma ormai invisibile.
- **Verificato**: script Playwright headless (screenshot su stato iniziale
  e durante lo scroll), nessun errore console, dissolvenza confermata
  visivamente morbida e continua su tutti i bordi (anche interna alla
  singola sagoma, non solo marker per marker).

### Correzione: da "bordo inferiore" a "distanza dalla camera"

Prima implementazione: fade legato alla sola coordinata Y proiettata sullo
schermo (NDC-y), pensato per il caso mostrato nello screenshot iniziale
dell'utente (un marker che usciva dal basso). L'utente ha segnalato via
screenshot che marker vicini ai bordi **sinistro/destro** restavano solidi
e tagliati di netto — la soglia sul solo asse verticale non li
intercettava. Causa: il raggio della spirale è fisso mentre il cono
visivo si restringe vicino alla camera, quindi gli elementi possono uscire
dal frame da qualunque bordo (non solo il basso) a seconda della loro
posizione angolare sulla spira. Fix: sostituita la base del calcolo da
NDC-y a profondità view-space (`-mvPosition.z`), isotropa rispetto alla
direzione di uscita — stesso principio del fog di sfondo, non più
specifico a un bordo.

## Implementazione (pagina di prova)

Sessione 2026-08-18, verificata con `astro check`, `astro build` e uno
script Playwright headless (nessun errore console, sequenza
click→zoom→overlay→navigazione→fade-out→ritorno confermata via
screenshot). Route reali di Fields non ancora decise: la transizione
punta a `/fields/prova` (`src/pages/fields/prova.astro`), pagina usa e
getta da sostituire quando arrivano le pagine di dettaglio vere.

- **`src/components/FieldTransitionOverlay.astro`**: il div ink
  fullscreen, con `transition:persist` — sopravvive invariato allo swap
  di `<ClientRouter />` tra le due pagine (stesso nodo DOM, niente
  flash). Un piccolo script interno, su `astro:page-load`, controlla se
  arriva già a opacità piena (cioè: siamo stati portati qui da
  un'apertura o da un rientro appena fatto) e in tal caso fa il
  fade-out finale — logica unica, vale sia per l'andata che per il
  ritorno.
  - **Bug trovato e corretto**: con `<ClientRouter />`, uno `<script>`
    di modulo non si ri-esegue da solo a ogni navigazione (stesso URL
    di modulo, il browser lo deduplica) — la spirale spariva tornando a
    `/fields` perché `initFieldsSpiral()` non veniva più richiamato.
    Fix: tutto il setup di `fields.astro` e di `prova.astro` è avvolto
    in una funzione agganciata a `document.addEventListener('astro:page-load', setup)`
    invece che eseguito al parse dello script — vale per qualunque
    pagina che usi `<ClientRouter />` in questo sito, da ricordare
    quando se ne aggiungeranno altre.
- **`src/scripts/fields-spiral.ts`**: `initFieldsSpiral()` accetta ora
  anche `onOpenMarker(marker, playZoom)` — chiamato al trigger (click
  desktop su hover, secondo tap sullo stesso marker su touch);
  `playZoom()` anima scala e posizione della sagoma cliccata (GSAP,
  stessa durata `OPEN_ZOOM_DURATION_MS = 450` esportata) e risolve a
  zoom-to-fill completo. Lo scroll (`ScrollTrigger`) si blocca durante
  l'apertura (`isOpening` flag).
- **`fields.astro`**: nello script, `onOpenMarker` fa partire in
  parallelo il fade-in dell'overlay (stessa durata dello zoom) e
  `playZoom()`; a entrambi completati chiama
  `navigate()` (da `astro:transitions/client`) verso la destinazione.

## Rimandato

- Filtri/facet per anno e tag (menzionati come tipologie previste, non
  ancora progettati).
- Navigazione reale dai marker ai contenuti: i dati sono reali (vedi
  sopra) ma non esistono ancora pagine/route per le singole voci
  (`/fields/research/<slug>` ecc.) — il click/hover sul marker mostra
  solo il pannello di preview, non porta da nessuna parte.
- Comportamento mobile/tablet dedicato: idea iniziale dell'utente è una
  linea ondulata verticale (anni più vecchi in alto, più recenti in
  basso) invece della spirale in prospettiva, ma non ancora progettata né
  costruita — al momento la scena desktop si limita a scalare via
  `resize()`, senza un layout alternativo per schermi stretti.
- Cap/culling di performance sui marker.
