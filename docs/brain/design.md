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
mai l'unico canale". Un terzo colore/accento è valutabile in futuro, non
ora.

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
  nativo per la navigazione tra sezioni: Hero + Fields + Publications +
  Skills + About. Ridotte da 8 a 5 nella sessione di `/grill-me` del
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
- Nav fissa in alto con le stesse 7 voci, restyle minimale.
- Footer minimo persistente (`position: fixed`), solo email di contatto —
  niente form integrato nelle schermate.
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
- Stesso pattern di reveal mascherato **da riusare per il titolo grande**
  (es. "Tools") in una sessione futura — stesso stile, ma timing/trigger
  indipendente dal contatore (non sincronizzati), non ancora
  implementato.

**Deliberatamente esclusi finora**: effetto "stage" sticky (titolo
coperto/scoperto), pin dell'intera sezione stile cubo Codrops, Lenis. La
scelta resta "il più semplice possibile per ogni incremento" — si
valuta se e cosa aggiungere in seguito.

## Sospeso (da riprendere in sessioni future)

- **Approfondimento tipografico** ("giochi" serif/sans più elaborati).
- **Eventuale accento colore**, se emerge un'esigenza concreta.
