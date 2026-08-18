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
