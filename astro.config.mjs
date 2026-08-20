import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import integrazionePubblicazioni from './scripts/integrazione-pubblicazioni.mjs';
import integrazionePatternSfondi from './scripts/integrazione-pattern-sfondi.mjs';
import integrazioneFavicon from './scripts/integrazione-favicon.mjs';

// https://astro.build/config
export default defineConfig({
  integrations: [react(), mdx(), integrazionePubblicazioni(), integrazionePatternSfondi(), integrazioneFavicon()],

  vite: {
    plugins: [tailwindcss()]
  }
});