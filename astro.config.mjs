// @ts-check
import { defineConfig } from 'astro/config';
import { rehypeImgToFigure } from './src/plugins/rehypeImgToFigure';
import { rehypeToc } from './src/plugins/rehypeToc';

import react from '@astrojs/react';
import _icon from 'astro-icon'
import svgr from 'vite-plugin-svgr';

import tailwindcss from '@tailwindcss/vite';

/** @type {any} */
const icon = _icon;

export default defineConfig({
  integrations: [react(), icon({iconDir: 'src/ui/assets/icons',})],
  markdown: {
    rehypePlugins: [
      rehypeImgToFigure,
      rehypeToc
    ],
  },
  vite: {
    plugins: [tailwindcss(), svgr()],
  },
});