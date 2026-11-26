import { z } from "zod";

export const createCollectionSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Collection name is required")
    .max(100, "Collection name must be 100 characters or less"),
  description: z
    .string()
    .trim()
    .max(1000, "Description must be 1000 characters or less")
    .nullable()
    .optional(),
});

export type CreateCollectionInput = z.infer<typeof createCollectionSchema>;
