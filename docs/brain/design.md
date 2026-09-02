# Direzione visiva/estetica

← [index](index.md)

## Stato

Prima versione decisa e implementata (home page), sessione del 2026-08-18
(sessione di `/grill-me`). Vedi [constraints.md](constraints.md) per il
requisito generale che ha guidato queste scelte.

## Ispirazione

Riferimento di partenza: [Codrops — Scroll-Driven 3D Cube Gallery](https://tympanus.net/codrops/2026/05/26/building-a-scroll-driven-3d-cube-gallery-in-webflow-with-gsap/).
Ripreso solo il **ritmo** (titoli a tutta pagina in sequenza scroll-driven),
non la tecnologia (Webflow, esclusa a priori) né il cubo 3D: per la
**home** il pin dell'intera sezione resta deliberatamente escluso (vedi
sotto). Un pattern di pin scroll-driven è invece usato altrove, nella
pagina interna **Fields** — vedi [fields-spiral.md](fields-spiral.md).

## Palette

Due soli colori, nessun accento:

- `--color-ink` — quasi-nero verso il grigio (`#1a1a19`)
- `--color-paper` — quasi-bianco verso il panna (`#f4f1ea`)

L'interattività (link, hover) si segnala con sottolineatura/peso/opacità,
mai col colore — coerente col vincolo di accessibilità "il colore non è
mai l'unico canale".
Outline e tap-highlight del browser azzerati globalmente (`*:focus, *:focus-visible { outline: none !important; }` e `-webkit-tap-highlight-color: transparent`): nessun contorno/rettangolo antiestetico al click su elementi interattivi, pulsanti o titoli.


Modalità: **solo light**, nessun dark mode. La priorità bilingue (vedi
sotto) ha soppiantato la richiesta di un tema scuro.

## Tipografia

Ripartita da zero (non riprendiamo i font del vecchio progetto
`sitoBello2`). Self-hosted via pacchetti `@fontsource`/`@fontsource-variable`,
nessun Google Fonts esterno servito da CDN (vincolo di stack) — anche
quando la scelta del font parte da una pagina Google Fonts, si installa
il pacchetto locale corrispondente invece di collegarsi a Google.

- **Display / titoli** — Anton (sans-serif condensed, bold, un solo peso)
- **UI / testo / nav** — Inter Variable (sans-serif)

Cambiato da Fraunces (serif) ad Anton su richiesta esplicita dell'utente,
sessione del 2026-08-18: titoli ora sans-serif condensed invece di serif.
L'utente prevede "giochi di tipografia" più elaborati da approfondire in
una sessione dedicata — non ancora fatto.

## Home page (v1, implementata)

- **5 schermate a tutta altezza** (`100dvh`) con `scroll-snap` CSS
  nativo (`snap-y snap-mandatory` con `scroll-snap-stop: always` / classe `snap-always` su ciascuna sezione, sessione 2026-08-21 `/ponytail`) per forzare lo stop su ogni singola sezione a ogni gesto di swipe o scroll sia su mobile che su desktop, prevenendo salti multi-pagina. Ridotte da 8 a 5 nella sessione di `/grill-me` del
  2026-08-18, quando Research/Tools/Teaching/Projects sono state fuse
  nella sezione unica **Fields** (vedi [content-plan.md](content-plan.md)
  per il perché del nome e lo stato della fusione). Lo scroll-snap resta
  nativo (nessun pin dell'intero contenuto stile "cubo Codrops"); solo
  il contatore di sezione è overlay GSAP-driven (vedi sotto, contatore
  ora `/ 04`).
- Ogni schermata-area è un link a tutta pagina verso la pagina interna
  corrispondente (`/fields`, `/publications`, ...); mostra solo titolo
  grande, **non** contenuto interno — principio esplicito: "titolo a
  tutta pagina", non anteprima. Confermato esplicitamente anche per
  Fields: nessuna anteprima di filtri/categorie in home, la
  sofisticazione dell'interfaccia sta nella pagina interna.
- Ogni link ha un elemento minimo visibile (freccia) per accessibilità e
  focus da tastiera.
- Nav fissa in alto con le stesse voci (localizzate `FIELDS`/`AMBITI`, `PUBLICATIONS`/`PUBBLICAZIONI`, `SKILLS`/`COMPETENZE`, `ABOUT`/`CHI SONO`):
  - Su **desktop** (≥ 768px): voci racchiuse in pillola borderless semi-trasparente `bg-paper/60 backdrop-blur-sm`, selettore di lingua compatto `EN | IT` in pillola coordinata `bg-paper/60 backdrop-blur-sm` con stato attivo in contrasto `bg-ink text-paper`, pulsante di ricerca ⌘K / Ctrl K, e tasto home con logo vettoriale geometrico (`h-12 w-auto`).
  - Su **mobile** (< 768px): logo compatto (`h-8 w-auto`), ricerca e lingua visibili in barra, e pulsante compatto `Menu` a pillola che apre una dropdown card fluttuante a discesa con sfondo `bg-paper/95 backdrop-blur-md border border-ink/15 rounded-2xl shadow-2xl` animata da un morbido **fade-in / fade-out** con micro-traslazione e scaling (`scale: 0.98 ↔ 1.0`), contenente i link delle sezioni con freccia mono `↗`, chiudibile automaticamente al tap, click esterno, cambio pagina (`astro:page-load`) o tasto Escape via delegazione globale di eventi.
  - **`src/assets/logo.svg` è la fonte di verità unica** del logo (sessione 2026-08-19): `Nav.astro` importa il file grezzo (`?raw`) e lo inietta via `set:html` (classe `h-8 sm:h-12 w-auto` sull'`<svg>` iniettato, colori del file rispettati as-is), transizione `hover:opacity-60` sul link, `aria-label="Graziano Enzo Marchesani - Home"`. `public/favicon.svg` e `public/favicon.ico` sono generati automaticamente a build time dallo stesso file sorgente (vedi [stack.md](stack.md)).
- Footer minimo persistente (`position: fixed`):
  - Rimosso l'indirizzo email in chiaro dal markup HTML statico per prevenire harvesting da scraper/bot: token base64 decodificato lato client all'apertura del popover o al click. Nel DOM SSR è presente `graziano.marchesani [at] unicam.it`, mentre all'interazione viene mostrata l'email attiva con link nativo `mailto:` e tasto di copia negli appunti con feedback tipografico pulito ("COPY" $\rightarrow$ "COPIED!" / "COPIA" $\rightarrow$ "COPIATO!") privo di sfondi o rettangoli scuri.
  - Sulla sinistra: link/icona **RSS** in pillola semi-trasparente (presente su `/fields` e relative schede).
  - Sulla destra: pulsante pill **"Contatti" / "Contact"** che apre un popover/pannello fluttuante (`bg-paper/95 backdrop-blur-md rounded-2xl border border-ink/15`) dotato di **ombra di elevazione verso l'alto ($-Y$)** (`shadow-[0_-20px_45px_-10px_rgba(28,25,23,0.12),0_-8px_20px_-6px_rgba(28,25,23,0.06)]`), che stacca la scheda dai contenuti sottostanti in coerenza con la sua origine dal fondo pagina.
  - **Stile puramente tipografico ed essenziale**: rimossi sfondi grigi e bordi sia dalla riga email sia dai link social (`LINKEDIN ↗`, `INSTAGRAM ↗`, `GITHUB ↗`), lasciando solo testo pulito in monospace con sottolineatura su hover in linea con lo stile della pagina About.
  - Su mobile e desktop, la separazione `justify-between` (o `justify-end`) garantisce spazio arioso e zero sovrapposizioni tra RSS e contatto.
- Dati reali (non segnaposto): identità e sezioni prese da
  `sitoBello2/src/content` (vedi [content-plan.md](content-plan.md)).

### Contatore di sezione (`01 / 07`)

Implementato sessione del 2026-08-18 con GSAP + `ScrollTrigger` (vedi
[stack.md](stack.md)), riprendendo dal tutorial Codrops di riferimento
solo il pattern di reveal mascherato, non la tecnologia:

- Overlay fisso (non più testo statico dentro ogni sezione, che
  scorreva via con essa): solo la parte numerica (`01`) è dentro una
  maschera (`overflow: hidden`) e si anima; `/ 07` resta sempre fermo.
- Cambio numero scattato da `ScrollTrigger` **allo snap di sezione**
  (non proporzionale allo scroll continuo): il vecchio numero esce, il
  nuovo entra dal basso, con `direction` che inverte coerentemente il
  verso quando si scrolla all'indietro (vecchio esce in basso, nuovo
  entra dall'alto).
- Badge nascosto (opacity 0) sulla hero, fade-in entrando nella prima
  sezione.
- Pillola di sfondo panna traslucido + blur, **senza bordo** (rimosso su
  richiesta esplicita, non piaceva visivamente).
- Posizione **responsive**: su desktop (`sm:` e oltre) sul bordo
  sinistro, allineato al margine di "GM" in nav, centrato verticalmente
  con il titolo (50vh, assumendo titolo sempre centrato via flexbox). Su
  mobile verticale (`<640px`, breakpoint `sm` già in uso nel resto della
  pagina) torna vicino al titolo invece che in alto isolato, con un
  piccolo gap sopra (offset calcolato in `vw`/`rem`, tarato a vista con
  screenshot Playwright — non è una misura dinamica via JS).
**Deliberatamente esclusi finora**: effetto "stage" sticky (titolo
coperto/scoperto), pin dell'intera sezione stile cubo Codrops, Lenis. La
scelta resta "il più semplice possibile per ogni incremento" — si
valuta se e cosa aggiungere in seguito.

### Titolo grande a overlay fisso, scroll-driven (implementato)

Sessione del 2026-08-19 (`/grill-me` + `/ponytail`), a partire
dall'analisi di una GIF di riferimento (`Area.gif`, portfolio
fashion-editoriale) di cui si è ripresa solo la meccanica del testo, non
lo sfondo/le immagini. Riusa il pattern di reveal mascherato del
contatore, ma come istanza **indipendente** (trigger e timing separati,
non sincronizzati con esso):

- Il titolo reale (`h1`/`h2` dentro ogni sezione/link) resta nel flusso
  per semantica, SEO e click/focus, ma è reso invisibile
  (`opacity-0`, mantiene lo spazio di layout). Il testo visibile è un
  overlay fisso e decorativo (`#title-overlay`, `aria-hidden`, centrato
  nel viewport) — stessa logica "reale invisibile in-flow + overlay
  decorativo" già usata per il contatore.
- Ogni titolo è spezzato in **frammenti che si alternano su/giù**: per
  un titolo multiparola (es. l'Hero "GRAZIANO ENZO MARCHESANI") ogni
  parola è un frammento — la prima sale, la seconda scende, un'eventuale
  terza (dispari) segue la prima (sale). Per una parola singola (Fields,
  Publications, Skills, About) la parola stessa è spaccata in due metà
  per numero di caratteri, arrotondando per difetto la prima metà (es.
  "ABOUT" → "AB" + "OUT", non "ABO" + "UT"); a riposo le due metà
  combaciano senza spazio visibile, il frammento si nota solo durante il
  movimento.
- **Coreografia sequenziale**, diversa dal crossfade simultaneo del
  contatore: l'uscita del frammento continua nella stessa direzione da
  cui era entrato (chi saliva continua a salire fuori schermo, chi
  scendeva continua a scendere) e solo **a uscita completata** parte
  l'entrata dei frammenti della sezione successiva.
- Trigger identico al contatore (`ScrollTrigger` `onEnter`/`onEnterBack`
  allo snap di sezione, non scrub continuo), ma istanza GSAP separata.
- L'Hero è incluso nello stesso ciclo (non è più un semplice `h1`
  statico): entra da solo al caricamento della pagina, poi esce con lo
  stesso meccanismo quando si scrolla verso Fields.
- Rispetta `prefers-reduced-motion`: nessuna animazione, swap testuale
  istantaneo.

### Freccia di invito allo scroll (implementato)

Sessione del 2026-08-19. La freccina "↓" sotto ogni titolo di sezione
(sempre `aria-hidden`, puramente decorativa — l'affordance reale resta
`aria-label` sull'`<a>`) non è più statica in-flow (visibile solo in
hover/focus): è un elemento `fixed`, sganciato dal layout per potersi
muovere liberamente senza essere trascinata passivamente dallo scroll
della pagina (comportamento esplicitamente giudicato controintuitivo).

- Si muove **proporzionalmente al gesto di scroll reale** (non un loop
  continuo/bounce a riposo): scrollando verso il basso si sposta verso
  il basso, scrollando verso l'alto si sposta verso l'alto e **ruota di
  180°** (torna a 0°, puntando in giù, tornando a riposo).
- Corsa massima **asimmetrica**: ~22% dell'altezza del viewport verso il
  basso, ~22% + 60px verso l'alto (su richiesta esplicita di una corsa
  più lunga in quella direzione).
