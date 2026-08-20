import { getCollection } from 'astro:content';
import { perLingua } from './contenuti';

export interface RssItem {
  title: string;
  description: string;
  pubDate: Date;
  link: string;
  categories: string[];
}

function firstYearDate(anni: string): Date {
  const match = anni.match(/\d{4}/);
  const year = match ? Number(match[0]) : 2024;
  return new Date(year, 0, 1);
}

export async function getFieldsRssItems(): Promise<RssItem[]> {
  const [rawResearch, rawTools, rawTeaching, rawProjects] = await Promise.all([
    getCollection('research'),
    getCollection('tools'),
    getCollection('teaching'),
    getCollection('projects'),
  ]);

  const research = perLingua(rawResearch, 'en');
  const tools = perLingua(rawTools, 'en');
  const teaching = perLingua(rawTeaching, 'en');
  const projects = perLingua(rawProjects, 'en');

  const items: RssItem[] = [
    ...research.map((entry) => ({
      title: entry.data.titolo,
      description: entry.data.sommario,
      pubDate: entry.data.data,
      link: `/fields/research/${entry.chiave}`,
      categories: ['Research', ...(entry.data.tag ?? [])],
    })),
    ...tools.map((entry) => ({
      title: entry.data.nome,
      description: entry.data.sommario,
      pubDate: entry.data.data,
      link: `/fields/tools/${entry.chiave}`,
      categories: ['Tools', ...(entry.data.linguaggio ? [entry.data.linguaggio] : []), ...(entry.data.ambiente ?? [])],
    })),
    ...teaching.map((entry) => ({
      title: entry.data.titolo,
      description: entry.data.sommario,
      pubDate: entry.data.data ?? firstYearDate(entry.data.anni),
      link: `/fields/teaching/${entry.chiave}`,
      categories: ['Teaching', entry.data.tipo, entry.data.istituzione],
    })),
    ...projects.map((entry) => ({
      title: entry.data.titolo,
      description: entry.data.sommario,
      pubDate: entry.data.data ?? firstYearDate(entry.data.anni),
      link: `/fields/projects/${entry.chiave}`,
      categories: ['Projects', entry.data.tipo, entry.data.luogo],
    })),
  ];

  // Ordina dal più recente al più vecchio
  return items.sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());
}
