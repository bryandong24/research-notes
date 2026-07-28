import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const notes = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/notes" }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    publishedAt: z.coerce.date(),
    eyebrow: z.string(),
    status: z.enum(["preliminary", "work-in-progress", "proposal"]),
    featured: z.boolean().default(false),
    kind: z.enum(["abstract", "concept", "experiment", "analysis", "roadmap"]),
    seriesOrder: z.number().int().min(0),
    readingMinutes: z.number().int().positive()
  })
});

export const collections = { notes };
