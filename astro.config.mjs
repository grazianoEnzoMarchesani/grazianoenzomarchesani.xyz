import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import integrazionePubblicazioni from './scripts/integrazione-pubblicazioni.mjs';

// https://astro.build/config
export default defineConfig({
  integrations: [react(), mdx(), integrazionePubblicazioni()],

  vite: {
    plugins: [tailwindcss()]
  }
});