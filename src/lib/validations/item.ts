import { z } from "zod";

export const updateItemSchema = z.object({
  title: z.string().trim().min(1, "Title cannot be empty"),
  description: z.string().trim().nullable().optional(),
  content: z.string().nullable().optional(),
  url: z
    .string()
    .trim()
    .refine(
      (val) => !val || /^(https?:\/\/)/i.test(val),
      "Invalid URL format. URL must start with http:// or https://",
    )
    .nullable()
    .optional()
    .or(z.literal("")),
  language: z.string().trim().nullable().optional(),
  tags: z.array(z.string().trim().min(1, "Tag cannot be empty")).optional(),
});

export type UpdateItemInput = z.infer<typeof updateItemSchema>;

export interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}
