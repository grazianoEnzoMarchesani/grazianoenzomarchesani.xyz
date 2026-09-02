---
name: grafico-da-immagine
description: Ricostruisce un grafico statico (un'immagine dentro un articolo Fields) come grafico nativo interattivo — il blocco ```grafico. Usa quando l'utente fornisce l'immagine di un grafico, i suoi valori (CSV, tabella, elenco), o entrambi, e chiede di "trasformarlo in un grafico vero / interattivo / nativo", di "rifare questo grafico coi dati", di sostituire un `![...]()` con un grafico, o di aggiungere un grafico a un articolo di src/content/research/. Vale anche per un grafico nuovo di cui l'utente dà solo i dati.
---

# Da immagine (o dati) a grafico nativo — blocco ```grafico

Gli articoli di questo sito (`src/content/research/<slug>/<slug>.mdx`) rendono
grafici interattivi da un blocco recintato ` ```grafico `. Questa skill prende un
grafico che oggi è un'immagine — o dei dati grezzi — e ne fa un blocco nativo che
**somiglia all'originale** e rispetta lo stile del sito.

Lo schema completo del blocco, con ogni campo, i default e le trappole, è in
**`references/schema.md` — leggilo prima di scrivere il blocco.** Qui sotto c'è il
processo e le decisioni di stile già prese.

## Regole di stile (non negoziabili)

1. **Monocromo.** Il sito usa una scala di grigi (`--chart-1` … `--chart-5`, dal
   100 % al 20 % di inchiostro). Le serie **non** si distinguono col colore. Si
   distinguono così:
   - **linea/area:** una serie piena + una serie `tratteggio: "5,4"`. Con 3+
     serie: pieno, tratteggiato, e toni `var(--chart-1/2/3)`.
   - **barre:** toni della scala grigi in ordine (`var(--chart-1)` la più
     importante/scura → `var(--chart-5)`).
   Non introdurre mai colori (`#d97706`, `red`, …): rompono il sistema.
2. **Testo del grafico in inglese.** `titoloX`, `titoloY`, `etichetta` delle serie
   e valori categorici dell'asse X vanno in **inglese**, senza `$$$`. Va bene
   anche per i lettori italiani, risparmia caratteri e tiene i titoli su una riga.
   La `didascalia` invece resta nella lingua del corpo dell'articolo (di norma
   italiano).
3. **Titolo dell'asse Y sempre con l'unità di misura.** `assi.titoloY: Air
   temperature (°C)`. Viene ruotato lungo l'asse. Metti `titoloX` solo se aggiunge
   informazione (per un asse a date non serve).
4. **La legenda e il tooltip si generano da soli** dalle `etichetta`: quindi
   **ogni serie deve avere `etichetta`**. Il segno della legenda diventa
   automaticamente una lineetta (piena/tratteggiata) o un blocchetto secondo il
   `tipo`. Non costruire legende a mano nel testo.

## Processo

### 1. Raccogli gli input

Ti servono:
- **L'immagine** del grafico originale (per il confronto finale — obbligatorio se
  esiste una figura da sostituire).
- **I dati.** In ordine di prefervia: un CSV/tabella dato dall'utente → valori
  letti dall'immagine → valori dalla tabella corrispondente nel paper. Se i dati
  arrivano solo dall'immagine e non sono leggibili con confidenza, **dillo e
  fermati**.
- **Quale figura sostituisce**, se è dentro un articolo esistente: trova la riga
  `![alt](images/figNN-....png "…")` corrispondente.

Se manca qualcosa di essenziale, chiedilo prima di procedere.

### 2. Scegli `tipo`

| L'originale è… | `tipo` |
|---|---|
| andamento nel tempo, curve | `linea` (o `area` se conta il volume sotto) |
| confronto per categorie | `barre` |
| nuvola di punti X/Y | `dispersione` |

Tutti e quattro i tipi sono supportati e testati.

### 3. Costruisci il blocco

Segui `references/schema.md`. Punti che si sbagliano più spesso:

