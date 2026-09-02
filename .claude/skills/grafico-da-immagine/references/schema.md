# Schema del blocco ```grafico

Riferimento completo. La fonte di verità è `src/components/charts/tipi.ts`
(interfaccia `ConfigGrafico`); se diverge da qui, vince il codice.

Il blocco è **YAML** dentro un fence ` ```grafico `. Viene serializzato in un
segnaposto da `remark-articolo.ts` e idratato lato client come isola React
(`monta-grafici.ts` → `adattatore.tsx` → componenti Bklit).

## Esempio minimo

````markdown
```grafico
tipo: linea
x: t
assi:
  y: true
  titoloY: Air temperature (°C)
serie:
  - chiave: today
    etichetta: Current climate
  - chiave: future
    etichetta: 2050 projection
    tratteggio: "5,4"
dati:
  - { t: "2025-08-03T01:00", today: 25.4, future: 31.0 }
  - { t: "2025-08-03T02:00", today: 24.8, future: 30.3 }
didascalia: Cosa mostra il grafico. Diventa la <figcaption>.
```
````

## Campi di primo livello (`ConfigGrafico`)

| Campo | Tipo | Default | Note |
|---|---|---|---|
| `tipo` | `"linea" \| "area" \| "barre" \| "dispersione"` | `"linea"` | tutti testati |
| `dati` | array di oggetti | — | **inline, obbligatorio**. Ogni oggetto ha la chiave X + una chiave per serie |
| `src` | string | — | **NON implementato** — non usarlo, non viene letto |
| `x` | string | `"data"` | nome della chiave X dentro `dati` |
| `xTemporale` | boolean | `true` per linea/area, `false` per barre/dispersione | se `true`, i valori X sono convertiti con `new Date()` |
| `serie` | `Serie[]` | tutte le chiavi numeriche tranne X | vedi sotto |
| `griglia` | boolean | `true` | linee di griglia |
| `legenda` | boolean | `true` se ≥2 serie con `etichetta` | elenco di pastiglie sotto il grafico |
| `assi` | oggetto | — | `{ x?, y?, titoloX?, titoloY? }` — vedi sotto |
| `yMin` / `yMax` | number | auto | **solo linea/area**. Fissano gli estremi Y; utili per alzare la linea di base. Le barre partono sempre da 0 |
| `tooltip` | boolean | `true` | il contenuto usa le `etichetta` delle serie |
| `riferimenti` | `Riferimento[]` | — | bande/soglie orizzontali, vedi sotto |
| `titolo` | string | — | raramente usato; preferisci `didascalia` |
| `didascalia` | string | — | testo della `<figcaption>`; **non** numerare ("Fig. N" è automatico) |
| `proporzione` | string CSS | `"2 / 1"` | es. `"3 / 2"` per un grafico più alto |
| `props` | oggetto | — | valvola di sfogo: passato tale e quale al contenitore Bklit |

### `assi`

| Campo | Tipo | Default | Note |
|---|---|---|---|
| `x` | boolean | `true` | mostra l'asse X. Mettilo a `false` se le etichette X non dicono niente |
| `y` | boolean | `false` | **va messo `true`** per vedere la scala Y con i numeri |
| `titoloX` | string | — | sotto il grafico, centrato. Solo se aggiunge informazione |
| `titoloY` | string | — | ruotato lungo l'asse. **Mettici sempre l'unità di misura** |
| `titoloYDestra` | string | — | titolo del secondo asse Y a destra (serie con `asseY: destra`) |

### `serie` (`Serie[]`)

| Campo | Tipo | Note |
|---|---|---|
| `chiave` | string | **obbligatorio** — nome della proprietà dentro gli oggetti di `dati` |
| `etichetta` | string | **mettila sempre** — alimenta legenda e tooltip. In inglese |
| `colore` | string | CSS. Default: `var(--chart-1..5)` a rotazione. Usa **solo** `var(--chart-N)`, mai una tinta |
| `gruppo` | string | barre/aree impilate nello stesso gruppo |
| `tratteggio` | `string \| boolean` | linea/area tratteggiata. Stringa = pattern `stroke-dasharray` (`"5,4"`), `true` = `"6,4"`. Ignorato da barre/dispersione |
| `asseY` | `"sinistra" \| "destra"` | su quale asse Y appoggiare la serie. `"destra"` crea un secondo asse con scala propria — per serie con unità diverse (temperatura °C vs umidità g/kg). Solo linea/area |

### Doppio asse Y

Se una serie ha `asseY: destra`, compare un secondo asse Y a destra con scala
indipendente (auto-domain dai suoi dati). Titolo con `assi.titoloYDestra` (sempre
con l'unità). Estremi con `yMinDestra` / `yMaxDestra` (come `yMin`/`yMax` ma per
l'asse destro). Distingui comunque le serie con pieno/tratteggiato: il lato
dell'asse non basta come indizio visivo.

### `riferimenti` (`Riferimento[]`)

Bande orizzontali (Bklit non ha linee di riferimento sottili: una soglia diventa
una banda molto stretta).

| Campo | Tipo | Note |
|---|---|---|
| `y` | number | centro della banda (diventa una banda sottile attorno al valore) |
| `y1` / `y2` | number | estremi espliciti di una banda spessa |
| `etichetta` | string | testo sulla banda |
| `colore` | string | default `var(--chart-crosshair)` |

## Come si distinguono le serie (monocromo)

La scala `--chart-1..5` è di grigi:

| token | inchiostro |
|---|---|
| `var(--chart-1)` | 100 % |
| `var(--chart-2)` | 72 % |
| `var(--chart-3)` | 52 % |
| `var(--chart-4)` | 34 % |
| `var(--chart-5)` | 20 % |

- **2 linee:** serie A piena `var(--chart-1)`, serie B `var(--chart-2)` +
  `tratteggio: "5,4"`.
- **3+ linee:** combina tono e tratteggio; evita di superare 3-4 serie.
- **barre:** assegna `var(--chart-1)`, `var(--chart-2)`, … in ordine di
  importanza (la più scura = quella su cui vuoi l'occhio).
- **dispersione:** tono diverso per serie; se sono tante meglio tenere l'immagine.

## Comportamenti automatici (non replicarli a mano)

- **Numero figura:** ogni ` ```grafico ` riceve `data-fig="N"` e un'etichetta
  "Fig. N" dal CSS. Conta insieme a immagini e video nell'ordine dell'articolo.
- **Legenda:** renderizzata se ≥2 serie hanno `etichetta`. Il segno riflette il
  tipo: lineetta piena, lineetta tratteggiata, o blocchetto.
- **Tooltip:** le righe usano `etichetta` + colore della serie, non la chiave
  grezza. Su asse temporale il titolo del tooltip è la data formattata.
- **Titolo asse Y:** centrato verticalmente sull'area di disegno, ruotato.
- **Riduzione moto:** con `prefers-reduced-motion` l'animazione d'ingresso è 0.

## Trappole

- **Interi su asse temporale** → "1 gennaio 1970". Usa datetime ISO veri.
- **`assi.y` non impostato** → nessun numero sull'asse Y.
- **`colore` con una tinta** → rompe il monocromo; usa `var(--chart-N)`.
- **`src`** → non fa niente. Inline `dati`.
- **`yMin` su un grafico a barre** → ignorato (e non avrebbe senso: le barre
  partono da 0).
- **Didascalia che dice "Figura 6"** → doppia numerazione.
