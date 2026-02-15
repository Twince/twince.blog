// @ts-check
import { defineConfig } from 'astro/config';
import { rehypeImgToFigure } from './src/plugins/rehypeImgToFigure';
import { rehypeToc } from './src/plugins/rehypeToc';

import react from '@astrojs/react';

import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  integrations: [react()],

  markdown: {
    rehypePlugins: [
      rehypeImgToFigure,
      rehypeToc
    ],
  },

  vite: {
    plugins: [tailwindcss()],
  },
});