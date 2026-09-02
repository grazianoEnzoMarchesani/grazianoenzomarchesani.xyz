"use client";

import { memo, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { useChart, useChartStable } from "./chart-context";

export interface BarValueLabelsProps {
  /** Key in data for the numeric value to print at the end of each bar. */
  valueKey: string;
  /** Format the printed value. Default: `String(v)`. */
  format?: (value: number) => string;
}

/**
 * Numeric labels at the end of each bar. Only meaningful for a horizontal bar
 * chart, where there is no dedicated value axis: the labels carry the exact
 * counts and the vertical grid lines carry the scale.
 */
export function BarValueLabels({ valueKey, format }: BarValueLabelsProps) {
  const { containerRef, barScale } = useChartStable();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const container = containerRef.current;
  if (!(mounted && container && barScale)) {
    return null;
  }

  return (
    <BarValueLabelsInner
      container={container}
      format={format}
      valueKey={valueKey}
    />
  );
}

const BarValueLabelsInner = memo(function BarValueLabelsInner({
  valueKey,
  format,
  container,
}: BarValueLabelsProps & { container: HTMLDivElement }) {
  const {
    margin,
    barScale,
    bandWidth,
    barXAccessor,
    data,
    yScale,
    orientation,
  } = useChart();

  if (orientation !== "horizontal" || !(barScale && bandWidth && barXAccessor)) {
    return null;
  }

  const fmt = format ?? ((value: number) => String(value));
  const labels = data.flatMap((datum, index) => {
    const raw = datum[valueKey];
    // Righe senza valore (es. una riga vuota usata come separatore) non prendono etichetta.
    if (raw === null || raw === undefined || raw === "") {
      return [];
    }
    const value = Number(raw);
    if (!Number.isFinite(value)) {
      return [];
    }
    const category = barXAccessor(datum);
    const bandY = (barScale(category) ?? 0) + margin.top + bandWidth / 2;
    const x = (yScale(value) ?? 0) + margin.left;
    return [{ key: `${category}-${index}`, x, y: bandY, text: fmt(value) }];
  });

  return createPortal(
    <div className="pointer-events-none absolute inset-0">
      {labels.map((item) => (
        <span
          className={cn(
            "-translate-y-1/2 absolute whitespace-nowrap text-chart-label text-xs tabular-nums",
          )}
          key={item.key}
          style={{ left: item.x + 6, top: item.y }}
        >
          {item.text}
        </span>
      ))}
    </div>,
    container,
  );
});

BarValueLabels.displayName = "BarValueLabels";

export default BarValueLabels;
