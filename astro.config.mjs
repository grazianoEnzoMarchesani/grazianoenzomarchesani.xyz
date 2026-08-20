import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import integrazionePubblicazioni from './scripts/integrazione-pubblicazioni.mjs';
import integrazionePatternSfondi from './scripts/integrazione-pattern-sfondi.mjs';
import integrazioneFavicon from './scripts/integrazione-favicon.mjs';
import integrazioneRicerca from './scripts/integrazione-ricerca.mjs';

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
  integrations: [react(), mdx(), integrazionePubblicazioni(), integrazionePatternSfondi(), integrazioneFavicon(), integrazioneRicerca()],

  vite: {
    plugins: [tailwindcss()]
  }
});