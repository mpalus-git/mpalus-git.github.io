import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const projects = defineCollection({
  loader: glob({ base: "./src/content/projects", pattern: "{pl,en}/*.md" }),
  schema: z.object({
    project: z.enum(["fixflow-api", "fixflow-web", "fixflow-mobile"]),
    order: z.number().int().positive(),
    title: z.string().min(1),
    summary: z.string().min(1),
    stack: z.array(z.string().min(1)).min(1),
    decisions: z
      .array(z.object({ title: z.string().min(1), body: z.string().min(1) }))
      .min(3)
      .max(5),
    links: z.object({
      repository: z.url(),
      demo: z.url().optional(),
      release: z.url().optional(),
      docs: z.url().optional(),
    }),
    demo: z.string().min(1),
  }),
});

export const collections = { projects };
