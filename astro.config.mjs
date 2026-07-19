// @ts-check
import { defineConfig } from 'astro/config';
import { rehypeImgToFigure } from './src/plugins/rehypeImgToFigure';
import { rehypeToc } from './src/plugins/rehypeToc';
import { rehypeFootnotesToggle } from './src/plugins/rehypeFootnotesToggle';

import react from '@astrojs/react';
import _icon from 'astro-icon'
import svgr from 'vite-plugin-svgr';

import tailwindcss from '@tailwindcss/vite';

/** @type {any} */
const icon = _icon;

export default defineConfig({
  site: 'https://www.twince.me', // canonical URL·sitemap·OG의 기준 — GitHub Pages + Cloudflare DNS
  integrations: [react(), icon({iconDir: 'src/ui/assets/icons',})],
  markdown: {
    rehypePlugins: [
      rehypeImgToFigure,
      rehypeToc,
      rehypeFootnotesToggle
    ],
  },
  vite: {
    plugins: [tailwindcss(), svgr()],
  },
});