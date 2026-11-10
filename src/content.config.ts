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
    status: z.string().optional(),
    tools: z.array(z.string()),
    metrics: z
      .array(z.object({ value: z.string(), label: z.string(), note: z.string().optional() }))
      .default([]),
    order: z.number().default(100),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

export const collections = { caseStudies };
