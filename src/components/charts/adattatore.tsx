import { createElement, Fragment, type ReactElement, type ReactNode } from "react";
import Grid from "@/components/charts/grid";
import XAxis from "@/components/charts/x-axis";
import YAxis from "@/components/charts/y-axis";
import ReferenceArea from "@/components/charts/reference-area";
import { ChartTooltip } from "@/components/charts/tooltip";
import type { ConfigGrafico, Serie } from "./tipi";

/**
 * Traduce il blocco ```grafico di un articolo nell'albero di componenti Bklit.
 *
 * Bklit è composabile (`<LineChart><Line/><Grid/>…`), il blocco YAML no: questo
 * file è il ponte fra i due, ed è quindi la superficie API vera degli articoli.
 * Ciò che lo schema non espone si raggiunge con `props:`.
 *
 * I tipi di grafico si caricano UNO ALLA VOLTA con import dinamico: un articolo
 * con una sola linea non deve scaricare anche barre, aree e dispersione.
 */

const CARICA = {
  linea: async () => {
    const m = await import("@/components/charts/line-chart");
    return { Contenitore: m.default, Serie: m.Line };
  },
  area: async () => {
    const m = await import("@/components/charts/area-chart");
    return { Contenitore: m.default, Serie: m.Area };
  },
  barre: async () => {
    // Le barre lavorano su un asse categorico: gli assi temporali generici (XAxis/YAxis)
    // qui non funzionano, servono quelli dedicati.
    const [m, s, x, y, v] = await Promise.all([
      import("@/components/charts/bar-chart"),
      import("@/components/charts/bar"),
      import("@/components/charts/bar-x-axis"),
      import("@/components/charts/bar-y-axis"),
      import("@/components/charts/bar-value-labels"),
    ]);
    // Barre verticali: categoria su X (BarXAxis), valore su Y (YAxis generico).
    // Barre orizzontali: categoria su Y (BarYAxis), valore scritto in fondo alla barra.
    return {
      Contenitore: m.default,
      Serie: s.Bar,
      XAxis: x.BarXAxis,
      BarYAxis: y.BarYAxis,
      BarValueLabels: v.BarValueLabels,
    };
  },
  dispersione: async () => {
    const m = await import("@/components/charts/scatter-chart");
    return { Contenitore: m.default, Serie: m.Scatter };
  },
} as const;

/** linea e area vogliono un asse X a date vere; barre e dispersione lavorano su categorie. */
const TEMPORALE_DI_DEFAULT = { linea: true, area: true, barre: false, dispersione: false } as const;

const COLORI = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

/** Formattatori dell'asse X temporale (linea/area), scelti con `formatoData`. */
const FORMATO_DATA: Record<string, (d: Date) => string> = {
  anno: (d) => String(d.getFullYear()),
  "mese-anno": (d) => d.toLocaleString("en", { month: "short", year: "numeric" }),
  "giorno-mese": (d) => d.toLocaleString("en", { day: "numeric", month: "short" }),
};

/** Bklit anima l'ingresso in 1100 ms: troppo per una figura dentro un articolo che si sta leggendo. */
const DURATA_ANIMAZIONE = 450;

