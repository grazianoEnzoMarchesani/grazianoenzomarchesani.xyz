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
- **Marker sulla spira**: icone vettoriali vere importate da SVG di
  categoria (`src/assets/research.svg`, `teaching.svg`, `projects.svg`,
  `tools.svg` — freccia `>`, X, diamante forato, barra diagonale `/`),
  non più forme procedurali (cerchio/quadrato/X/triangolo). Cambiato in
  sessione di `/grill-me` + `/ponytail` del 2026-08-19, quando l'utente
  ha fornito il set di simboli reali del brand. **Sagome piene** (colore
  ink), il filo dell'elica resta wireframe/linea sottile, nessun
  cambiamento lì. **Geometria vettoriale vera** (`THREE.SVGLoader` →
  `THREE.ShapeGeometry`, non una texture canvas su sprite): stessa
  ragione già decisa il giorno prima (18/08) per le forme procedurali —
  una texture raster ingrandita ~60× nello zoom-to-fill si sgranerebbe.
  Il billboard verso camera, gratuito con `THREE.Sprite`, resta fatto a
  mano in `animate()`. **Orientamento fisso, mai ruotante** (deciso
  2026-08-19 su richiesta esplicita dell'utente, con riferimento
  all'immagine del pattern brand: le X restano sempre X, le barre `/`
  restano sempre `/`, indipendentemente dalla rotazione della spirale).
  Bug corretto nella stessa sessione: impostare il quaternion locale del
  marker al solo quaternion camera non basta, perché i marker sono figli
  di `group` (l'oggetto ruotato per animare l'avvitamento in
  `applyProgress`) — l'orientamento nel mondo si compone come
  `group.quaternion * local.quaternion`, quindi i simboli ruotavano
  visivamente insieme alla spira. Fix: quaternion locale calcolato come
  `inverse(group.quaternion) * camera.quaternion` (premoltiplicazione
  per l'inversa del gruppo, ricalcolata ogni frame), così l'orientamento
  risultante nel mondo resta sempre quello fisso della camera.
  - **Normalizzazione per ingombro visivo**: le 4 icone hanno proporzioni
    molto diverse (freccia stretta, X quadrata, diamante, barra
    diagonale) — ogni icona è centrata sulla propria bounding box e
    scalata per **area** (non per bounding box assoluta) così pesano
    uguale lungo la spirale invece di sembrare più grandi/piccole a
    seconda della forma. Geometrie cachate per categoria
    (`iconGeometryCache`), parsing fatto una sola volta.
  - **Preprocessing degli SVG sorgente**: i `<clipPath>` (frame di
    ritaglio del tool di export, es. Illustrator/Figma) vengono rimossi
    dalla stringa SVG prima del parsing — `SVGLoader` non ha nozione di
    `clipPath` e altrimenti disegna anche il suo rettangolo come forma
    piena sopra il glifo vero. I path con `style.fill === 'none'`
    (rettangolo decorativo di bounding, sempre presente negli export)
    vengono scartati allo stesso modo.
  - **Bug risolto — culling**: il flip su Y necessario per convertire le
    coordinate SVG (Y-down) in three.js (Y-up) (`geometry.scale(scale,
    -scale, 1)`) inverte il *winding order* dei triangoli, scartati dal
    backface culling di default con `MeshBasicMaterial` — le icone
    esistevano ed erano dimensionate correttamente ma risultavano
    invisibili. Fix: `material.side = THREE.DoubleSide`, stessa
    convenzione degli esempi ufficiali `SVGLoader` di three.js.
  - **Nomi file = id di categoria**: per sostituire un'icona in futuro
    basta sovrascrivere il file SVG corrispondente in `src/assets/`
    (stesso nome, path fissi negli `import ... ?raw` di
    `fields-spiral.ts`) — nessun intervento sul codice, purché il nuovo
    SVG sia un path pieno (`fill`, non solo `stroke`). Serve invece
    toccare il codice per aggiungere/rinominare una categoria (vedi
    `FieldCategory` in `src/data/fields.ts` + mapping `ICON_SVG` in
    `fields-spiral.ts`).
- **Disposizione**: i marker di uno stesso anno sono raggruppati per
  quadrante di categoria (90° ciascuna), non distribuiti cronologicamente
  lungo il giro.
- **Anni senza contenuti**: saltati del tutto, nessuna spira vuota
  costruita. Un anno con anche un solo contenuto ottiene comunque una
  spira intera.
- **Stile**: wireframe/line art per il filo dell'elica, marker a sagoma
  piena (vedi sopra) — coerente con la palette a due soli colori
  (`--color-ink`/`--color-paper`, niente accento, niente dark mode: sfondo
  scena color paper, tratti/sagome in ink).
- **Prospettiva grandangolare esasperata**: camera grandangolare (`FOV = 76°`,
  `CAMERA_Z = 4.2`) che accentua l'effetto tunnel e l'avvolgimento spaziale:
  le spire in primo piano si aprono ampiamente verso l'esterno del cono visivo,
  mentre quelle sullo sfondo convergono verso il punto di fuga centrale.
  Fog di sfondo (`THREE.Fog` a `PITCH * 1.8`) tarato per dissolvere morbidamente
  la profondità della spirale nel bianco/paper. Fog di primissimo piano
  (`NEAR_FADE_START = 4.2`, `NEAR_FADE_CLOSE = 1.6`) che accompagna gli elementi
  in uscita prima del piano della camera evitando tagli netti sui bordi.
- **Titoli dinamici fluttuanti a destra e ingrandimento del marker**: etichette 2D proiettate in tempo reale
  subito a destra di ciascun marker sul canvas con offset generoso (+38px) e calcolo dinamico di max-width per evitare overflow a bordo schermo. Quando un marker raggiunge la zona
  focale a destra (ore 3 / primo piano della spira), il suo titolo compare con opacità
  100% nello stile tipografico coerente con la home (`text-xs uppercase tracking-widest text-ink`,
  wrap fluido) e la sua sagoma geometrica 3D si ingrandisce fluidamente di circa il +50% (scala 1.5×).
  I marker immediatamente precedenti e successivi se vicini lungo la spirale sono visibili contemporaneamente con opacità subordinata (~30-35%) e un leggero ingrandimento scalare proporzionale (fino a +18%).
- **Interazione a due fasi per i marker 3D**:
  - Un click o tap su un marker **fuori focus** attiva una rotazione/scroll fluida (`0.7s`, `power2.out`, interrotta al tocco/scroll manuale) che porta il marker selezionato esattamente a ore 3 (punto focale in primo piano), rivelando il suo titolo al 100% di opacità.
  - Un click o tap su un marker **già in focus** (o un secondo click dopo la rotazione) avvia la transizione di apertura zoom-to-fill verso la pagina dell'articolo.
  - Un click o tap diretto sull'**etichetta testuale del titolo** apre immediatamente la pagina.
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

**Data puntuale per ogni contenuto** (sessione 2026-08-20): la corda
posiziona i marker sulla data, ma solo `research` e `tools` avevano un
campo `data`; `teaching` e `projects` hanno `anni` (spesso un intervallo,
es. `"2025 – 2026"`), che dà solo l'anno. Aggiunto `data` **opzionale**
allo schema di `teaching` e `projects` (`src/content.config.ts`);
`anni` resta la fonte dell'anno, `data` serve solo a collocare il
contenuto *dentro* quell'anno.

Le date mancanti sono state **scritte davvero nei file `.mdx`** (30
voci) e le 11 date segnaposto `YYYY-01-01` di `research`/`tools`
sostituite — su richiesta esplicita dell'utente, che le considera tutte
placeholder da rimpiazzare con quelle vere. Generate in modo
deterministico dall'id (niente `Math.random()`: i marker devono cadere
sempre nello stesso punto), mese di settembre–dicembre per i corsi con
`anni` a intervallo (anno accademico). **Sono valori finti da
correggere**: vanno sostituiti con le date reali contenuto per
contenuto. `markerYearFraction()` in `fields-content.ts` conserva un
fallback deterministico per un eventuale contenuto senza `data`, ma oggi
non è usato da nessuno.

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
- **Trigger**: sia su desktop che su touch, il primo click/tap su un marker **fuori focus** attiva la rotazione/scroll fluida (`0.7s`, `power2.out`, interrompibile manualmente) che porta il marker a ore 3 e mostra il titolo al 100% di opacità. Se il marker è **già in focus** (o al secondo click/tap dopo la rotazione), avvia direttamente la transizione zoom-to-fill. Il click/tap diretto su una qualsiasi **etichetta testuale del titolo** avvia immediatamente la transizione senza attendere ulteriori rotazioni.
- **Ritorno e Overscroll** (dalle pagine di dettaglio):
  - **Overscroll in alto (Pull-to-return)**: superando il bordo superiore della pagina (touch o wheel/trackpad), compare un indicatore e, al superamento della soglia, viene attivata la transizione verso `/fields`. Lo stato dell'ultimo articolo visualizzato viene salvato in `sessionStorage` (`fields-target-marker`) e la spirale 3D in `/fields` si riapre ripristinando l'angolo, il progresso e lo scroll esatto (`ScrollTrigger`) del marker corrispondente, senza dover rigenerare l'animazione di intro da capo.
  - **Overscroll in basso (Pull-to-next)**: superando il fondo della pagina oltre il contenuto, un indicatore visivo mostra il prossimo articolo e, al rilascio/superamento soglia, anima il contenuto verso l'alto con slide verticale fluido e naviga all'articolo successivo secondo l'ordine cronologico globale della timeline di Fields.
  - Componente condiviso: `src/components/FieldArticleNavigation.astro`.


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