- A scroll fermo (debounce 150ms) torna elasticamente alla posizione di
  riposo con ease-out (GSAP `quickTo`); visibile sia in hover sia
  durante lo scroll attivo (altrimenti l'animazione risulterebbe quasi
  sempre invisibile, dato che il mouse raramente resta fermo sul link
  mentre si scrolla).
- Rispetta `prefers-reduced-motion`: nessuna animazione, resta il solo
  comportamento hover/focus-only precedente.
- **Una sola freccia visibile alla volta** (fix bug del 2026-08-19: le
  frecce di sezioni diverse, essendo tutte `fixed` sovrapposte nello
  stesso punto, potevano restare visibili insieme durante il cambio
  sezione e sommarsi otticamente, apparendo sempre più scure). La
  freccia "attiva" cambia sezione solo quando quella corrente è
  **tornata a riposo** (opacità 0, dopo il proprio fade-out); se il
  cambio sezione avviene mentre la freccia è ancora in movimento, il
  passaggio alla successiva resta in coda e si applica al completamento
  del fade-out. Il movimento condiviso (y/rotazione, `quickTo` su tutto
  l'array di frecce) non va mai interrotto a forza: uccidere le tween
  del target sbagliato spezza l'animazione per tutte le frecce, non solo
  per quella da resettare.

### Sfondi decorativi delle sezioni (implementato)

Sessione del 2026-08-19 (`/grill-me`, 4 round + correzioni successive), a
partire dal generatore di pattern a nesting (`pattern-generator02.html`,
tool standalone creato in altra occasione) portato lato client in
`src/scripts/section-patterns.ts`: ogni sezione della home (Hero +
Fields + Publications + Skills + About) ha uno sfondo decorativo
generato e piazzato indipendentemente dalle altre.

- **Generazione a build-time, non più lato client** (cambiato in sessione
  2026-08-19 successiva: la generazione ad ogni caricamento era il collo
  di bottiglia — canvas + fino a 6000 tentativi di piazzamento per
  sezione bloccavano il thread principale). L'algoritmo (identico a
  prima: nesting a spirale, due passate, maschere pixel) vive ora in
  `scripts/pattern-algorithm.js` (script "piatto", nessun import/export)
  ed è iniettato via Puppeteer headless da `scripts/generate-patterns.mjs`
  in una manciata di **bucket** predefiniti (fasce di aspect ratio
  rappresentative: telefono verticale, tablet verticale, laptop,
  desktop, widescreen — vedi `BUCKETS` nello script) × 4 **varianti**
  per bucket (stesso algoritmo, seed diverso via PRNG mulberry32
  seedabile, non più `Math.random()`), per avere sfondi sempre diversi
  tra sezioni vicine senza doverli ricalcolare.
  - Output: SVG statici in `public/patterns/generated/` (non
    `src/assets/`: serviti as-is, non bundlati in JS) + `manifest.json`
    con bucket/dimensioni/variante/nome file.
  - A runtime (`src/scripts/section-patterns.ts`) non si calcola più
    nulla: si sceglie il bucket più vicino per aspect ratio (log-scala,
    non dimensioni assolute — le sezioni sono sempre `h-dvh`) e una
    variante (offset casuale per sezione stabile nella pagina, diverso
    a ogni reload), poi si fa `fetch()` del solo file scelto — mai
    `import.meta.glob` eager di tutti i bucket insieme, che gonfierebbe
    il bundle JS di ~1MB per ogni visitatore indipendentemente da cosa
    vede davvero.
  - **Il `manifest.json` invece è importato a build time, non
    `fetch`ato** (cambiato in sessione 2026-08-21): sono ~2KB di sola
    tabella nome/dimensioni, ma prenderli via rete costava un round
    trip intero *prima* di poter anche solo iniziare a scaricare l'SVG.
    La distinzione con gli SVG regge su un criterio solo — il manifest
    serve **sempre e tutto**, gli SVG servono in minima parte — quindi
    inlinare il primo e fetchare i secondi non è un'incoerenza.
  - **Auto-skip**: `generate-patterns.mjs` è agganciato a
    `astro:config:setup` (stesso pattern di
    `integrazione-pubblicazioni.mjs`) tramite hash sha256 delle 4 icone
    sorgente + dell'algoritmo in `manifest.json` — se non è cambiato
    nulla, non riapre Chromium ad ogni `npm run dev`/`npm run build`.
    Rigenerazione manuale forzata: `npm run patterns`.
  - **Ogni forma è definita una sola volta in `<defs>` e richiamata con
    `<use>`** per ogni piazzamento (non più markup del path duplicato a
    ogni copia): necessario perché la seconda passata piazza migliaia
    di copie piccole, e duplicare il path ovunque gonfiava ogni file a
    450KB+; con `<use>` ogni bucket/variante pesa 40-70KB.
  - **Coordinate arrotondate a 4 decimali** in fase di stampa del markup
    (sessione 2026-08-21): in unità viewBox 4 decimali sono ben sotto il
    subpixel a qualunque scala, quindi la resa non cambia, ma i 20 SVG
    passano da 952K a 800K complessivi (−16%). Elimina anche alla fonte
    la **notazione scientifica** che l'accumulo di errore in virgola
    mobile produceva ogni tanto (`translate(1.4210854715202004e-14,
    827.9)` invece di `translate(0, 827.9)`) — vedi il difetto
    corrispondente in "Morphing" sotto. Il piazzamento non cambia: il
    PRNG è seedato per bucket+variante e l'arrotondamento avviene dopo.
