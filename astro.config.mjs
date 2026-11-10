// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://jessjvwcareerportfolio.netlify.app',
  markdown: {
    // Mermaid blocks are rendered client-side; skip syntax highlighting for them
    syntaxHighlight: { type: 'shiki', excludeLangs: ['mermaid'] },
  },
});