## Navigazione reale dai marker (sessione 2026-08-18)

Le pagine di dettaglio per le singole voci ora esistono (vedi
[content-plan.md](content-plan.md)): `onOpenMarker` in `fields.astro`
naviga a `/fields/${marker.id}` (`marker.id` è già `<categoria>/<slug>`)
invece della route di prova. `src/pages/fields/prova.astro` è stata
rimossa. La transizione (zoom-to-fill + overlay ink) descritta sopra in
"Transizione di apertura" resta invariata, ora punta a destinazioni
reali.

## Rimandato

- Filtri/facet per anno e tag (menzionati come tipologie previste, non
  ancora progettati).

## Variante mobile — la "corda" (sessione 2026-08-20)

Sotto `MOBILE_BREAKPOINT = 640px` (viewport width, allineato al `sm:` di
Tailwind) la spirale diventa una **corda**: una linea verticale continua
con un'ansa a S per anno, invece del tunnel in prospettiva. Decisa in
sessione di `/grill-me` (multipli round) + `/ponytail`, dopo che l'utente
ha scartato diverse proposte (linea ondulata generica, pozzo verticale,
arco, card impilate, e 20 idee "alto design"/"fuori dagli schemi") a
favore di un proprio disegno.

- **Perché**: la spirale desktop oggi si limita a scalare via `resize()`
  senza un layout alternativo — su schermi stretti/alti i marker
  risultano troppo piccoli/fitti (nessun bug, semplicemente mai
  riadattata).
