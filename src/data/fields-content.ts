import { getCollection } from 'astro:content';
import type { FieldCategory, FieldMarker, FieldYear } from './fields';
import { perLingua } from '../lib/contenuti';
import { type Lingua, linguaDefault } from '../i18n/testi';

/**
 * Costruisce la timeline reale di Fields dalle quattro content collection
 * per la lingua richiesta (con fallback su inglese).
 */

function firstYear(text: string): number | null {
  const match = text.match(/\d{4}/);
  return match ? Number(match[0]) : null;
}

function seededFraction(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}

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

export async function getFieldsTimeline(lingua: Lingua | string = linguaDefault): Promise<FieldYear[]> {
  const [rawResearch, rawTools, rawTeaching, rawProjects] = await Promise.all([
    getCollection('research'),
    getCollection('tools'),
    getCollection('teaching'),
    getCollection('projects'),
  ]);

  const research = perLingua(rawResearch, lingua);
  const tools = perLingua(rawTools, lingua);
  const teaching = perLingua(rawTeaching, lingua);
  const projects = perLingua(rawProjects, lingua);

  const byYear = new Map<number, FieldMarker[]>();

  for (const entry of research) {
    addMarker(byYear, entry.data.data.getFullYear(), 'research', entry.chiave, entry.data.titolo, entry.data.data);
  }
  for (const entry of tools) {
    addMarker(byYear, entry.data.data.getFullYear(), 'tools', entry.chiave, entry.data.nome, entry.data.data);
  }
  for (const entry of teaching) {
    addMarker(byYear, firstYear(entry.data.anni), 'teaching', entry.chiave, entry.data.titolo, entry.data.data);
  }
  for (const entry of projects) {
    addMarker(byYear, firstYear(entry.data.anni), 'projects', entry.chiave, entry.data.titolo, entry.data.data);
  }

  const years = [...byYear.keys()].sort((a, b) => b - a);
  return years.map((year) => ({
    year,
    markers: byYear.get(year)!.sort((a, b) => a.yearFraction - b.yearFraction),
  }));
}

export async function getOrderedFieldMarkers(lingua: Lingua | string = linguaDefault): Promise<FieldMarker[]> {
  const timeline = await getFieldsTimeline(lingua);
  return timeline.flatMap((yearData) => yearData.markers);
}

export async function getAdjacentFieldMarker(
  currentId: string,
  lingua: Lingua | string = linguaDefault,
): Promise<{ next?: FieldMarker; prev?: FieldMarker }> {
  const list = await getOrderedFieldMarkers(lingua);
  const index = list.findIndex((m) => m.id === currentId);
  if (index === -1) return {};
  return {
    prev: index > 0 ? list[index - 1] : undefined,
    next: index < list.length - 1 ? list[index + 1] : undefined,
  };
}