export async function creaGrafico(config: ConfigGrafico): Promise<ReactElement> {
  const tipo = config.tipo ?? "linea";
  const carica = CARICA[tipo];
  if (!carica) throw new Error(`grafico: tipo "${tipo}" sconosciuto (attesi: ${Object.keys(CARICA).join(", ")})`);
  const caricato = await carica();
  const { Contenitore, Serie: ComponenteSerie } = caricato;
  const AsseX = "XAxis" in caricato ? caricato.XAxis : XAxis;
  const AsseY = "YAxis" in caricato ? caricato.YAxis : YAxis;
  const AsseCategoriaY = "BarYAxis" in caricato ? caricato.BarYAxis : null;
  const EtichetteValore = "BarValueLabels" in caricato ? caricato.BarValueLabels : null;
  const orizzontale = tipo === "barre" && config.orientamento === "orizzontale";
  const grigliaProps = tipo === "barre" ? (orizzontale ? { horizontal: false, vertical: true } : { horizontal: true }) : {};

  const x = config.x ?? "data";
  const temporale = config.xTemporale ?? TEMPORALE_DI_DEFAULT[tipo];
  const serie: Serie[] = config.serie?.length
    ? config.serie
    : // Nessuna serie dichiarata: si prendono tutte le chiavi numeriche tranne l'asse X.
      Object.keys(config.dati?.[0] ?? {})
        .filter((chiave) => chiave !== x && typeof config.dati?.[0]?.[chiave] === "number")
        .map((chiave) => ({ chiave }));

  const dati = (config.dati ?? []).map((riga) => (temporale ? { ...riga, [x]: new Date(String(riga[x])) } : riga));

  const figli: ReactNode[] = [];
  if (config.griglia !== false) figli.push(createElement(Grid, { key: "griglia", ...grigliaProps }));
  if (orizzontale && AsseCategoriaY) {
    // Categorie sull'asse verticale; il valore lo scrivono le EtichetteValore.
    if (config.assi?.y !== false)
      figli.push(createElement(AsseCategoriaY as never, { key: "cat-y", maxLabelWidth: 200 }));
    if (EtichetteValore && serie.length === 1)
      figli.push(createElement(EtichetteValore as never, { key: "val", valueKey: serie[0].chiave }));
  } else {
    if (config.assi?.x !== false) {
      // Densità delle etichette X: BarXAxis la chiama `maxLabels`, XAxis `numTicks`.
      const tacche = config.assi?.tacche;
      const propAsseX =
        tacche == null
          ? { key: "x" }
          : tipo === "barre"
            ? { key: "x", maxLabels: tacche, showAllLabels: false }
            : { key: "x", numTicks: tacche };
      figli.push(createElement(AsseX as never, propAsseX));
    }
    if (config.assi?.y) figli.push(createElement(AsseY as never, { key: "y" }));
  }

  // Secondo asse Y a destra: per serie con unità/ordini di grandezza diversi
  // (temperatura vs umidità). Solo linea/area: barre e dispersione non lo espongono.
  const conAsseDestra =
    (tipo === "linea" || tipo === "area") && serie.some((s) => s.asseY === "destra");
  if (conAsseDestra)
    figli.push(createElement(AsseY as never, { key: "y-destra", yAxisId: "right", orientation: "right" }));

  for (const [indice, voce] of serie.entries()) {
    const colore = voce.colore ?? COLORI[indice % COLORI.length];
    const props: Record<string, unknown> = {
      key: voce.chiave,
      dataKey: voce.chiave,
      stroke: colore,
      fill: colore,
    };
    // Tratteggio su tutta la linea/area: `dashFromIndex: 0` fa partire il tratteggio
    // dal primo punto (vedi Line di Bklit). Lo stratagemma monocromo per separare le serie.
    if (voce.tratteggio && (tipo === "linea" || tipo === "area")) {
      props.dashFromIndex = 0;
      props.dashArray = typeof voce.tratteggio === "string" ? voce.tratteggio : "6,4";
    }
    if (conAsseDestra && voce.asseY === "destra") props.yAxisId = "right";
    figli.push(createElement(ComponenteSerie as never, props));
  }

  // Bklit non ha una linea di riferimento, solo `ReferenceArea`: una soglia (`y: 26`)
  // diventa una banda alta lo 0,5% del dominio, altrimenti l'area ha altezza zero e
  // non viene disegnata affatto.
  const valori = dati.flatMap((riga) => serie.map((s) => Number(riga[s.chiave]))).filter(Number.isFinite);
  const spessore = (Math.max(...valori) - Math.min(...valori)) * 0.005 || 0.5;

  for (const [indice, riferimento] of (config.riferimenti ?? []).entries()) {
    const centro = riferimento.y;
    figli.push(
      createElement(ReferenceArea, {
        key: `rif-${indice}`,
        y1: riferimento.y1 ?? (centro !== undefined ? centro - spessore : undefined),
        y2: riferimento.y2 ?? (centro !== undefined ? centro + spessore : undefined),
        stroke: riferimento.colore ?? "var(--chart-crosshair)",
        strokeStyle: "dashed",
        label: riferimento.etichetta,
      } as never),
    );
  }

  if (config.tooltip !== false) {
    // Le righe del tooltip usano le stesse etichette della legenda: un solo
    // riferimento per nome e colore di ogni serie. Senza questo il tooltip
    // mostrerebbe la chiave grezza del dato.
    const righe = (punto: Record<string, unknown>) =>
      serie.map((voce, indice) => ({
        color: voce.colore ?? COLORI[indice % COLORI.length],
        label: voce.etichetta ?? voce.chiave,
        value: (punto[voce.chiave] as number) ?? 0,
      }));
    figli.push(createElement(ChartTooltip, { key: "tooltip", rows: righe } as never));
  }

  const senzaMoto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const grafico = createElement(
    Contenitore as never,
    {
      data: dati,
      xDataKey: x,
      aspectRatio: config.proporzione ?? "2 / 1",
      // Barre orizzontali: sviluppo orizzontale + spazio a sinistra per le etichette lunghe.
      ...(orizzontale ? { orientation: "horizontal", margin: { left: 220 } } : {}),
      // Formattazione dell'asse X temporale (linea/area): es. solo l'anno.
      ...((tipo === "linea" || tipo === "area") && config.formatoData
        ? { xLabelFormat: FORMATO_DATA[config.formatoData] }
        : {}),
      animationDuration: senzaMoto ? 0 : DURATA_ANIMAZIONE,
      // Linea/area li leggono entrambi; le barre partono sempre da 0 (yMin ignorato)
      // ma usano yMax per fissare il tetto della scala.
      yScaleDomainMin: config.yMin,
      yScaleDomainMax: config.yMax,
      yScaleDomainMinRight: config.yMinDestra,
      yScaleDomainMaxRight: config.yMaxDestra,
      ...config.props,
    },
    ...figli,
  );

  // Titoli degli assi: la Y ruotata lungo l'asse (ci va l'unità di misura), la X sotto.
  const titoloY = config.assi?.titoloY;
  const titoloYDestra = config.assi?.titoloYDestra;
  const titoloX = config.assi?.titoloX;
  const conAssi =
    titoloY || titoloYDestra || titoloX
      ? createElement(
          "div",
          { className: "grafico-assi" },
          // Il titolo Y va centrato sull'area di disegno, non su tutta la figura:
          // sta dentro questo corpo, che avvolge solo il grafico.
          createElement(
            "div",
            { key: "corpo", className: "grafico-assi-corpo" },
            titoloY && createElement("span", { key: "ty", className: "grafico-asse grafico-asse--y" }, titoloY),
            titoloYDestra &&
              createElement(
                "span",
                { key: "tyd", className: "grafico-asse grafico-asse--y-destra" },
                titoloYDestra,
              ),
            grafico,
          ),
          titoloX && createElement("span", { key: "tx", className: "grafico-asse grafico-asse--x" }, titoloX),
        )
      : grafico;

  // Legenda: senza colore le serie si distinguono solo per etichetta, quindi serve
  // ogni volta che ci sono piu serie con un nome. Un semplice elenco di pastiglie,
  // non il componente Legend di Bklit (che vuole un contesto e un hover state).
  const conEtichette = serie.filter((s) => s.etichetta);
  if (config.legenda === false || conEtichette.length < 2) return conAssi;

  // Il segno della legenda deve somigliare a com'è disegnata la serie: un blocco
  // per barre/dispersione, un tratto di linea (pieno o tratteggiato) per linea/area.
  const segnoBlocco = tipo === "barre" || tipo === "dispersione";
  const legenda = createElement(
    "ul",
    { className: "grafico-legenda", "aria-hidden": "true" },
    ...serie.map((voce, indice) => {
      const colore = voce.colore ?? COLORI[indice % COLORI.length];
      const classe = segnoBlocco
        ? "grafico-legenda-segno grafico-legenda-segno--blocco"
        : voce.tratteggio
          ? "grafico-legenda-segno grafico-legenda-segno--tratteggio"
          : "grafico-legenda-segno grafico-legenda-segno--linea";
      const style = segnoBlocco ? { background: colore } : { borderTopColor: colore };
      return createElement(
        "li",
        { key: voce.chiave },
        createElement("span", { className: classe, style }),
        voce.etichetta ?? voce.chiave,
      );
    }),
  );

  return createElement(Fragment, null, conAssi, legenda);
}
