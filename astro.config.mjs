import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import basicSsl from '@vitejs/plugin-basic-ssl';
import mdx from '@astrojs/mdx';
import integrazionePubblicazioni from './scripts/integrazione-pubblicazioni.mjs';
import integrazionePatternSfondi from './scripts/integrazione-pattern-sfondi.mjs';
import integrazioneFavicon from './scripts/integrazione-favicon.mjs';
import integrazioneRicerca from './scripts/integrazione-ricerca.mjs';
import integrazioneMotoreRicerca from './scripts/integrazione-motore-ricerca.mjs';
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

  integrations: [react(), mdx(), integrazionePubblicazioni(), integrazionePatternSfondi(), integrazioneFavicon(), integrazioneRicerca(), integrazioneMotoreRicerca()],

  vite: {
    plugins: [
      tailwindcss(),
      // HTTPS con certificato autofirmato, solo sul dev server (`apply: 'serve'`
      // lo esclude dal build). Serve per i test da telefono: raggiunto via IP di
      // LAN in HTTP semplice il sito non è un secure context, quindi Web Share,
      // Cache API, service worker e crypto.subtle risultano assenti proprio dove
      // vanno provati. Il browser mostrerà un avviso sul certificato: dopo averlo
      // accettato l'origine vale come sicura. Vedi docs/brain/constraints.md.
      { ...basicSsl(), apply: 'serve' },
    ],
  }
});