- **Forma — serpentina su punti di controllo ortogonali** (v3, sessione
  2026-08-20 terza parte; le v1/v2 sono state respinte, vedi "Stato").
  Il modello non è una formula di curva dedotta a occhio ma quello
  esplicitato dall'utente sul proprio disegno: una **polilinea di
  controllo fatta di soli tratti orizzontali e verticali che si
  incontrano ad angolo retto**, i cui spigoli vengono poi **raccordati
  (fillet) con archi di cerchio tangenti**. Prima la geometria rigida,
  poi l'ammorbidimento — non il contrario.
  - Un anno = **un tratto orizzontale dritto** (dove vivono i marker) +
    **un'inversione a U** che scende alla riga successiva e riparte in
    direzione opposta. Il lato si alterna per anno pari/dispari; non
    codifica la categoria (quella resta affidata alle icone SVG), è puro
    ritmo visivo.
  - **Percorso continuo**: l'anno successivo comincia esattamente dove
    il precedente ha girato (`a[i+1] = b[i]`), mai un ritorno artificiale
    al centro — è la differenza sostanziale rispetto alla v2, dove ogni
    anno era un'ansa isolata che tornava a x=0. Le x dei capi
    "camminano" a destra e a sinistra a seconda di quanto è lungo
    ciascun anno, esattamente come nel disegno. L'insieme viene
    ricentrato una volta sola sulla bounding box complessiva
    (`ropeCenterX`).
  - **L'ansa si allunga in verticale e il raggio del raccordo è sempre al massimo**
    (richiesta esplicita dell'utente nell'ultima iterazione, per non avere mai
    segmenti verticali dritti ma solo orizzontali): i punti di controllo
    che chiudono l'inversione si allontanano verticalmente quando l'anno è pieno
    (`ropeDrop[i] = clamp(ROPE_DROP_MIN + count · ROPE_DROP_STEP, …)`), e il
    **raggio del raccordo è sempre pari a metà dell'altezza dell'ansa** (`ropeTurnRadius(drop) = drop / 2`).
    In questo modo i due quarti di cerchio si toccano sempre tangenti al centro
    dell'inversione a U, formando un **semicerchio puro** per ogni anno (senza mai
    tratti verticali dritti intermedi). Le righe non sono equidistanti: `ropeRowY[]`
    è la somma cumulata dei dislivelli, e `applyProgress` segue quella y cumulata
    riga per riga invece di una proporzione lineare su una lunghezza totale.
  - **Un solo codice per rigido e raccordato**: `ropeYearPoint()`
    percorre tratto dritto → quarto di cerchio → eventuale verticale
    dritto → quarto di cerchio, parametrizzato per **lunghezza d'arco**
    (campionamento uniforme del filo). Con `ropeTurnRadius = drop / 2`
    (il caso normale) il verticale ha lunghezza zero e i due quarti formano un semicerchio;
    con `ROPE_RIGID = true` (raggio 0) restano gli spigoli vivi della polilinea
    di controllo a scopo di verifica visiva. La costante `ROPE_RIGID` (default
    `false`) serve proprio a visualizzare a schermo la polilinea di
    controllo e verificare dove cadono i punti di controllo effettivi.
