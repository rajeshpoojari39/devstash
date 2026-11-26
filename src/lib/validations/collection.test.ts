import { describe, it, expect } from "vitest";
import {
  createCollectionSchema,
  updateCollectionSchema,
} from "@/lib/validations/collection";

describe("createCollectionSchema validation", () => {
  it("validates a valid collection payload with name and description", () => {
    const result = createCollectionSchema.safeParse({
      name: "  React Patterns  ",
      description: "  Reusable hooks and components  ",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("React Patterns");
      expect(result.data.description).toBe("Reusable hooks and components");
    }
  });

  it("validates a collection payload with only a name", () => {
    const result = createCollectionSchema.safeParse({
      name: "DevOps",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("DevOps");
      expect(result.data.description).toBeUndefined();
    }
  });

  it("allows null or empty description", () => {
    const nullResult = createCollectionSchema.safeParse({
      name: "AI Prompts",
      description: null,
    });
    expect(nullResult.success).toBe(true);

    const emptyResult = createCollectionSchema.safeParse({
      name: "AI Prompts",
      description: "   ",
    });
    expect(emptyResult.success).toBe(true);
    if (emptyResult.success) {
      expect(emptyResult.data.description).toBe("");
    }
  });

  it("fails when name is missing or whitespace-only", () => {
    const missing = createCollectionSchema.safeParse({});
    expect(missing.success).toBe(false);

    const empty = createCollectionSchema.safeParse({ name: "" });
    expect(empty.success).toBe(false);

    const whitespace = createCollectionSchema.safeParse({ name: "   " });
    expect(whitespace.success).toBe(false);
  });

  it("fails when name exceeds 100 characters", () => {
    const result = createCollectionSchema.safeParse({
      name: "a".repeat(101),
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("100 characters");
    }
  });

  it("fails when description exceeds 1000 characters", () => {
    const result = createCollectionSchema.safeParse({
      name: "Valid Name",
      description: "a".repeat(1001),
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("1000 characters");
    }
  });
});

describe("updateCollectionSchema validation", () => {
  it("validates updated name and nullable description", () => {
    const result = updateCollectionSchema.safeParse({
      name: "  Updated Collection  ",
      description: null,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Updated Collection");
      expect(result.data.description).toBeNull();
    }
  });

  it("rejects empty name on update", () => {
    const result = updateCollectionSchema.safeParse({
      name: "   ",
      description: "Valid description",
    });

    expect(result.success).toBe(false);
  });

  it("accepts boundary lengths (100 char name and 1000 char description) and rejects 1001 char description", () => {
    const validBoundary = updateCollectionSchema.safeParse({
      name: "a".repeat(100),
      description: "b".repeat(1000),
    });
    expect(validBoundary.success).toBe(true);

    const invalidDesc = updateCollectionSchema.safeParse({
      name: "Valid",
      description: "b".repeat(1001),
    });
    expect(invalidDesc.success).toBe(false);
  });
});
