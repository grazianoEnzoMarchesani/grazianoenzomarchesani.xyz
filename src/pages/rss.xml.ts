import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { identita } from '../lib/identita';
import { getFieldsRssItems } from '../lib/rss';

export async function GET(context: APIContext) {
  const items = await getFieldsRssItems();

  return rss({
    title: `${identita.nome} — Fields`,
    description: 'Research, tools, teaching, and design projects by Graziano Enzo Marchesani.',
    site: context.site!,
    stylesheet: '/rss.xsl',
    items: items.map((item) => ({
      title: item.title,
      description: item.description,
      pubDate: item.pubDate,
      link: item.link,
      categories: item.categories,
    })),
    customData: `<language>en</language>`,
  });
}
