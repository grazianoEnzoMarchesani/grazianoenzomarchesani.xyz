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
- **Marker sulla spira**: cerchio, quadrato, X, triangolo — placeholder
  generici mappati 1:1 sulle quattro categorie fuse in Fields (Research,
  Tools, Teaching, Projects). Da rivedere quando arriveranno i contenuti
  reali migrati dal vecchio sito.
- **Disposizione**: i marker di uno stesso anno sono raggruppati per
  quadrante di categoria (90° ciascuna), non distribuiti cronologicamente
  lungo il giro.
- **Anni senza contenuti**: saltati del tutto, nessuna spira vuota
  costruita. Un anno con anche un solo contenuto ottiene comunque una
  spira intera.
- **Stile**: wireframe/line art puro (nessuna superficie piena, nessuno
  shading/luce) — coerente con la palette a due soli colori
  (`--color-ink`/`--color-paper`, niente accento, niente dark mode: sfondo
  scena color paper, tratti in ink). Fog che sfuma le spire più lontane
  per rinforzare la profondità.
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

Placeholder fittizi ma variabili/plausibili (non un conteggio fisso
identico per anno/categoria), generati con un seed fisso in
`src/data/fields.ts` così restano stabili tra un reload e l'altro durante
lo sviluppo. Da sostituire con i contenuti reali migrati (vedi
[content-plan.md](content-plan.md)) quando l'architettura di Fields sarà
completa.

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

## Rimandato

- Filtri/facet per anno e tag (menzionati come tipologie previste, non
  ancora progettati).
- Navigazione reale dai marker ai contenuti (serve prima la migrazione
  contenuti, vedi [content-plan.md](content-plan.md)).
- Comportamento mobile/tablet dedicato: idea iniziale dell'utente è una
  linea ondulata verticale (anni più vecchi in alto, più recenti in
  basso) invece della spirale in prospettiva, ma non ancora progettata né
  costruita — al momento la scena desktop si limita a scalare via
  `resize()`, senza un layout alternativo per schermi stretti.
- Cap/culling di performance sui marker.