- **Solo le 4 forme del brand** già usate nella spirale di Fields
  (`src/assets/research|tools|projects|teaching.svg`, vedi
  [fields-spiral.md](fields-spiral.md)) — stesso mix, stesso peso (25%
  ciascuna) in tutte le sezioni. Se in futuro cambiano, si sostituiscono
  i file mantenendo lo stesso nome (poi va rilanciato `npm run patterns`
  per rigenerare gli SVG statici).
- **Due passate distinte** (non un'unica distribuzione dimensionale
  casuale): prima poche forme grandi (22-34% del lato corto della
  sezione), poi molte forme piccole (4.5-9% del lato corto) che
  riempiono i vuoti lasciati dalla prima passata, sulla stessa griglia
  di occupazione condivisa (nessuna sovrapposizione tra le due
  passate).
- **Colore pieno pre-mescolato, non `fill-opacity`** (cambiato in
  sessione 2026-08-19, vedi "Morphing" sotto per il motivo): ogni
  forma delle due passate ha un colore RGB pieno (`fill`), calcolato
  una sola volta come blend ink-su-paper alle opacità originarie (0.035
  passata grande, 0.07 passata piccola — stesso aspetto visivo di
  prima, stesso valore percettivo). Fonte unica del calcolo:
  `scripts/colors.mjs` (`blendOver(alpha)`), importato sia da
  `scripts/generate-patterns.mjs`/`pattern-algorithm.js` (Node) sia da
  `src/scripts/section-morph.ts` (bundle browser) — `--color-ink`/
  `--color-paper` in `src/styles/global.css` restano la fonte "di
  progetto", ma vanno tenuti allineati a mano perché il CSS non è
  importabile né da build script Node né dal bundle browser.
- **Bug trovato e corretto nello stesso cambio**: le 4 icone sorgenti
  (`research|teaching|projects|tools.svg`) hanno un colore baked-in su
  un path interno (`style="fill:rgb(28,25,23);"`), che sovrascrive
  qualunque `fill` ereditato dal `<use>` ancestor — invisibile finché
  quel colore veniva comunque "spento" da `fill-opacity`, ma con
  colore pieno vinceva il nero originale invece del colore calcolato,
  producendo uno sfondo nero pieno invece che pallido. Fix: il markup
  iniettato in `<defs>` viene ripulito da ogni `fill`/`fill:` baked-in
  (preservando `fill:none` sui rettangoli di clip-path) prima
  dell'uso, sia in `pattern-algorithm.js` sia in `section-morph.ts`.
- **Rotazioni a scatti di 45°/90°, mai libere.**
- **Nessuna collisione tra le forme**: l'algoritmo testa la sagoma reale
  (maschera pixel via canvas), non il bounding box — una punta può
  infilarsi nell'incavo di un'altra forma senza mai toccarla. Verificato
  a livello di pixel con uno script Playwright ad-hoc (rasterizzazione
  isolata di ogni pezzo su un accumulatore): overlap reale nullo (un
  solo pixel di anti-aliasing su ~975k pixel coperti, non una vera
  sovrapposizione).
- **Cache delle maschere rasterizzate** per combinazione (forma,
  dimensione arrotondata a 3px, rotazione): con rotazioni discrete e
  range di dimensione ristretto il riuso è alto, necessario per tenere
  il tempo di generazione entro limiti accettabili lato client.
- **Non bloccante**: titolo/nav/interattività restano immediati come
  prima; i pattern (ora solo `fetch()` di file statici, zero calcolo)
  vengono richiesti subito dopo il load e compaiono con dissolvenza
  (~300ms) quando arrivano, rispettando `prefers-reduced-motion`
  (comparsa istantanea in quel caso).
- **Gli sfondi non aspettano GSAP** (cambiato in sessione 2026-08-21).
  `initSectionPatterns()` era importato nello stesso `<script>` di
  `gsap` + `ScrollTrigger`: ~112KB che dovevano scaricarsi *ed
  eseguirsi* prima che il browser chiedesse il primo byte di SVG, pur
  non servendo a nulla per gli sfondi. Ora `PaginaHome.astro` ha un
  secondo `<script>`, messo deliberatamente **per primo** perché gli
  script module vengono eseguiti nell'ordine del documento: quello
  degli sfondi parte appena arriva il suo chunk (55 byte di entry +
  2.9KB di `section-patterns`, zero GSAP). Lo script GSAP raccoglie il
  lavoro già in volo tramite `prefetchSectionPatterns()` /
  `sectionPatternsReady()`, così `initSectionMorph()` e
  `ScrollTrigger.refresh()` partono nello stesso momento logico di
  prima. **L'handler di resize chiama invece `initSectionPatterns()`
  diretta**, mai l'handoff: deve sempre ripescare il bucket per la
  nuova larghezza.
  - **Misurato**, non stimato (Chrome headless, cache vuota, Fast 3G a
    150ms di RTT, mediana su 5 run, baseline ottenuta con `git stash`):
    la richiesta del primo SVG parte a **6963ms invece di 9614ms** e
    arriva a 8167ms invece di 10408ms. **~2.25s in meno** a freddo
    prima che lo sfondo cominci ad apparire; a cache calda resta solo
    la dissolvenza di 300ms, invariata. La catena passa da
    `HTML → 112KB JS → manifest → SVG` a `HTML → 3KB JS → SVG`.
  - Il ritardo percepito dall'utente era **quasi tutto rete, non la
    dissolvenza**: i 300ms scritti nel codice sono la coda, non la
    causa. Restano intatti — su richiesta esplicita dell'utente
    l'intervento doveva toccare le prestazioni e **nulla** di ciò che
    si vede.
