# Career Portfolio

Portfolio site for Power Platform + AI work in legal operations. Built with Astro, deployed on Netlify (auto-deploys on push).

## Add a case study
1. Copy `content/case-studies/ip-staffing-updates.md` to `content/case-studies/<slug>.md`.
2. Edit the front matter (title, summary, tools, metrics) and the body sections.
3. Put scrubbed screenshots in `public/case-studies/<slug>/` and reference them as `/case-studies/<slug>/file.png`.
4. Diagrams: use a fenced ```` ```mermaid ```` block. They render in the site's colors.
5. Set `draft: true` to hide a case study, `featured: true` to show it on the home page.
6. Dates: `published` shows in the details card; `metricsAsOf` adds "Figures as of ..." under the numbers.

### The 3D scene at the top of a case study
Add a `pipeline` list to the front matter: one entry per step of the system, left to right. The page turns it into the interactive 3D scene, and into a plain list of steps where 3D isn't available.

```yaml
pipeline:
  - label: "Microsoft Form"          # name shown under the panel
    detail: "What happens here."     # caption shown when the step is focused
    owner: "IP Ops"                  # optional: shows "Built by IP Ops" ("me" shows "Built by me")
    mine: true                       # optional: highlight the part I built
    icon: form                       # form | flow | database | systems | generic
    lanes: [A, B, C]                 # optional: parallel paths inside the step
    failure: "What happens on failure."  # optional: adds the failure-notice panel
```

Leave `pipeline` out and the page simply opens with the title and numbers.

## Edit other content
- Name, hero headline, tagline, closing call to action, LinkedIn URL: `src/data/site.ts`
- Stack page (software + desk setup): `src/data/stack.ts`. Add `model: 'ultrawide' | 'vertical' | 'landscape' | 'headphones' | 'airpods' | 'ipad'` to a gear item to link it to an object in the 3D desk.
- Colours, type sizes, spacing: the tokens at the top of `src/styles/global.css`

## How the 3D works
- Scenes live in `src/scripts/three/`: `logo.ts` (home hero), `pipeline.ts` (case studies), `desk.ts` (stack page). `core.ts` is the shared setup.
- The 3D library only downloads when a scene is about to scroll into view, and scenes pause when off screen.
- Every scene has a static fallback (no WebGL or no JavaScript), and motion is toned down for visitors who ask for reduced motion.
- The 3D monogram is built from `src/data/logo.ts`, traced from the logo artwork. Vector copies of the logo are in `public/brand/`.

## Screenshot mock-ups
Real screenshots contain firm data, so UI screenshots are recreated as HTML in `mockups/` with sample data.
Re-render with `node mockups/render.cjs ip-staffing-updates` (outputs WebP to `public/case-studies/<slug>/`).

## Rules
- Never commit raw flow exports or unscrubbed screenshots. `.gitignore` blocks `raw/`, `_raw/`, and `*.zip`.