- **Lunghezza del tratto dritto per anno**: **passo fisso per marker**
  (`ROPE_MARKER_STEP`), non una scala astratta sul massimo — è il punto
  del disegno di riferimento ("questo spazio si potrebbe estendere alla
  bisogna"): distanziare i due punti di controllo fa spazio agli
  elementi di un anno più pieno. Clamp `ROPE_RUN_MIN`–`ROPE_RUN_MAX`:
  il massimo esiste solo perché la corda **non scorre in orizzontale**
  (quello che esce dai bordi non è più raggiungibile), oltre quella
  soglia i marker si stringono tra loro invece di allargare ancora la
  riga.
- **Marker distribuiti sulla data reale, lungo tutto il percorso
  dell'anno** (deciso 2026-08-20 con l'utente, terza parte della
  sessione). Lo spazio a disposizione è **l'intero pezzo di corda che
  distingue un anno dall'altro** — tratto dritto *e* ansa — non il solo
  tratto: da quando l'ansa si allunga in verticale coi contenuti c'è
  spazio vero anche lì. La posizione dentro l'anno è la **frazione
  d'anno della data del contenuto** (`FieldMarker.yearFraction`),
  riportata sulla lunghezza d'arco del percorso: un contenuto di giugno
  cade a metà del pezzo di corda del suo anno.
  - **Mai sovrapposizioni** (vincolo esplicito dell'utente): le date
    reali possono cadere a pochi giorni l'una dall'altra, le sagome no.
    Dopo il posizionamento per data, `yearPlacements()` fa due passate
    (avanti: spingi chi è più vicino di `ROPE_MARKER_GAP` al precedente;
    indietro: rimetti dentro il bordo chi è stato spinto oltre) — uno
    spostamento minimo che conserva ordine cronologico e distanze
    relative. Perché le due passate convergano sempre, la lunghezza del
    tratto dritto ha il clamp estetico `ROPE_RUN_MIN`–`MAX` come
    *base* ma viene allungata quanto serve se il percorso dell'anno non
    basta: la non-sovrapposizione ha l'ultima parola sulla taratura, e
    la camera si allontana di conseguenza.
  - **`t` è mode-dependent**: le due forme ordinano i marker dentro
    l'anno in modo diverso (settori di categoria sulla spirale, data
    reale sulla corda) e il focus deve seguire l'ordine con cui i marker
    si incontrano *davvero* lungo la forma attiva, altrimenti scrollando
    il fuoco salterebbe avanti e indietro lungo la corda. Ogni
    `MarkerObject` porta quindi `spiralT` e `ropeT`; `t` è quello attivo
    e viene riallineato da `rebuildPositions()` a ogni cambio modalità.
    Tutto il resto (focus, scala, etichette, scroll, zoom-to-fill)
    continua a leggere solo `t` e non sa nulla della differenza.
  - Sulla **spirale desktop non cambia nulla**: resta il raggruppamento
    per quadrante di categoria.