- **Reinizializzazione completa su resize** (cambiato in sessione
  2026-08-20, vedi sotto "Fix resize"): non più statico al load.
- **Gotcha CSS trovato e corretto**: un primo tentativo con `-z-10`
  sull'SVG di sfondo lo rendeva invisibile — un discendente a z-index
  negativo finisce dietro lo sfondo opaco di `<body>` quando la sezione
  non stabilisce un proprio stacking context. Fix: `z-0` esplicito sulla
  sezione/link oltre a `relative`.
- **Bug di sovrapposizione trovato e corretto**: mancava l'offset di
  compensazione (`D` nel tool originale) tra rotazione-attorno-al-centro
  (usata per calcolare maschera/bbox di collisione) e
  rotazione-attorno-all'origine (comportamento reale del `rotate` SVG
  nel transform di render) — senza quell'offset le forme renderizzate
  non coincidevano con quelle stampate sulla griglia di occupazione ed
  apparivano sovrapposte.

### Morphing per movimento tra gli sfondi delle sezioni (implementato)

Sessione del 2026-08-19, a partire da una domanda esplorativa
dell'utente ("gli elementi del primo sfondo possono spostarsi fino a
comporre lo sfondo della sezione successiva?"). Validato prima con un
prototipo throwaway (`/prototype-morph-scroll`, 3 varianti di
coreografia — poi rimosso da main), scelta la variante **A — diretto**
(linea retta, rotazione/scala lineari, nessuna sosta/overshoot) su
domanda diretta all'utente. Portato su **tutti** i confini tra sezioni
della home (non solo Hero→prima sezione), non solo un sottoinsieme di
icone: `src/scripts/section-morph.ts`, richiamato da `index.astro`
dopo `initSectionPatterns()` (deve leggere le icone già piazzate).

- **Attivo solo su desktop** (deciso in sessione 2026-08-21, su
  richiesta esplicita dell'utente dopo tre tentativi di correzione dei
  difetti su mobile). Il guard è `(prefers-reduced-motion: reduce),
  (pointer: coarse)`: `pointer: coarse` distingue il **dispositivo**,
  non la finestra, così un desktop con la finestra stretta conserva
  l'animazione mentre telefoni **e tablet** ne restano fuori. Su touch
  non viene creato nessun overlay e le icone di sfondo restano tutte
  visibili: la grafica statica è identica, manca solo il volo. Motivo:
  su touch il costo per frame è più alto e la barra URL che appare e
  scompare cambia `dvh` durante lo scroll, quindi le icone volanti
  rischiano di non combaciare con quelle statiche all'arrivo.
- Solo la passata **"big"** dei pattern (~30-50 icone a sezione),
  **tutte**, non un campione fisso: includere
  anche la passata "small" (250-400 icone a sezione) è stato provato e
  scartato, centinaia di icone semitrasparenti sovrapposte durante il
  volo sommano opacità e trasformano lo sfondo in una nebbia grigia che
  rende illeggibile il testo sopra.
- Le icone volanti vivono in un **overlay `position:fixed`** separato
  dalle sezioni, non annidate nell'SVG di sezione: un elemento lì
  scrollerebbe via insieme alla sezione invece di restare in scena
  durante la transizione.
- **I cloni sono `<div>` HTML, non `<use>` SVG** (cambiato in sessione
  2026-08-21, per il vincolo di fluidità): forma data da `mask-image`
  del file icona (`?url`, quindi 4 file veri in cache di browser e
  niente markup inline) e trama da `background-image` con la tile del
  pattern come data-URI. Un `fill="url(#pattern)"` dentro una forma che
  ruota e scala è il caso peggiore per il rasterizer — ri-tiling
  completo a ogni frame, nessuna composizione GPU — mentre
  maschera + background lascia comporre al browser un layer già
  rasterizzato, rendendo il transform sostanzialmente gratuito. GSAP
  anima direttamente `x/y/rotation/scale` con `transformOrigin: '0 0'`
  invece di riscrivere l'attributo `transform` dell'SVG a ogni frame.
  La grafica non cambia: la maschera **è** l'icona sorgente e le tile
  sono le stesse di prima.
- **Bug trovato e corretto**: la posizione di arrivo non si può
  leggere con `getBoundingClientRect()` sull'icona di destinazione,
  perché al momento del setup quella sezione è ancora fuori viewport —
  il rect letto sarebbe quello "scrollato via". Si legge invece il
  `transform` già presente nell'SVG generato e lo si usa **tale e
  quale, in unità viewBox**: la conversione in pixel non avviene mai
  per icona, la fa **una volta sola** il transform di un `<div>`
  "stage" che riproduce `xMidYMid slice` (scala per coprire, poi
  centra). Struttura scelta in sessione 2026-08-21 al posto delle
  coordinate in pixel congelate al setup: un cambio di viewport ora
  aggiorna una sola scrittura di stile invece di invalidare decine di
  coordinate. Lo stage ascolta `resize` **e** `visualViewport.resize`,
  quindi anche le variazioni di sola altezza. Verificato con Puppeteer:
  scarto clone↔icona di destinazione 0.0-0.5px.
- **Bug trovato e corretto**: ruotare il clone "attorno al centro"
  (default CSS/GSAP) lo disallinea dal resto del pattern a ogni angolo
  diverso da 0°/180°, perché l'algoritmo ruota ogni icona attorno alla
  propria **origine locale**, non al centro — il clone deve replicare
  esattamente la stessa composizione `translate → rotate → scale`.
- **Bug trovato e corretto ("fantasmi ovunque")**: le coordinate di un
  clone sono locali alla sua sezione, valide solo mentre quel preciso
  confine è a schermo. Ogni confine ora nasconde/mostra icone
  originali e clone in base al **progress del proprio ScrollTrigger**
  (finestra attiva `0 < progress < 1`), non staticamente al setup —
  altrimenti ogni clone restava visibile sovrapposto a qualunque
  sezione si stesse guardando in quel momento.
- **Bug trovato e corretto — notazione scientifica nei transform**
  (sessione 2026-08-21): un `transform` su 181 usava la forma
  `translate(1.4210854715202004e-14, 827.98…)`. Il pattern di numero
  usato per rileggerli (`[-\d.]+`) non riconosce l'esponente, e
  `parseTransform` in quel caso **non falliva**: restituiva
  `tx: 0, ty: 0`, buttando via anche la coordinata valida e spedendo
  quell'icona a volare da/verso l'angolo in alto a sinistra. Poiché la
  variante di ogni sezione è scelta con offset casuale a ogni reload,
  l'icona rotta cambiava sezione a ogni caricamento. Corretto su due
  fronti: il pattern di numero ora accetta l'esponente e un transform
  illeggibile fa **saltare la coppia** invece di restituire uno zero
  silenzioso; e il generatore non produce più notazione scientifica
  (vedi "Coordinate arrotondate" in "Sfondi decorativi" sopra).
