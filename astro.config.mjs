// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  // TODO: replace with your Netlify URL or custom domain once assigned
  site: 'https://example.netlify.app',
  markdown: {
    // Mermaid blocks are rendered client-side; skip syntax highlighting for them
    syntaxHighlight: { type: 'shiki', excludeLangs: ['mermaid'] },
  },
});
