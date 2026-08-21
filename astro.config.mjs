import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import integrazionePubblicazioni from './scripts/integrazione-pubblicazioni.mjs';
import integrazionePatternSfondi from './scripts/integrazione-pattern-sfondi.mjs';
import integrazioneFavicon from './scripts/integrazione-favicon.mjs';
import integrazioneRicerca from './scripts/integrazione-ricerca.mjs';
import { remarkArticolo } from './src/lib/remark-articolo.ts';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// https://astro.build/config
export default defineConfig({
  site: 'https://grazianoenzomarchesani.xyz',
  i18n: {
    locales: ['en', 'it'],
    defaultLocale: 'en',
    routing: {
      prefixDefaultLocale: false,
      fallbackType: 'rewrite',
    },
    fallback: {
      it: 'en',
    },
  },
  markdown: {
    remarkPlugins: [remarkArticolo, remarkMath],
    // KaTeX renderizza al build: in pagina finiscono HTML e CSS, zero JS a runtime.
    rehypePlugins: [rehypeKatex],
  },

  integrations: [react(), mdx(), integrazionePubblicazioni(), integrazionePatternSfondi(), integrazioneFavicon(), integrazioneRicerca()],

  vite: {
    plugins: [tailwindcss()]
  }
});