- **Ordine cronologico**: identico alla spirale, `t=0` (anno corrente)
  in alto/vicino, `t` crescente verso il passato — nessuna inversione
  rispetto al desktop.
- **Moto e camera**: nessuna rotazione (a differenza dell'avvitamento
  della spirale). La camera è posizionata in **inquadratura ravvicinata**
  (`ROPE_CAMERA_TARGET_WIDTH = 2.4`, `ROPE_CAMERA_MIN_Z = 3.2`, `ROPE_CAMERA_MAX_Z = 4.8`)
  e centrata a `(0, 0, z)` guardando l'origine `(0, 0, 0)`. Durante lo scroll,
  `applyProgress` **segue attivamente il tracciato curvilineo della corda in X e Y**
  (`group.position.set(-p.x, -p.y, 0)` ricavato da `ropePoint(t)`): la corda scorre
  orizzontalmente attraverso lo schermo lungo i tratti dritti, curva attorno alle anse
  a semicerchio e riparte nella direzione opposta per l'anno successivo, mantenendo il
  marker in focus al centro dell'attenzione in modo nitido e immersivo. Il pin
  `ScrollTrigger` resta identico e attivo anche su mobile (nessuno
  scroll nativo alternativo).
- **Near fade isolato per modalità**: per consentire alla camera di avvicinarsi
  senza sbiadire la corda a riposo, le uniform `uNearFadeStart` e `uNearFadeClose`
  vengono aggiornate dinamicamente (`4.2`/`1.6` per la spirale desktop, `1.0`/`0.3`
  per la corda mobile, dove la dissolvenza agisce solo durante la transizione zoom-to-fill).
- **Fade in/out ai bordi**: nessun fog dedicato per la corda (il fog di
  profondità esistente dipende dalla distanza in Z, quasi costante in
  modalità corda). Da v3 il fog di sfondo viene **spostato oltre la
  corda** nel ramo rope di `applyCameraForMode()` invece di restare
  tarato sulla spirale, dove sbiadiva la corda tutta in blocco senza
  darle profondità; non azzerato (`scene.fog = null` toglierebbe il
  chunk `<fog_fragment>` su cui si innesta la dissolvenza in primo
  piano). Gli elementi entrano/escono per clipping naturale
  del frustum quando superano il bordo alto/basso dello schermo. Taglio
  deliberato di scope (`/ponytail`): costruire un fade equivalente
  avrebbe richiesto rendere mode-aware anche lo shader di fog condiviso
  con la spirale, rischiando regressioni su una parte già rifinita e
  debuggata a fondo.