- **Proprietà unica della visibilità degli originali** (rifatta in
  sessione 2026-08-21). Un'icona è "arrivo" del confine *i* e
  "partenza" del confine *i+1*: finché ogni confine scriveva l'opacità
  dei propri originali, a riposo i due si contraddicevano (uno le
  voleva a 0, l'altro a 1) e vinceva chi aggiornava per ultimo —
  difetto intermittente, dipendente dal verso dello scroll e mai
  visibile sull'ultimo confine, che non ha un vicino a destra. Ora gli
  originali sono **visibili di default** e un solo indice `flying` a
  livello di pagina dice quale confine sta volando; solo quello
  nasconde le sue due schiere e mostra i suoi cloni. Ne vola uno alla
  volta, perché le finestre dei confini sono contigue e non si
  sovrappongono.
- **Texture a pattern vettoriali delicati persistenti sulle forme grandi (sia a riposo che in volo)** (sessione 2026-08-21, su richiesta dell'utente per dare tridimensionalità, texture e visibilità agli elementi dello sfondo senza appiattirli):
  - Invece di un riempimento solido piatto, tutte le forme grandi (sia negli SVG di sfondo statici pregenerati sia nei cloni in volo) adottano una trama geometrica discreta e finissima definita in `<defs>` con pattern SVG:
    - **Shape 0 (Research)**: pois regolari a griglia (`pat-0` / `morph-pat-0`, passo 20px, cerchi `r=2`).
    - **Shape 1 (Teaching)**: puntini sfalsati a quinconce (`pat-1` / `morph-pat-1`, passo 24px, cerchi `r=1.8`).
    - **Shape 2 (Projects)**: righette oblique a 45° (`pat-2` / `morph-pat-2`, passo 16px, spessore `1.5px`).
    - **Shape 3 (Tools)**: righette oblique a -45° (`pat-3` / `morph-pat-3`, passo 16px, spessore `1.5px`).
  - Dalla sessione 2026-08-21 le tile dei **cloni in volo** non sono più
    `<pattern>` SVG in `<defs>` ma le stesse tile serializzate come
    `background-image` data-URI dei `<div>` mascherati (vedi `TILES` in
    `section-morph.ts`): markup identico, resa identica, ma nessun
    ri-tiling per frame. Gli SVG di sfondo **statici** continuano a usare
    i `<pattern>` `pat-0..pat-3`, che lì non costano nulla perché non si
    muovono.
  - **Colori calibrati sulla palette paper/ink**: sfondo del pattern sul colore di base `BIG_COLOR` (`blendOver(0.035)`) e tratti/puntini in inchiostro tenue (`PATTERN_INK_COLOR = blendOver(0.12)`). Il risultato stacca le forme con raffinatezza ed eleganza senza appesantire visivamente il testo soprastante né creare discontinuità a fine animazione.
- **Nessuna transizione sullo scambio originale↔clone** (tolta in
  sessione 2026-08-21). La dissolvenza di 200ms serviva a camuffare il
  salto prodotto dalle soglie larghe, ma peggiorava le cose: due copie
  della stessa forma al 50% di opacità **non** compongono la copia
  piena (queste forme stanno a 0.035 di alpha), quindi si vedeva un
  doppio fantasma più chiaro, e su scroll veloce una dissolvenza veniva
  interrotta dalla successiva lasciando le icone a opacità intermedia.
  Con le soglie strette il clone parte esattamente sopra l'icona che
  sostituisce e lo scambio istantaneo è invisibile.
- **Soglie di scambio strette** (`START_THRESHOLD = 0.004`,
  `END_THRESHOLD = 0.996`). Servono a non lasciare i cloni visibili a
  riposo quando lo scroll-snap subpixel (mobile, Brave su Android) fa
  fermare il progress a 0.0001 invece che a 0 — ma vanno tenute
  **piccole**, perché nell'istante dello scambio il clone è già
  `soglia × lunghezza del volo` lontano dall'icona che sostituisce.
  Le soglie larghe usate prima (0.04/0.96) erano la causa del difetto
  più vistoso: misurato con Puppeteer su schermo 412×915, volo mediano
  ~300-390px e massimo ~800px, quindi **ogni icona saltava di 11-16px,
  fino a 32px, in un frame, due volte per confine**. Una sezione di
  mezzo subiva lo scatto d'arrivo e subito dopo quello di partenza,
  mentre la prima ha solo la partenza e l'ultima solo l'arrivo — da cui
  il sintomo riportato dall'utente, "rotto su tutte tranne la prima e
  l'ultima". A 0.004 il salto è di 1-3px.
- Rispetta `prefers-reduced-motion` (nessun morph, pattern statici
  come oggi); stesso guard di `pointer: coarse`, vedi sopra.
- **Da `fill-opacity` a colore pieno pre-mescolato** (sessione
  2026-08-19, segnalato dall'utente: "salto di colore" percepito
  durante lo scroll): centinaia di icone semitrasparenti (sia le due
  passate statiche di sezione sia i cloni volanti sovrapposti durante
  il volo) sommavano opacità dove si toccavano, producendo macchie più
  scure/una nebbia grigia non presente a riposo. Fix strutturale, non
  un ritocco numerico: ogni forma ha ora un colore RGB pieno
  equivalente (stesso valore percettivo di prima, vedi sezione "Sfondi
  decorativi" sopra), quindi dove due forme si sovrappongono vince
  semplicemente quella disegnata sopra — nessuna somma, nessun salto.
  Conseguenza accettata esplicitamente dall'utente: nei punti di
  overlap si perde il lieve "addensamento" che c'era prima, in cambio
  di coerenza cromatica assoluta durante lo scroll.

### Fix resize (pattern di sfondo + morph)

Sessione di `/grill-me` + `/ponytail` del 2026-08-20, a partire da un bug
segnalato dall'utente: dopo un ridimensionamento della finestra, gli
sfondi decorativi e il morph tra sezioni restavano rotti (icone volanti
che atterravano nel punto sbagliato) finché non si ricaricava la pagina
per intero. Causa: sia `section-patterns.ts` (bucket/viewBox) sia
`section-morph.ts` (viewBox dell'overlay, trasformazioni px di ogni
icona) calcolavano tutto **una sola volta** su `window.innerWidth/Height`
al setup, senza alcun listener di resize.

- **Strategia scelta**: reinizializzazione completa e debounced (200ms)
  su `resize`, non ricalcolo live in-place — `PaginaHome.astro` richiama di
  nuovo `initSectionPatterns()` + `initSectionMorph()` da zero invece di
  duplicare la matematica delle trasformazioni in un secondo percorso
  "update". Costo di ricreare gli SVG giudicato basso (pochi elementi).
- **Guardia anti-falso resize su mobile** (sessione 2026-08-21): sui browser mobili (es. Chrome Android su Pixel 7), lo scorrimento verso l'alto fa riapparire la barra degli indirizzi espandendo il viewport in altezza e scatenando un evento `resize` spurio che distruggeva e ricreava il morph e i pattern a metà swipe. Aggiunto controllo `if (window.innerWidth === lastWidth) return;` che ignora le variazioni di sola altezza dovute alla barra URL e scatta solo su reale ridimensionamento orizzontale o cambio orientamento (portrait ↔ landscape). Dalla sessione 2026-08-21 questa guardia resta com'è — la ricostruzione completa è cara e va evitata — ma il morph non dipende più da lei per la geometria: lo stage ha un proprio listener che ascolta anche i cambi di sola altezza e costa una scrittura di stile (vedi "Morphing" sopra).
- **`initSectionMorph()` reso self-cleaning** per rendere sicura la
  richiamata ripetuta: rimuove il proprio overlay precedente
  (`[data-section-morph-overlay]`) e uccide i propri `ScrollTrigger`
  precedenti (id `section-morph-${i}`) prima di ricostruire — altrimenti
  ogni resize accumulava overlay/trigger fantasma che continuavano a
  scrivere transform su elementi ormai rimossi dal DOM.
- **Gestione robusta timeline titoli e trigger simmetrici** (sessione 2026-08-21):
  - Uccisione sistematica della timeline `currentTitleTimeline.kill()` a ogni cambio di passo per evitare che animazioni uscenti ed entranti si sovrappongano o lascino frammenti troncati a scatto durante swipe rapidi o cambi direzione.
  - Sincronizzati i confini di `ScrollTrigger` tra Hero (sezione 0, impostato a `start: 'top top', end: 'bottom center'`) e le altre sezioni (`start: 'top center', end: 'bottom center'`), rendendo il punto di scatto verso l'alto perfettamente simmetrico (a metà schermata) rispetto allo scorrimento verso il basso.

## Publications page (v1, implementata)

- **Layout a colonna singola con Watermark Sticky, su tutte e 5 le liste della pagina** (Publications, Software, Datasets & Reports, Dissemination & Outreach, Peer Review Activities — estesa alle ultime 4 in sessione 2026-08-20, inizialmente solo sulla prima): per ogni anno, la cifra monumentale in font Anton (`clamp(10.5rem, 34vw, 24rem)` a `text-ink/[0.045]`) è ancorata come **sticky background** a `top-16` (tramite CSS Grid overlap `col-start-1 row-start-1`). Rimane fissa in secondo piano durante lo scorrimento delle voci di quell'anno, per poi essere spinta verso l'alto dall'arrivo dell'anno successivo. Il piccolo anno testuale a sinistra di ogni voce (colonna `md:grid-cols-[7rem_1fr]`) è stato rimosso ovunque, sostituito dalla filigrana. Raggruppamento per anno centralizzato in `raggruppaPerAnno()` (`src/lib/pubblicazioni.ts`), con una funzione `*PerAnno()` dedicata per ciascuna lista (`perAnno`, `revisioniPerAnno`, `softwarePerAnno`, `datasetPerAnno`, `attivitaPerAnno`). Nota tecnica: i wrapper anno di queste 4 liste extra usano la classe `anno-rev` (non `anno`), perché la regola CSS che nasconde un anno completamente filtrato è legata a `.voce` e si applica solo alla prima lista (che ha i filtri per tipo pubblicazione).
- **Barra Filtri borderless nel flusso con Maschera a Sfumatura Dinamica**: posizionata sotto l'header (non sticky, scorre via con la pagina per non rubare spazio su smartphone), priva di bordi rigidi (`bg-paper/80`), tipografia unificata alla nav/contatore (`text-xs uppercase tracking-widest tabular-nums font-sans`) e perno dinamico scuro a scorrimento fluido (`data-filtri-perno`).
  - **Affordance di scorrimento orizzontale su mobile**: la barra applica una maschera CSS `linear-gradient` (`webkitMaskImage` / `maskImage`) con dissolvenza di `2.75rem` calcolata dinamicamente sullo scroll (`scrollLeft > 2px`). All'inizio sfuma solo a destra indicando la presenza di altri filtri; durante lo scorrimento sfuma speculare sia a sinistra che a destra; a fine corsa la sfumatura destra si dissipa. Al tap su un filtro parzialmente visibile viene eseguito lo scroll automatico (`scrollIntoView({ inline: 'nearest' })`).
- **Profili esterni compatti su mobile**: la riga dei profili ("PROFILES: ORCID ↗ IRIS UNICAM ↗ GITHUB ↗") adotta spaziatura e tipografia dedicate (`text-[11px] sm:text-xs`, `gap-x-2 sm:gap-x-6`, `tracking-normal sm:tracking-wider`) per garantire che l'intera sequenza resti sempre su una sola riga senza andare a capo su qualsiasi smartphone (inclusi Pixel 7 e dispositivi con viewport stretto fino a 340px).
- **Filtro trasversale per anno via clic sulla filigrana** (implementato sessione 2026-08-20, `/ponytail`): cliccare la cifra monumentale di un anno filtra **tutte e 5 le liste** a quell'anno soltanto, ignorando temporaneamente il filtro per categoria (che viene ripristinato tale e quale all'uscita). Le sezioni senza alcun record in quell'anno (es. Software se non ha nulla nel 2021) spariscono per intero, titolo compreso — non solo i loro blocchi-anno, per non lasciare intestazioni vuote a schermo. Uscita: ricliccare lo stesso anno, cliccare un anno diverso, o cliccare in un'area vuota della pagina.
  - **Il filtro per tipo si mostra sempre come "All" mentre quello per anno è attivo** (fix sessione 2026-08-20, su segnalazione dell'utente con screenshot: un tipo restava visivamente premuto — es. "Monographs" — pur essendo ignorato sotto, un paradosso percepibile). All'entrata in modalità anno: il perno scivola su "All" e gli altri bottoni tipo si ritraggono fluidamente (`opacity`/`max-width` in transizione CSS, classe `filtro--nascosto-anno`), restano inerti al click. All'uscita: si ripristina il tipo selezionato in precedenza (`tipoSalvatoPerAnno`), i bottoni si riespandono e il perno li raggiunge solo a espansione completata (delay temporizzato sulla stessa durata della transizione CSS, altrimenti `offsetWidth` letto a metà transizione dà una larghezza provvisoria e il perno collassa a 0). Verificato con Puppeteer: stato finale corretto anche con doppio toggle rapido, nessun errore console.
  - Nessuna nuova struttura dati: i blocchi `.anno`/`.anno-rev` già raggruppati per anno bastano, si nascondono/mostrano via `classList` + `hidden` diretto sull'elemento (mai un secondo trucco CSS `!important` in conflitto con quello di Tailwind, vedi bug sotto).
  - **Fallthrough del clic verso la filigrana**: i blocchi `<li>` delle voci sono elementi block-level a piena larghezza (coprono anche lo spazio "vuoto" a fianco del testo breve), quindi intercettavano il clic anche dove visivamente sembrava esserci solo lo sfondo. Fix standard: contenuto delle voci a `pointer-events: none`, riattivato solo su `a`/`button` reali — non serve alcun `elementFromPoint` custom, il normale hit-testing del browser fa il resto.
  - **Bug trovato e corretto**: un primo tentativo forzava la ri-visibilità delle voci nascoste dal filtro-categoria con una regola CSS `!important` (`body[data-filtro-anno] .voce[hidden]{display:list-item!important}`), che perdeva sempre contro `[hidden]{display:none!important}` di Tailwind. Causa: quella regola di Tailwind vive dentro un `@layer`, e per le dichiarazioni `!important` gli stili *non* layerizzati hanno priorità **più bassa** di quelli in layer (l'inverso della cascata normale) — uno stile scoped Astro fuori da qualunque `@layer` perde sempre contro un `!important` layerizzato, indipendentemente da specificità/ordine. Fix: gestita la visibilità via JS diretto sull'attributo `hidden` (stessa funzione di riapplicazione del filtro-categoria, riusata sia dal bottone di categoria sia all'uscita dal filtro-anno), niente più trucchi `!important` per questo scopo.
- **Transizione morbida del filtro per anno** (sessione 2026-08-20, su richiesta dell'utente: lo scurimento dell'anno e la ricostruzione della pagina non dovevano più avvenire "di scatto"). Nessuna dipendenza aggiunta: Web Animations API a mano, non GSAP — `/publications` non carica GSAP e va tenuta leggera. Tre ingredienti:
  - **Morphing di colore** della filigrana selezionata: transizione CSS `color 480ms` su `.anno__watermark` (lo stato premuto resta `color-mix(... 12% ...)`, cambia solo il modo in cui ci si arriva).
  - **Due battute, non una**: prima ciò che esce si dissolve (150ms) mentre è **ancora in flusso** — così non si sovrappone mai testo a testo — poi si muta il DOM e i superstiti scivolano al nuovo posto in **FLIP** (400ms, `cubic-bezier(0.22,1,0.36,1)`), mentre chi entra compare in dissolvenza. Totale ~550ms.
  - **Ancoraggio dello scorrimento**: dopo la mutazione la pagina si accorcia di molto e il browser tronca lo `scrollY`, facendo saltare tutto sotto il cursore. Si ri-ancora il blocco dell'anno in gioco alla sua posizione a schermo precedente (misurata a `scrollBy` istantaneo).
  - Verificato con Playwright headless: nessun residuo di transform/opacity, transizione deterministica con fallback per `prefers-reduced-motion`.

- **Tasto Citazione (TastoCitazione.astro)**:
  - Su **desktop** (≥ 640px): capsula pillola che all'espansione cresce orizzontalmente verso sinistra a fisarmonica (`grid-template-columns: 0fr ↔ 1fr`), rivelando i 5 stili (APA, MLA, Harvard, Chicago, BibTeX) accanto al trigger.
  - Su **mobile** (< 640px): per evitare troncamento o overflow a sinistra oltre il bordo dello schermo, i 5 formati compaiono in un popover fluttuante pill-shaped ancorato a destra sotto al trigger (`position: absolute; right: 0; top: calc(100% + 6px); bg-paper/95 backdrop-blur-md border border-ink/14 shadow-lg`).
  - **Copia universale & Fallback HTTP LAN**: fallback `document.execCommand('copy')` con textarea off-screen temporanea per garantire la copia anche in contesti non sicuri (es. test via LAN Wi-Fi `http://<ip>:4321` con `--host` su iOS/Android dove `navigator.clipboard` è `undefined`). Tooltip di feedback posizionato superiormente al pulsante cliccato.



## About page (v1, implementata)

- **Layout editoriale asimmetrico a 2 colonne**: a sinistra il ritratto (`astro:assets` con finitura grayscale a contrasto, perfettamente calibrato sulla palette monocromatica), la biografia strutturata in 5 paragrafi e il pulsante d'azione per il download del CV (con stato disattivato elegante finché il documento pubblico non è disponibile in `public/`); a destra la sequenza dei record storici suddivisa in *Positions & Research Appointments* (con indicatore pillola scura `Current` per l'incarico attivo), *Education & Qualifications* (con esito/voto e tesi di laurea/dottorato) e *Awards & Competitions*.
- **Header monumentale e profili**: titolo in font display Anton, occhiello di localizzazione ("About Me · Ascoli Piceno, Italy"), qualifica e affiliazione accademica per esteso, affiancati dai collegamenti orizzontali unificati a tutti i profili di ricerca (ORCID, IRIS, GitHub) e social (LinkedIn, Instagram).

## Skills page (v1, implementata)

- **Mazzo di carte 3D GSAP-driven (Stack + Ventaglio)**: il palco superiore presenta un mazzo impilato ad altezza fissa (`clamp(24rem, 50vw, 42rem)` con `isolation: isolate`). A riposo, la rotellina o il touch sopra il palco permettono di sfogliare fluidamente le 32 carte con interpolazione GSAP `quickTo` (senza intrappolare lo scroll ai confini). Al click su una carta, si attiva la modalità ventaglio con espansione a raggiera ellittica a spaziatura uniforme d'arco (`angoliAdArcoUniforme`), mettendo in risalto la carta centrale e le sue competenze collegate e sfumando le altre. Chiusura dolce al click sulla carta centrale, all'esterno, con tasto Escape o alla ripresa dello scroll.
- **Declinazione Paper & Ink minimale**: carte con base panna/paper, bordi sottili `border-ink/14`, tipografia Anton per i titoli e il numero di legami, indicatore di categoria in mono uppercase, e inversione selettiva a fondo scuro (`bg-ink text-paper`) per la carta centrale attiva nel ventaglio.
- **Glossario editoriale a 3 famiglie**: sezione inferiore strutturata per famiglie (*Computing & building tools*, *Measuring the environment*, *Representing & sharing*) e relative 11 categorie con tutte le 32 descrizioni estese per massima accessibilità e indicizzazione SEO.
- **Nessun conteggio numerico (Decisione)**: non mostrare conteggi quantitativi di competenze o categorie (es. "36 COMPETENZE · 11 CATEGORIE") nell'header o nell'interfaccia. L'utente esplora i contenuti scorrendoli visivamente nel mazzo e nel glossario sottostante; i totali numerici aggiungono solo rumore informativo superfluo.

## Ricerca Semantica & Command Palette (v1, implementata)

- **Palette monocromatica rigorosa (Ink/Paper)**: il modale (`SearchModal.astro`) rispetta integralmente la regola dei due soli colori senza alcun accento cromatico.
  - Nessun indicatore di stato del motore nella barra: rimosso il 2026-08-21 (tre tonalità di grigio senza legenda non comunicavano nulla). Lo stato compare solo quando la ricerca è degradata, vedi [stack.md](stack.md).
  - Nessun colore di stato verde/arancione: l'interfaccia resta coerente con la natura sobria ed elegante del resto del sito.
- **Scorciatoia adattiva per OS**: rileva il sistema operativo lato client — mostra `⌘K` su macOS/iOS e `Ctrl K` su Windows/Linux, sia nel pulsante in navbar sia nella scorciatoia da tastiera.
- **Minimizzazione del carico visivo (`/ponytail`)**:
  - Nessuna percentuale numerica visibile a schermo nei risultati (la graduatoria è già intrinsecamente ordinata per rilevanza semantica/lessicale decrescente). La percentuale esiste solo nel `title` e nel testo `sr-only` del pallino di affinità, qui sotto.
- **Pallino di affinità semantica per risultato** (2026-08-22, proposto dall'utente): un cerchio di 8px a sinistra del badge di categoria. **Assente** = il risultato viene da una corrispondenza letterale, il modello non ha avuto voce in capitolo. **Presente** = il modello ha riconosciuto il senso della domanda, e quanto è pieno dice quanto ne era sicuro: inchiostro pieno sopra 0.55, a fil di ferro a 0.30 dove comincia il rumore (`fill-opacity` da 0 a 1, `stroke-opacity` fissa a 0.45 — solo `ink`, nessun accento, coerente con la regola dei due colori).
  - **Misura l'affinità coseno assoluta, non il ranking**, contro la richiesta iniziale dell'utente e con il suo assenso: `punteggio` è relativo al miglior risultato, quindi il primo pallino sarebbe *sempre* nero, anche su una query che non ha trovato niente di buono — il segno dichiarerebbe certezza dove non ce n'è. Conseguenza accettata: un risultato in quarta posizione può avere il pallino più pieno del primo, perché il primo è in cima anche grazie all'evidenza letterale.
  - **Lo spazio è riservato anche quando il pallino non c'è**, altrimenti i titoli slittano di 14px da una riga all'altra a seconda del motore che li ha trovati.
  - **Accessibilità**: l'opacità da sola violerebbe WCAG 1.4.1, quindi ogni pallino porta `title` e testo `sr-only` con etichetta e percentuale. Le etichette stanno in `testi.ts` e arrivano al client via `data-*` sul contenitore dei risultati, per non imbarcare l'intero dizionario nel bundle.
  - **Si è già ripagato**: è stato il pallino a rendere visibile che le query per anno pescavano sempre lo stesso documento dal semantico (vedi [stack.md](stack.md)). Senza il segno, quel risultato sembrava solo un po' strano.
  - Badge lingua solo in modalità fallback: quando l'utente naviga in italiano, le schede mostrano un discreto badge `EN` esclusivamente per quegli articoli che non hanno una traduzione italiana, mentre non mostrano alcun badge superfluo per i contenuti regolari.

## Pagine articolo di Fields (v1, implementata)

Sessione 2026-08-22 (`/grill-me` + `/ponytail`). Riguarda la *cornice* delle
quattro pagine di dettaglio (research, tools, teaching, projects); per cosa
può stare *dentro* il corpo dell'articolo vedi [blocchi-articoli.md](blocchi-articoli.md).

- **Filigrana del simbolo di categoria a tutta pagina** (`FieldSimbolo.astro`): lo stesso SVG che la spirale usa in 3D (`src/assets/{research,tools,teaching,projects}.svg`) compare come sfondo dell'articolo, alto quanto il viewport e **tagliato** da un angolo dello schermo. È la traduzione, per Fields, della filigrana dell'anno di Publications: stessa opacità `0.045` su `--color-paper`, stesso `z-0` con il contenuto che sale a `z-10`. La differenza è che qui è `fixed`, non `sticky`: lo sticky di Publications serve perché gli anni si susseguono in colonna, mentre un articolo ha una sola categoria e niente da cui staccarsi.
- **Un angolo per categoria**: research in basso a sinistra, tools in basso a destra, teaching in alto a destra, projects in alto a sinistra. È l'ordine di `FIELD_CATEGORY_ORDER` percorso in senso antiorario come in `helixPoint`, ancorato al basso-sinistra scelto dall'utente per research. Convenzione arbitraria ma ricostruibile: serviva perché nella spirale la posizione angolare di un marker viene dalla data (`yearFraction`), **non** dalla categoria — il modello a "quadranti fissi" descritto nel commento di `src/data/fields.ts` non è più quello che il codice applica.
- **Puramente decorativa**: `aria-hidden`, `pointer-events: none`. A differenza dell'anno di Publications non è un filtro cliccabile — un bersaglio alto un viewport sopra il testo dell'article è una trappola, e il ritorno a Fields è già coperto da `BackToFieldsButton`.
- **Nessuna animazione e nessuna variante mobile**: a `0.045` di opacità un fade-in non lo vedrebbe nessuno ma andrebbe tenuto sincronizzato per sempre con `FieldTransitionOverlay`; e la stessa regola vale identica sotto i 640px, dove la filigrana non compete con nulla. Essendo `fixed` resta dietro anche a nav e footer, accettato.
- **Solo sulle quattro pagine di dettaglio**: non su `/fields` (dove la spirale mostra già gli stessi simboli in 3D, e sovrapporne una versione piatta è rumore), non sulle pagine di tag (multi-categoria: non esiste un simbolo giusto), non su Publications.
- Gli SVG hanno proporzioni diverse (research e tools verticali, teaching e projects quadrati): dentro il box quadrato `h-screen w-[100vh]` i verticali sbordano un po' meno. A quell'opacità è invisibile e non è stato compensato.

### Impaginato editoriale "Marginalia scientifica" (2026-08-27)

Il corpo dell'articolo non è più una colonna unica `max-w-2xl` con testo,
immagine a piena larghezza, altro testo. Direzione validata in un canvas
`/design` (cinque alternative editoriali esplorate, scelta la "E · Marginalia
scientifica" — da rivista scientifica; le altre quattro — colonna e margine,
doppia pagina, griglia modulare, fascia e figura — scartate).

- **Nuovo guscio condiviso `FieldArticleLayout.astro`**: assorbe l'`<html>`
  che prima era duplicato nelle quattro `PaginaXxxDettaglio.astro`, ora thin
  wrapper che passano solo i pezzi category-specific via props + slot (`tag`,
  `meta`, default = `<Content />`). `FieldSimbolo`, `Nav`, `Footer`,
  `FieldTransitionOverlay`, `FieldArticleNavigation`, `TastoCondividi` vivono
  qui una volta sola.
- **Tre colonne su desktop (`@media (min-width: 1180px)`)**: indice sticky a
  sinistra (176px) · corpo al centro (`minmax(0, 40rem)`) · note a margine a
  destra (232px), `column-gap: 44px`, shell centrata. Sotto 1180px: colonna
  unica, indice in un `<details class="field-toc">`, note in fondo
  all'articolo. Articolo **senza `<h2>`** → `:has(.field-rail)` fa tornare la
  shell a colonna unica centrata invece di lasciare le tracce laterali vuote.
- **Indice** dagli `headings` di `render(entry)` (Astro inietta gli `id` sugli
  `<h2>`; l'`<h2> Footnotes` di remark-gfm, slug `footnote-label`, è filtrato).
  Scroll-spy via `IntersectionObserver` (classe `is-on`, `font-weight: 600`).
  Sotto, **miniature** delle figure numerate, click → `scrollIntoView`. Per le
  immagini il provino è un webp piccolo generato **a build time** (`getImage()`
  in `src/lib/miniature-figure.ts`, disegnato lato server da
  `FieldArticleLayout`) — così è visibile subito, senza aspettare che si
  scrolli fino alla figura. Per i grafici Bklit (React montato tardi) resta un
  segnaposto che `impagina-articolo.ts` riempie con un'istantanea SVG del path
  della linea, ripulita di griglia/assi/clip e con tratto ispessito — vedi
  `anteprimaGrafico()`. Dettagli in [blocchi-articoli.md](blocchi-articoli.md).
  Dal 2026-08-28 anche le **tabelle** entrano nella rail: rettangoli `Tab N`
  (nessun provino leggibile a quella scala) e titolo del gruppo che diventa
  "Figure e tabelle" / "Figures & tables".
- **Colonna note**: le footnote Markdown `[^1]` (vedi
  [blocchi-articoli.md](blocchi-articoli.md)) vengono **spostate** nel margine
  destro dallo script su desktop (con un segno-commento per rimetterli a posto
  al cambio di breakpoint); su mobile restano nel flusso. v1: le note sono
  impilate in ordine, **non** allineate verticalmente al loro riferimento.
- Indice e note sono **trasparenti** (`z-index: 2`, nessun `background`): la
  filigrana `FieldSimbolo` deve trasparire anche dietro le due colonne laterali
  come fa dietro il corpo, non essere mascherata da un rettangolo color carta.
- **Il taglio delle figure** (larghezza-testo / verticale / fascia / incorniciata)
  è descritto in [blocchi-articoli.md](blocchi-articoli.md): parte è automatica
  dalle proporzioni (script client), parte da marcatore `@…` nella didascalia.
- Lo script client è `src/scripts/impagina-articolo.ts`, importato da
  `FieldArticleBody.astro`; tutto agganciato a `astro:page-load`, idempotente,
  smontato su `astro:before-swap`. Nessun plugin rehype: il taglio automatico
  legge `width`/`height` che `astro:assets` mette sull'`<img>`, evitando
  l'incertezza sull'ordine dei plugin rispetto all'ottimizzazione immagini —
  quindi `astro.config.mjs` e `loader-bilingue.ts` non sono stati toccati.
- Verificato: `astro check` 0 errori, build 152 pagine, screenshot Puppeteer a
  1440 e 390 su facade (9 figure reali), banco di regressione e versione IT.

### Tasto condividi (`TastoCondividi.astro`, 2026-08-22)

- **Un solo bottone, in fondo all'articolo**, allineato a destra sopra la navigazione prev/next, su tutte e quattro le pagine di dettaglio. Stessa capsula del tasto `CITE` di Publications (pill `rounded-full`, `text-xs uppercase tracking-widest`, `text-ink/60` → `text-ink` in hover) più un'icona a tre nodi collegati; il riscontro di copia riusa il tooltip nero `bg-ink`/`text-paper` di `TastoCitazione`.
- **La discriminante fra condivisione e copia è il puntatore, non `navigator.share`.** Il feature detect è la scelta ovvia ed è sbagliata: Chrome e Safari espongono la Web Share API anche su macOS e Windows, dove aprirebbe un pannello di sistema desktop — mentre la richiesta era esplicitamente «su desktop la copia, perché un sistema di sharing vero lì non c'è». Il gate è `matchMedia('(pointer: coarse)')`: dito → foglio di sistema con titolo, sommario e URL; mouse → URL negli appunti e tooltip «Link copied!/Link copiato!». Chi in futuro vedesse quel gate e lo "correggesse" in un feature detect reintrodurrebbe il comportamento che l'utente non voleva.
- **`AbortError` non è un errore**: annullare il foglio di condivisione è un esito normale e non deve far scattare la copia di ripiego. Ogni altro rigetto invece ricade sulla copia.
- **La copia ha il ripiego su `execCommand`** perché `navigator.clipboard` non esiste fuori dal secure context.
- **L'URL si legge da `location.href` a runtime**, non si costruisce da props: resta corretto in entrambe le lingue senza passare informazioni di rotta al componente.
- Verificato con Puppeteer su entrambi i rami: puntatore fine → `navigator.share` mai invocato e tooltip di copia mostrato; Pixel 5 emulato → il foglio riceve titolo, sommario e URL corretti e nessun tooltip.

## Sospeso (da riprendere in sessioni future)

- **Approfondimento tipografico** ("giochi" serif/sans più elaborati).
- **Eventuale accento colore**, se emerge un'esigenza concreta.


