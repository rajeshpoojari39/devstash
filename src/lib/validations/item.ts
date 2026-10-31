import { z } from "zod";

export const createItemSchema = z
  .object({
    type: z.enum(
      ["snippet", "prompt", "command", "note", "link", "file", "image"],
      {
        message:
          "Item type must be one of: snippet, prompt, command, note, link, file, image",
      },
    ),
    title: z.string().trim().min(1, "Title is required"),
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
    fileUrl: z.string().trim().nullable().optional(),
    fileName: z.string().trim().nullable().optional(),
    fileSize: z.number().int().nonnegative().nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "link") {
      if (!data.url || !data.url.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "URL is required for links",
          path: ["url"],
        });
      }
    }

    if (data.type === "file" || data.type === "image") {
      if (!data.fileUrl || !data.fileUrl.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `A file upload is required for ${data.type} items.`,
          path: ["fileUrl"],
        });
      }
    }
  });

export type CreateItemInput = z.infer<typeof createItemSchema>;

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
  fileUrl: z.string().trim().nullable().optional(),
  fileName: z.string().trim().nullable().optional(),
  fileSize: z.number().int().nonnegative().nullable().optional(),
});

export type UpdateItemInput = z.infer<typeof updateItemSchema>;

export interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}
