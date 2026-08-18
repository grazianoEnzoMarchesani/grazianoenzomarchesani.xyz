import { getCollection } from 'astro:content';
import type { FieldCategory, FieldMarker, FieldYear } from './fields';

/**
 * Costruisce la timeline reale di Fields dalle quattro content collection.
 *
 * Usa `astro:content`, disponibile solo lato server/build — va importato
 * solo dal frontmatter di un componente Astro, mai da uno `<script>`
 * lato client (vedi `fields.astro`, che serializza il risultato in un
 * tag JSON per lo script della spirale 3D).
 */

function firstYear(text: string): number | null {
  const match = text.match(/\d{4}/);
  return match ? Number(match[0]) : null;
}

function addMarker(
  byYear: Map<number, FieldMarker[]>,
  year: number | null,
  category: FieldCategory,
  slug: string,
  title: string,
) {
  if (year === null) return;
  const marker: FieldMarker = { id: `${category}/${slug}`, category, title };
  const markers = byYear.get(year) ?? [];
  markers.push(marker);
  byYear.set(year, markers);
}

export async function getFieldsTimeline(): Promise<FieldYear[]> {
  const [research, tools, teaching, projects] = await Promise.all([
    getCollection('research'),
    getCollection('tools'),
    getCollection('teaching'),
    getCollection('projects'),
  ]);

  const byYear = new Map<number, FieldMarker[]>();

  for (const entry of research) {
    addMarker(byYear, entry.data.data.getFullYear(), 'research', entry.id, entry.data.titolo);
  }
  for (const entry of tools) {
    addMarker(byYear, entry.data.data.getFullYear(), 'tools', entry.id, entry.data.nome);
  }
  for (const entry of teaching) {
    addMarker(byYear, firstYear(entry.data.anni), 'teaching', entry.id, entry.data.titolo);
  }
  for (const entry of projects) {
    addMarker(byYear, firstYear(entry.data.anni), 'projects', entry.id, entry.data.titolo);
  }

  const years = [...byYear.keys()].sort((a, b) => b - a);
  return years.map((year) => ({ year, markers: byYear.get(year)! }));
}

/**
 * Ritorna tutti i marker ordinati esattamente secondo l'ordine di posizionamento
 * lungo la spirale (anno decrescente -> categorie in FIELD_CATEGORY_ORDER -> marker).
 */
export async function getOrderedFieldMarkers(): Promise<FieldMarker[]> {
  const timeline = await getFieldsTimeline();
  const ordered: FieldMarker[] = [];

  for (const yearData of timeline) {
    const byCategory = new Map<FieldCategory, FieldMarker[]>();
    for (const marker of yearData.markers) {
      if (!byCategory.has(marker.category)) byCategory.set(marker.category, []);
      byCategory.get(marker.category)!.push(marker);
    }

    for (const category of ['research', 'tools', 'teaching', 'projects'] as FieldCategory[]) {
      const markers = byCategory.get(category) ?? [];
      for (const m of markers) {
        ordered.push(m);
      }
    }
  }

  return ordered;
}

export async function getAdjacentFieldMarker(currentId: string): Promise<{ next?: FieldMarker; prev?: FieldMarker }> {
  const list = await getOrderedFieldMarkers();
  const index = list.findIndex((m) => m.id === currentId);
  if (index === -1) return {};
  return {
    prev: index > 0 ? list[index - 1] : undefined,
    next: index < list.length - 1 ? list[index + 1] : undefined,
  };
}

