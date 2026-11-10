# Career Portfolio

Portfolio site for Power Platform + AI work in legal operations. Built with Astro, deployed on Netlify (auto-deploys on push).

## Add a case study
1. Copy `content/case-studies/ip-staffing-updates.md` to `content/case-studies/<slug>.md`.
2. Edit the front matter (title, summary, tools, metrics) and the body sections.
3. Put scrubbed screenshots in `public/case-studies/<slug>/` and reference them as `/case-studies/<slug>/file.png`.
4. Diagrams: use a fenced ```` ```mermaid ```` block. They render in the site's colors.
5. Set `draft: true` to hide a case study, `featured: true` to show it on the home page.

## Screenshot mock-ups
Real screenshots contain firm data, so UI screenshots are recreated as HTML in `mockups/` with sample data.
Re-render with `node mockups/render.cjs ip-staffing-updates` (outputs WebP to `public/case-studies/<slug>/`).

## Edit other content
- Name, tagline, LinkedIn URL: `src/data/site.ts`
- Stack page (software + desk setup): `src/data/stack.ts`

## Rules
- Never commit raw flow exports or unscrubbed screenshots. `.gitignore` blocks `raw/`, `_raw/`, and `*.zip`.
