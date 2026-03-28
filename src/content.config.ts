import { defineCollection, z } from "astro:content";

const writing = defineCollection({
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishedAt: z.string().optional(),
  }),
});

export const collections = {
  writing,
};