- **Asse X temporale:** se l'asse X è tempo, i valori di `x` devono essere
  **datetime ISO veri** (`"2025-08-03T01:00"`), non interi progressivi. Con gli
  interi il tooltip e l'asse mostrano "1 gennaio 1970". Per `linea`/`area`
  `xTemporale` è già `true` di default.
- **Asse X categorico su una linea:** `xTemporale: false`. Se le etichette X non
  dicono niente (indici, "ora 1..168"), aggiungi `assi: { x: false }` e spiega la
  scala nella didascalia.
- **Linea di base:** `linea`/`area` partono da 0. Se i dati vivono lontano dallo
  zero (temperature, pressioni…), dai `yMin`/`yMax` per alzare la base e usare
  tutta l'altezza. Le barre partono sempre da 0: non dargli `yMin`.
- **`dati` sempre inline.** Il campo `src` è nello schema ma **non è cablato**:
  un JSON/CSV esterno non viene letto. Centinaia di righe inline vanno bene; se
  sono tante, genera il blocco con uno script invece di scriverle a mano.
- **Didascalia:** autosufficiente, dice cosa mostra e — se i valori sono letti
  dall'immagine e non da una tabella — lo dichiara. Diventa `<figcaption>`.
- La figura prende il numero "Fig. N" da sola (conteggio di `remark-articolo.ts`):
  non scrivere "Figura N" nella didascalia.

### 4. Inserisci e pulisci

- Sostituisci la riga `![...](images/figNN-....png "…")` con il blocco ` ```grafico `.
- **Cancella il file immagine** ora inutilizzato in `<slug>/images/`.
- Se nel corpo dell'articolo la didascalia vecchia citava colori ("la linea nera",
  "in arancione"), riscrivila in termini di forma ("linea piena", "tratteggiata",
  "barra scura").

### 5. Verifica contro l'originale — obbligatorio

```
npx astro build
```

deve passare. Poi avvia l'anteprima e fai uno screenshot del grafico renderizzato:

```
npx astro preview --port 4400 &
node .claude/skills/grafico-da-immagine/scripts/verifica-grafico.mjs \
  http://localhost:4400/it/fields/research/<slug>/ /tmp/verifica
npx astro preview stop
```

Confronta screenshot e immagine originale: **stessi valori ai punti chiave,
stesso andamento, stessa posizione di picchi e minimi, stessi ordini di
grandezza**. Controlla anche che la legenda, i titoli degli assi e il tooltip
(lo script fa hover) siano in inglese e coerenti.

Se **non combacia fedelmente**, non consegnare il grafico nativo: rimetti
l'immagine `![...]()` e dillo all'utente.

### 6. Riepiloga

Elenca: quale figura è diventata grafico nativo, con quale `tipo`, l'esito del
confronto con l'originale, e i file toccati (`.mdx`, immagine cancellata). Non
fare commit né push.

## Se manca una funzione nello schema

Lo schema (`src/components/charts/tipi.ts`) è la superficie API vera. Se
l'immagine ha qualcosa che lo schema non copre (un secondo asse Y, annotazioni
puntuali, una scala log…), la strada è: aggiungere il campo a `tipi.ts`,
tradurlo in `src/components/charts/adattatore.tsx`, e — solo se serve — inoltrarlo
nella copia di Bklit sotto `src/vendor/bklit/components/charts/`. È lavoro da
valutare con l'utente, non da fare di slancio: spesso tenere l'immagine è la
scelta giusta.

## File del sistema grafici (per orientarsi)

- `src/components/charts/tipi.ts` — lo schema del blocco, fonte di verità
- `src/components/charts/adattatore.tsx` — traduce il YAML nell'albero Bklit;
  qui vivono legenda, righe del tooltip, titoli degli assi, tratteggio
- `src/lib/remark-articolo.ts` — riconosce il fence ` ```grafico ` e numera le figure
- `src/scripts/monta-grafici.ts` — monta l'isola React lato client
- `src/components/FieldArticleBody.astro` — CSS di grafico, legenda, titoli assi
- `src/content/research/facade-geometry-passive-cooling/…mdx` — esempio reale con
  una `linea` (asse a date, `yMin`, tratteggio) e una `barre` (gruppi, scala grigi)
