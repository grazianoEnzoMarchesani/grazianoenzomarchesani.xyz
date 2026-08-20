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

/** Frazione deterministica in [0,1) ricavata dall'id (FNV-1a): usata solo
 *  come rete di sicurezza per un contenuto senza `data:` — tutti quelli
 *  esistenti ne hanno una. Deterministica e non casuale a runtime,
 *  altrimenti i marker cambierebbero posizione a ogni build. */
function seededFraction(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}

/** Posizione del contenuto dentro il proprio anno, 0 = 1 gennaio. */
function markerYearFraction(id: string, date?: Date): number {
  if (!date) return seededFraction(id);
  const year = date.getFullYear();
  const start = new Date(year, 0, 1).getTime();
  const end = new Date(year + 1, 0, 1).getTime();
  return (date.getTime() - start) / (end - start);
}

function addMarker(
  byYear: Map<number, FieldMarker[]>,
  year: number | null,
  category: FieldCategory,
  slug: string,
  title: string,
  date?: Date,
) {
  if (year === null) return;
  const id = `${category}/${slug}`;
  const marker: FieldMarker = { id, category, title, yearFraction: markerYearFraction(id, date) };
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
    addMarker(byYear, entry.data.data.getFullYear(), 'research', entry.id, entry.data.titolo, entry.data.data);
  }
  for (const entry of tools) {
    addMarker(byYear, entry.data.data.getFullYear(), 'tools', entry.id, entry.data.nome, entry.data.data);
  }
  // teaching/projects: l'anno resta quello di `anni` (che può essere un
  // intervallo, es. "2025 – 2026"); `data` serve solo a collocare il
  // contenuto dentro quell'anno.
  for (const entry of teaching) {
    addMarker(byYear, firstYear(entry.data.anni), 'teaching', entry.id, entry.data.titolo, entry.data.data);
  }
  for (const entry of projects) {
    addMarker(byYear, firstYear(entry.data.anni), 'projects', entry.id, entry.data.titolo, entry.data.data);
  }

  const years = [...byYear.keys()].sort((a, b) => b - a);
  return years.map((year) => ({
    year,
    markers: byYear.get(year)!.sort((a, b) => a.yearFraction - b.yearFraction),
  }));
}

/**
 * Ritorna tutti i marker ordinati cronologicamente per anno e per data reale.
 */
export async function getOrderedFieldMarkers(): Promise<FieldMarker[]> {
  const timeline = await getFieldsTimeline();
  return timeline.flatMap((yearData) => yearData.markers);
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

