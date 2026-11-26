import { z } from "zod";

export const collectionMetadataSchema = z.object({
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

export const createCollectionSchema = collectionMetadataSchema;
export const updateCollectionSchema = collectionMetadataSchema;

export type CreateCollectionInput = z.infer<typeof createCollectionSchema>;
export type UpdateCollectionInput = z.infer<typeof updateCollectionSchema>;

export interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}
