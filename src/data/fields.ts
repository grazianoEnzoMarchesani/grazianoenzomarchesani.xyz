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
  /** Posizione dentro l'anno, 0 = 1 gennaio, 1 = 31 dicembre. Governa
   *  dove cade il marker lungo il pezzo di corda del suo anno nella
   *  variante mobile di Fields (vedi `src/scripts/fields-spiral.ts`). */
  yearFraction: number;
};

export type FieldYear = {
  year: number;
  markers: FieldMarker[];
};
