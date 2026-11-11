// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://jessjjvwcareerportfolio.netlify.app',
  markdown: {
    // Mermaid blocks are rendered client-side; skip syntax highlighting for them
    syntaxHighlight: { type: 'shiki', excludeLangs: ['mermaid'] },
  },
});