- **Cambio modalità (resize live)**: nessun morph geometrico
  vertice-per-vertice tra le due forme — i due sistemi di moto
  (avvitamento Z+rotazione vs traslazione Y) e i relativi fog sono
  troppo diversi per una fusione continua senza rischio di regressione
  sulla spirale desktop. Al superamento della soglia, `switchShapeMode()`
  fa un cross-fade sull'opacità del `<canvas>` (DOM, ~300ms totali):
  fade-out, ricalcolo posizioni/camera per la nuova modalità, fade-in.
  Percepito come fluido ma non è un'interpolazione di forma — taglio di
  scope esplicitamente concordato con l'utente in sessione di
  `/ponytail`. Al caricamento pagina (non resize live) si parte
  direttamente nella modalità corretta per la larghezza iniziale, senza
  alcun cross-fade né animazione d'ingresso "avvitamento" (quella resta
  solo per la spirale — v1 della corda parte già alla posizione di
  scroll corretta).
- **Etichette dinamiche (allineate tra spirale e corda)**:
  - Sulla spirale: il marker al punto focale (ore 3) ha titolo a opacità 100% posizionato a destra (+52px), i marker vicini lungo la spira mostrano il proprio titolo con opacità subordinata (~30-35%) e schiarimento progressivo.
  - Sulla corda: applicato lo stesso principio della spirale con gerarchia a due livelli e posizionamento adattivo basato sulla normale geometrica:
    - **Tratti orizzontali**: alternanza stabile e permanente per indice marker (`markerIndex % 2 === 0` sopra a -60px, `markerIndex % 2 === 1` sotto a +68px). La posizione del titolo di ciascun marker rimane fissa sul proprio lato dall'apparizione come vicino fino al focus e alla successiva dissolvenza, eliminando totalmente scatti o inversioni brusche sopra/sotto durante lo scroll.
    - **Curve e anse a U**: il vettore normale analitico orienta automaticamente il titolo verso l'interno dell'ansa nel grande spazio laterale aperto con distanza radiale maggiorata (78px, garantendo totale respiro anche rispetto alle punte estese di simboli grandi come la X a 45°), con ancoraggio rigoroso al lato interno (a sinistra se l'ansa è a destra, con `textAlign: right`, o a destra se l'ansa è a sinistra, con `textAlign: left`), evitando qualsiasi collisione con i simboli che si snodano lungo la curva.
  - **Anti-collisione e contenimento**: le etichette attive sulla corda vengono ordinate per priorità (focus prima, poi vicini per distanza dal fuoco) e sottoposte a risoluzione collisioni 2D AABB con buffer di sicurezza di 14px: se due etichette vicine si sovrappongono, viene mostrata quella più vicina al focus senza ammassamenti. Le dimensioni del campo di testo (`maxWidth` fisso a 200px sui tratti orizzontali e 190px sulle curve) e la distanza dal marker rimangono **rigorosamente costanti e invarianti** sia da vicino che in focus, garantendo che il testo mantenga sempre lo stesso a-capo e non subisca mai riallineamenti durante lo scroll.
- **Riuso invariato**: hit-test/raycasting, focus/scala dinamica,
  proiezione DOM delle etichette, transizione di apertura zoom-to-fill (stesso
  pattern, target locale sull'asse "attivo" della modalità — Z per la
  spirale, Y per la corda, la scala ×60 domina comunque la percezione
  quindi non serve centratura pixel-perfect), overlay ink, navigazione
  reale, `prefers-reduced-motion`. Zero modifiche a questi percorsi.
- **Verificato**: `astro check` (0 errori), screenshot Puppeteer
  headless a più quote di scroll su viewport 390×844 (forma raccordata e
  polilinea di controllo con `ROPE_RIGID`), spirale desktop 1400×900 e
  resize live desktop→mobile — nessun errore console, nessuna
  regressione sulla spirale.

## Stato della forma della corda (sessione 2026-08-20)

Tre iterazioni. Le prime due **respinte dall'utente dopo ispezione
visiva diretta**, confrontando con il proprio disegno di riferimento:

