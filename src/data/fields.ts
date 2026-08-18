export type FieldCategory = 'research' | 'tools' | 'teaching' | 'projects';

export const FIELD_CATEGORY_LABELS: Record<FieldCategory, string> = {
  research: 'Research',
  tools: 'Tools',
  teaching: 'Teaching',
  projects: 'Projects',
};

// Ordine fisso dei quadranti su ogni spira (0-90 research, 90-180 tools, ...).
export const FIELD_CATEGORY_ORDER: FieldCategory[] = ['research', 'tools', 'teaching', 'projects'];

export type FieldMarker = {
  id: string;
  category: FieldCategory;
  title: string;
};

export type FieldYear = {
  year: number;
  markers: FieldMarker[];
};

// Generatore seedato: dati fittizi ma stabili tra un reload e l'altro,
// così il comportamento della scena resta riproducibile durante lo sviluppo.
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CURRENT_YEAR = 2026;
const CANDIDATE_YEARS = 10;

export function getFieldsTimeline(): FieldYear[] {
  const random = mulberry32(20260818);
  const timeline: FieldYear[] = [];

  for (let i = 0; i < CANDIDATE_YEARS; i++) {
    const year = CURRENT_YEAR - i;
    // Densità decrescente verso gli anni più vecchi, ma non monotona:
    // vogliamo stressare la scena con distribuzioni irregolari, non simmetriche.
    const yearHasContent = i === 0 || random() > 0.15;
    if (!yearHasContent) continue;

    const markers: FieldMarker[] = [];
    for (const category of FIELD_CATEGORY_ORDER) {
      const intensity = Math.max(0, 1 - i / CANDIDATE_YEARS);
      const count = Math.round(random() * (1 + intensity * 4));
      for (let j = 0; j < count; j++) {
        markers.push({
          id: `${year}-${category}-${j}`,
          category,
          title: `${FIELD_CATEGORY_LABELS[category]} item ${j + 1} · ${year}`,
        });
      }
    }

    if (markers.length > 0) {
      timeline.push({ year, markers });
    }
  }

  return timeline;
}
