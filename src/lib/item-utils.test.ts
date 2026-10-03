import { describe, it, expect } from "vitest";
import {
  normalizeItemTypeSlug,
  formatItemTypeTitle,
  getItemTypeDescription,
  isProType,
  itemTypeIconMap,
  formatLongDate,
} from "@/lib/item-utils";

describe("item-utils", () => {
  describe("normalizeItemTypeSlug", () => {
    it("converts plural item type slugs to singular form", () => {
      expect(normalizeItemTypeSlug("snippets")).toBe("snippet");
      expect(normalizeItemTypeSlug("prompts")).toBe("prompt");
      expect(normalizeItemTypeSlug("commands")).toBe("command");
      expect(normalizeItemTypeSlug("notes")).toBe("note");
      expect(normalizeItemTypeSlug("files")).toBe("file");
      expect(normalizeItemTypeSlug("images")).toBe("image");
      expect(normalizeItemTypeSlug("links")).toBe("link");
    });

    it("handles whitespace and uppercase letters", () => {
      expect(normalizeItemTypeSlug("  SNIPPETS  ")).toBe("snippet");
      expect(normalizeItemTypeSlug("Prompts")).toBe("prompt");
    });

    it("leaves already singular or unknown slugs unchanged", () => {
      expect(normalizeItemTypeSlug("snippet")).toBe("snippet");
      expect(normalizeItemTypeSlug("custom-type")).toBe("custom-type");
    });
  });

  describe("formatItemTypeTitle", () => {
    it("returns proper pluralized display title for system item types", () => {
      expect(formatItemTypeTitle("snippet")).toBe("Snippets");
      expect(formatItemTypeTitle("prompt")).toBe("Prompts");
      expect(formatItemTypeTitle("command")).toBe("Commands");
      expect(formatItemTypeTitle("note")).toBe("Notes");
      expect(formatItemTypeTitle("file")).toBe("Files");
      expect(formatItemTypeTitle("image")).toBe("Images");
      expect(formatItemTypeTitle("link")).toBe("Links");
    });

    it("capitalizes custom item type names gracefully", () => {
      expect(formatItemTypeTitle("workflow")).toBe("Workflow");
      expect(formatItemTypeTitle("database")).toBe("Database");
    });
  });

  describe("getItemTypeDescription", () => {
    it("returns correct predefined description for known item types", () => {
      expect(getItemTypeDescription("snippet")).toContain(
        "Reusable code snippets",
      );
      expect(getItemTypeDescription("prompt")).toContain("System prompts");
      expect(getItemTypeDescription("command")).toContain("CLI commands");
      expect(getItemTypeDescription("note")).toContain("Quick developer notes");
      expect(getItemTypeDescription("file")).toContain("Configurations");
      expect(getItemTypeDescription("image")).toContain("Screenshots");
      expect(getItemTypeDescription("link")).toContain("Curated web links");
    });

    it("provides fallback description for unknown item types", () => {
      expect(getItemTypeDescription("custom")).toBe(
        "Manage and browse all saved custom resources.",
      );
    });
  });

  describe("isProType", () => {
    it("returns true for pro item types (file, files, image, images)", () => {
      expect(isProType("file")).toBe(true);
      expect(isProType("files")).toBe(true);
      expect(isProType("image")).toBe(true);
      expect(isProType("images")).toBe(true);
      expect(isProType("FILE")).toBe(true);
      expect(isProType("Images")).toBe(true);
    });

    it("returns false for free item types and unknown types", () => {
      expect(isProType("snippet")).toBe(false);
      expect(isProType("snippets")).toBe(false);
      expect(isProType("prompt")).toBe(false);
      expect(isProType("command")).toBe(false);
      expect(isProType("note")).toBe(false);
      expect(isProType("link")).toBe(false);
      expect(isProType("custom")).toBe(false);
    });
  });

  describe("itemTypeIconMap", () => {
    it("contains icon mappings for both uppercase PascalCase and lowercase names", () => {
      expect(itemTypeIconMap["snippet"]).toBeDefined();
      expect(itemTypeIconMap["Code"]).toBeDefined();
      expect(itemTypeIconMap["prompt"]).toBeDefined();
      expect(itemTypeIconMap["Sparkles"]).toBeDefined();
      expect(itemTypeIconMap["command"]).toBeDefined();
      expect(itemTypeIconMap["Terminal"]).toBeDefined();
      expect(itemTypeIconMap["file"]).toBeDefined();
      expect(itemTypeIconMap["File"]).toBeDefined();
      expect(itemTypeIconMap["image"]).toBeDefined();
      expect(itemTypeIconMap["Image"]).toBeDefined();
      expect(itemTypeIconMap["link"]).toBeDefined();
      expect(itemTypeIconMap["Link"]).toBeDefined();
    });
  });

  describe("formatLongDate", () => {
    it("formats Date object into long human-readable date", () => {
      const date = new Date(2026, 0, 15); // January 15, 2026
      expect(formatLongDate(date)).toBe("January 15, 2026");
    });

    it("formats ISO date string into long human-readable date", () => {
      expect(formatLongDate("2024-05-20T00:00:00Z")).toContain("2024");
      expect(formatLongDate("2024-05-20T00:00:00Z")).toContain("May");
    });

    it("returns empty string for invalid date inputs", () => {
      expect(formatLongDate("invalid-date")).toBe("");
    });
  });
});
