import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { bindSingleLetterWords } from "@/i18n/typography";

const prose = z.string().min(1).transform(bindSingleLetterWords);

const projects = defineCollection({
  loader: glob({ base: "./src/content/projects", pattern: "{pl,en}/*.md" }),
  schema: ({ image }) =>
    z.object({
      project: z.enum(["fixflow-api", "fixflow-web", "fixflow-mobile"]),
      order: z.number().int().positive(),
      title: z.string().min(1),
      summary: prose,
      stack: z.array(z.string().min(1)).min(1),
      decisions: z
        .array(z.object({ title: prose, body: prose }))
        .min(3)
        .max(5),
      links: z.object({
        repository: z.url(),
        demo: z.url().optional(),
        release: z.url().optional(),
        docs: z.url().optional(),
      }),
      demo: prose,
      architectureDiagram: z.boolean().default(false),
      cover: z.object({ image: image(), alt: z.string().min(1) }).optional(),
      screenshots: z
        .array(
          z.object({
            image: image(),
            alt: z.string().min(1),
            caption: prose,
            device: z.enum(["desktop", "phone"]),
          }),
        )
        .default([]),
      video: z
        .object({
          file: z.string().min(1),
          poster: image(),
          alt: z.string().min(1),
          device: z.enum(["desktop", "phone"]),
        })
        .optional(),
    }),
});

export const collections = { projects };
