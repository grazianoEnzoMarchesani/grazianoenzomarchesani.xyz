import { createElement, type ReactElement, type ReactNode } from "react";
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
    const [m, s] = await Promise.all([import("@/components/charts/bar-chart"), import("@/components/charts/bar")]);
    return { Contenitore: m.default, Serie: s.Bar };
  },
  dispersione: async () => {
    const m = await import("@/components/charts/scatter-chart");
    return { Contenitore: m.default, Serie: m.Scatter };
  },
} as const;

/** linea e area vogliono un asse X a date vere; barre e dispersione lavorano su categorie. */
const TEMPORALE_DI_DEFAULT = { linea: true, area: true, barre: false, dispersione: false } as const;

const COLORI = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

/** Bklit anima l'ingresso in 1100 ms: troppo per una figura dentro un articolo che si sta leggendo. */
const DURATA_ANIMAZIONE = 450;

export async function creaGrafico(config: ConfigGrafico): Promise<ReactElement> {
  const tipo = config.tipo ?? "linea";
  const carica = CARICA[tipo];
  if (!carica) throw new Error(`grafico: tipo "${tipo}" sconosciuto (attesi: ${Object.keys(CARICA).join(", ")})`);
  const { Contenitore, Serie: ComponenteSerie } = await carica();

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
  if (config.griglia !== false) figli.push(createElement(Grid, { key: "griglia" }));
  if (config.assi?.x !== false) figli.push(createElement(XAxis, { key: "x" }));
  if (config.assi?.y) figli.push(createElement(YAxis, { key: "y" }));

  for (const [indice, voce] of serie.entries()) {
    figli.push(
      createElement(ComponenteSerie as never, {
        key: voce.chiave,
        dataKey: voce.chiave,
        stroke: voce.colore ?? COLORI[indice % COLORI.length],
        fill: voce.colore ?? COLORI[indice % COLORI.length],
      }),
    );
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

  if (config.tooltip !== false) figli.push(createElement(ChartTooltip, { key: "tooltip" } as never));

  const senzaMoto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return createElement(
    Contenitore as never,
    {
      data: dati,
      xDataKey: x,
      aspectRatio: config.proporzione ?? "2 / 1",
      animationDuration: senzaMoto ? 0 : DURATA_ANIMAZIONE,
      ...config.props,
    },
    ...figli,
  );
}
