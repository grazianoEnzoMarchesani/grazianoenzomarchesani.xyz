---
titolo: "Test article — two images, a formula, a video and a chart" $$$ "Articolo di prova — due immagini, una formula, un video e un chart"
data: 2026-08-16
sommario: "Test article for DEC-119: verifies media, LaTeX and interactive charts together in a real page you can look at. Safe to delete once checked." $$$ "Articolo di prova per DEC-119: verifica media, LaTeX e chart interattivi insieme in una pagina vera da guardare. Si può cancellare una volta controllato."
tag: ["test"]

media:
  - id: "vista-canyon"
    url: "vista-canyon.svg"
  - id: "grafico-dati"
    url: "grafico-dati.svg"
  - id: "video-prova"
    url: "https://www.youtube.com/embed/dQw4w9WgXcQ"

chart:
  # Barre multi-serie: due colonne numeriche per riga ("estate"/"inverno"),
  # ognuna una serie con nome e colore propri, legenda accesa, non impilate.
  # Palette personalizzata (caldo/freddo), indipendente dal tema attivo.
  - id: "confronto-varianti"
    tipo: "barre"
    dati:
      - etichetta: "V1"
        estate: 32
        inverno: 18
      - etichetta: "V2"
        estate: 58
        inverno: 41
      - etichetta: "V3"
        estate: 71
        inverno: 55
      - etichetta: "V4"
        estate: 45
        inverno: 30
    opzioni:
      serie:
        - chiave: "estate"
          etichetta: "Estate"
          colore: "#f59e0b"
        - chiave: "inverno"
          etichetta: "Inverno"
          colore: "#0ea5e9"
      legenda: true
      griglia: true
      impilato: false

  # Boxplot: cinque numeri per riga (min/q1/mediana/q3/max), un box a
  # categoria — nessun `colori` esplicito: eredita la PALETTE_DEFAULT,
  # quindi segue le chiavi generali del tema scelto (--color-accent,
  # --color-warn, --color-blush, ecc.), come il chart a torta più sotto.
  - id: "confronto-impilato"
    tipo: "boxplot"
    dati:
      - etichetta: "V1"
        min: 12
        q1: 22
        mediana: 32
        q3: 40
        max: 48
      - etichetta: "V2"
        min: 30
        q1: 48
        mediana: 58
        q3: 66
        max: 79
      - etichetta: "V3"
        min: 40
        q1: 60
        mediana: 71
        q3: 82
        max: 95
      - etichetta: "V4"
        min: 20
        q1: 36
        mediana: 45
        q3: 54
        max: 63
    opzioni:
      griglia: true

  # Il chart a linee di bklit è pensato per serie temporali (asse X a
  # date vere, non etichette categoriche come le barre) — qui "etichetta"
  # porta una data invece di "V1".."V4". Palette personalizzata, diversa
  # da quella del chart a barre sopra, per mostrare che ogni chart sceglie
  # la propria indipendentemente dagli altri.
  - id: "andamento"
    tipo: "linee"
    dati:
      - etichetta: "2026-01-01"
        estate: 32
        inverno: 18
      - etichetta: "2026-02-01"
        estate: 58
        inverno: 41
      - etichetta: "2026-03-01"
        estate: 71
        inverno: 55
      - etichetta: "2026-04-01"
        estate: 45
        inverno: 30
    opzioni:
      serie:
        - chiave: "estate"
          etichetta: "Estate"
          colore: "#7c3aed"
        - chiave: "inverno"
          etichetta: "Inverno"
          colore: "#16a34a"

  # Torta: chiaveEtichetta/chiaveValore invece di "serie". Anche qui
  # nessun `colori` esplicito: fette colorate dalla PALETTE_DEFAULT, quindi
  # legate al tema attivo come il chart a barre impilate sopra.
  - id: "ripartizione"
    tipo: "torta"
    dati:
      - categoria: "Involucro"
        quota: 45
      - categoria: "Impianti"
        quota: 30
      - categoria: "Vetrate"
        quota: 25
    opzioni:
      chiaveEtichetta: "categoria"
      chiaveValore: "quota"
      legenda: true

didascalia_vista-canyon: "Placeholder — a real façade photo goes here." $$$ "Placeholder — qui andrà una foto vera della facciata."
didascalia_grafico-dati: "Placeholder — a real data diagram goes here." $$$ "Placeholder — qui andrà un diagramma vero."
didascalia_video-prova: "Placeholder video, picked at random to test the embed." $$$ "Video placeholder, scelto a caso per provare l'embed."
---

This is a throwaway article, built only to check that images, an
external video, a LaTeX formula and an interactive chart all render
together on a real page — not a real research note. The two images
below are placeholder graphics (there is no real photo yet), the video
is a random YouTube clip picked only to prove the embed works.

First image:

{{media:vista-canyon}}

A view factor weights how much a surface contributes to the radiant
temperature at a point:

$$
T_{mrt} = \left[ \sum_{i=1}^{n} F_{p \to i} \cdot T_i^4 \right]^{1/4}
$$

Second image:

{{media:grafico-dati}}

A test video, embedded the same way a real one would be:

{{media:video-prova}}

And four test charts, with made-up numbers, to show what an article can
configure entirely from its own frontmatter: custom series with names
and colors (or none, falling back to the active theme), legend on/off,
grid on/off, and other chart types (box, line, pie) reusing the same
data shape.

Grouped bars, two series with custom colors and names, legend on:

{{chart:confronto-varianti}}

A boxplot, one box per category (min/Q1/median/Q3/max) — no custom
colors here, so it follows the active theme instead:

{{chart:confronto-impilato}}

Same data again, as a line chart — only `tipo` changes, and it has its
own custom palette, unrelated to the bars above:

{{chart:andamento}}

A pie chart with no custom colors either — same theme-following default
as the boxplot above:

{{chart:ripartizione}}

$$$

Questo è un articolo usa-e-getta, costruito solo per controllare che
immagini, un video esterno, una formula LaTeX e un chart interattivo si
renderizzino tutti insieme in una pagina vera — non è una nota di
ricerca vera. Le due immagini sotto sono grafiche placeholder (non c'è
ancora una foto vera), il video è un video YouTube scelto a caso solo
per provare l'embed.

Prima immagine:

{{media:vista-canyon}}

Un fattore di vista pesa quanto una superficie contribuisce alla
temperatura radiante in un punto:

$$
T_{mrt} = \left[ \sum_{i=1}^{n} F_{p \to i} \cdot T_i^4 \right]^{1/4}
$$

Seconda immagine:

{{media:grafico-dati}}

Un video di prova, incorporato come sarebbe fatto uno vero:

{{media:video-prova}}

E quattro chart di prova, con numeri inventati, per mostrare cosa un
articolo può configurare interamente dal proprio frontmatter: serie
personalizzate con nomi e colori (oppure nessuno, e allora segue il
tema attivo), legenda sì/no, griglia sì/no, e altri tipi di chart
(boxplot, linee, torta) che riusano la stessa forma di dati.

Barre affiancate, due serie con colori e nomi personalizzati, legenda
accesa:

{{chart:confronto-varianti}}

Un boxplot, un box per categoria (min/q1/mediana/q3/max) — nessun
colore personalizzato qui, quindi segue il tema attivo:

{{chart:confronto-impilato}}

Ancora gli stessi dati, come chart a linee — cambia solo `tipo`, e ha
una palette personalizzata propria, indipendente dalle barre sopra:

{{chart:andamento}}

Un chart a torta senza colori personalizzati — stesso comportamento
del boxplot sopra, segue il tema:

{{chart:ripartizione}}
