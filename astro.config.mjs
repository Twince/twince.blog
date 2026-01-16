// @ts-check
import { defineConfig } from 'astro/config';
import { rehypeToc } from './src/plugins/rehypToc';

import react from '@astrojs/react';

import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  integrations: [react()],

  markdown: {
    rehypePlugins: [
      rehypeToc
    ],
  },

  vite: {
    plugins: [tailwindcss()],
  },
});