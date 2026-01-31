// @ts-check
import { defineConfig } from 'astro/config';
import { rehypeToc } from './src/plugins/rehypToc';

import react from '@astrojs/react';

export default defineConfig({
  integrations: [react()],
  markdown: {
    rehypePlugins: [
      rehypeToc
    ],
  },
});