1. Sinusoide `sin(π·localT)` (ampiezza = marker count): respinta, le
   curve erano l'elemento dominante e i tratti dritti quasi invisibili.
2. Curva stretta di Bézier + tratto dritto dominante, un'ansa isolata
   per anno che tornava a x=0: proporzioni corrette ma giudicata
   comunque un fallimento.
3. **Versione attuale** (serpentina su punti di controllo ortogonali +
   fillet, descritta sopra), rifatta da zero partendo dal concetto
   dichiarato dall'utente invece che da una formula di curva dedotta:
   polilinea rigida ad angoli retti prima, raccordo dopo; percorso
   continuo che riparte dove ha girato; passo dei marker fisso, con la
   riga che si allunga quanto serve. Verificata visivamente su viewport
   390×844 (screenshot Puppeteer a più quote di scroll, modalità
   raccordata e modalità `ROPE_RIGID`), più spirale desktop 1400×900 e
   resize live desktop→mobile: nessuna regressione, nessun errore
   console.

**Lezione operativa** (vale per il prossimo ritocco): quando l'utente
fornisce un disegno con punti di controllo, il disegno descrive **il
modello geometrico**, non solo la silhouette da imitare — ricostruire i
punti di controllo e l'operazione di raccordo, non inseguire la forma
con una curva parametrica inventata.

**Non ancora affrontato**: fade ai bordi per la corda (vedi sopra),
morph geometrico continuo tra spirale e corda (oggi è un cross-fade di
opacità), animazione d'ingresso dedicata alla corda.

## Fix resize (sessione 2026-08-20)

Segnalato dall'utente: dopo un resize della finestra, la spirale
restava rotta finché non si ricaricava la pagina. Due bug distinti,
trovati con verifica diretta (script Puppeteer headless, non solo
lettura del codice):

- **`ScrollTrigger.end` congelato**: era una stringa `"+=${window.innerHeight * turns * 1.2}"`,
  che fissa la distanza di scroll necessaria a `window.innerHeight` del
  momento del setup — il refresh automatico di GSAP su resize ricalcola
  `start`/`end`, ma non può "riaprire" un valore già risolto dentro una
  stringa. Fix: `end` reso una funzione (`() => ...`), rivalutata a ogni
  refresh.
- **Canvas distorto dopo resize (bug più subdolo)**: il `resize()`
  interno (che chiama `renderer.setSize`/aggiorna `camera.aspect`) era
  agganciato al raw evento `window.resize`. Ma GSAP pinna `pinSection` a
  dimensioni fisse (`position:fixed`) e le sblocca solo al proprio
  refresh interno, ~0.2s *dopo* l'evento di resize — leggere
  `pinSection.clientWidth/Height` dentro il resize event stesso
  restituiva quindi ancora le dimensioni vecchie, lasciando il drawing
  buffer del canvas WebGL stirato/distorto sulle nuove dimensioni CSS
  finché non si ricaricava la pagina. Confermato con uno script
  Puppeteer che leggeva `canvas.width/height` (drawing buffer) vs
  `getBoundingClientRect()` (dimensioni CSS) prima/dopo un resize
  simulato: dopo il resize restavano disallineati. Fix: sostituito
  `window.addEventListener('resize', resize)` con
  `ScrollTrigger.addEventListener('refresh', resize)` — stesso pattern
  usato internamente da GSAP per il proprio `Observer` (vedi
  `ScrollTrigger.js`, `vars.onEnable`), garantisce che `pinSection` abbia
  già le dimensioni nuove quando `resize()` legge.
- Verificato con script Puppeteer headless dedicato: dopo resize,
  `canvas.width/height` (drawing buffer) ora combacia sempre con
  `getBoundingClientRect()` (dimensioni CSS), e l'altezza dello
  spacer di pin (`ScrollTrigger`) scala proporzionalmente alla nuova
  `window.innerHeight`. `astro check` pulito.
- Cap/culling di performance sui marker.
