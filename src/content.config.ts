import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const caseStudies = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './content/case-studies' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    org: z.string(),
    role: z.string(),
    launched: z.coerce.date(),
    published: z.coerce.date().optional(),
    metricsAsOf: z.coerce.date().optional(),
    status: z.string().optional(),
    tools: z.array(z.string()),
    metrics: z
      .array(z.object({ value: z.string(), label: z.string(), note: z.string().optional() }))
      .default([]),
    // Optional: steps of the system, left to right. Drives the interactive 3D scene at the top of the page.
    pipeline: z
      .array(z.object({
        label: z.string(),
        detail: z.string(),
        owner: z.string().optional(),            // e.g. "IP Ops"
        mine: z.boolean().default(false),        // highlight the part I built
        icon: z.enum(['form', 'flow', 'database', 'systems', 'generic']).default('generic'),
        lanes: z.array(z.string()).default([]),  // parallel paths inside this step
        failure: z.string().optional(),          // what happens when this step fails
      }))
      .default([]),
    order: z.number().default(100),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

export const collections = { caseStudies };
