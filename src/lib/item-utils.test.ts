import { describe, it, expect } from "vitest";
import {
  normalizeItemTypeSlug,
  formatItemTypeTitle,
  getItemTypeDescription,
  isProType,
  itemTypeIconMap,
  formatLongDate,
  normalizeMonacoLanguage,
  isCodeItemType,
  isMarkdownItemType,
  isFileItemType,
  isImageItemType,
  formatFileSize,
  getFileExtension,
  getFileIconInfo,
} from "@/lib/item-utils";
import {
  FileText,
  FileCode,
  FileArchive,
  FileSpreadsheet,
  FileImage,
  FileAudio,
  FileVideo,
  File,
} from "lucide-react";

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

  describe("normalizeMonacoLanguage", () => {
    it("maps shorthand aliases to Monaco language names", () => {
      expect(normalizeMonacoLanguage("js")).toBe("javascript");
      expect(normalizeMonacoLanguage("ts")).toBe("typescript");
      expect(normalizeMonacoLanguage("py")).toBe("python");
      expect(normalizeMonacoLanguage("bash")).toBe("shell");
      expect(normalizeMonacoLanguage("zsh")).toBe("shell");
      expect(normalizeMonacoLanguage("sh")).toBe("shell");
      expect(normalizeMonacoLanguage("c#")).toBe("csharp");
      expect(normalizeMonacoLanguage("c++")).toBe("cpp");
      expect(normalizeMonacoLanguage("yml")).toBe("yaml");
      expect(normalizeMonacoLanguage("md")).toBe("markdown");
      expect(normalizeMonacoLanguage("docker")).toBe("dockerfile");
    });

    it("returns standard languages as lowercase", () => {
      expect(normalizeMonacoLanguage("TypeScript")).toBe("typescript");
      expect(normalizeMonacoLanguage("PYTHON")).toBe("python");
      expect(normalizeMonacoLanguage("json")).toBe("json");
      expect(normalizeMonacoLanguage("html")).toBe("html");
      expect(normalizeMonacoLanguage("css")).toBe("css");
      expect(normalizeMonacoLanguage("sql")).toBe("sql");
    });

    it("returns plaintext for null, undefined, or empty strings", () => {
      expect(normalizeMonacoLanguage(null)).toBe("plaintext");
      expect(normalizeMonacoLanguage(undefined)).toBe("plaintext");
      expect(normalizeMonacoLanguage("")).toBe("plaintext");
      expect(normalizeMonacoLanguage("   ")).toBe("plaintext");
    });
  });

  describe("isCodeItemType", () => {
    it("returns true for code-oriented types", () => {
      expect(isCodeItemType("snippet")).toBe(true);
      expect(isCodeItemType("snippets")).toBe(true);
      expect(isCodeItemType("command")).toBe(true);
      expect(isCodeItemType("commands")).toBe(true);
      expect(isCodeItemType("code")).toBe(true);
      expect(isCodeItemType("terminal")).toBe(true);
    });

    it("returns false for non-code types", () => {
      expect(isCodeItemType("note")).toBe(false);
      expect(isCodeItemType("prompt")).toBe(false);
      expect(isCodeItemType("link")).toBe(false);
      expect(isCodeItemType("file")).toBe(false);
      expect(isCodeItemType("image")).toBe(false);
      expect(isCodeItemType(null)).toBe(false);
      expect(isCodeItemType(undefined)).toBe(false);
    });
  });

  describe("isMarkdownItemType", () => {
    it("returns true for markdown-oriented types", () => {
      expect(isMarkdownItemType("note")).toBe(true);
      expect(isMarkdownItemType("notes")).toBe(true);
      expect(isMarkdownItemType("prompt")).toBe(true);
      expect(isMarkdownItemType("prompts")).toBe(true);
      expect(isMarkdownItemType("stickynote")).toBe(true);
      expect(isMarkdownItemType("sparkles")).toBe(true);
    });

    it("returns false for non-markdown types", () => {
      expect(isMarkdownItemType("snippet")).toBe(false);
      expect(isMarkdownItemType("command")).toBe(false);
      expect(isMarkdownItemType("link")).toBe(false);
      expect(isMarkdownItemType("file")).toBe(false);
      expect(isMarkdownItemType("image")).toBe(false);
      expect(isMarkdownItemType(null)).toBe(false);
      expect(isMarkdownItemType(undefined)).toBe(false);
    });
  });

  describe("isFileItemType", () => {
    it("returns true for file types", () => {
      expect(isFileItemType("file")).toBe(true);
      expect(isFileItemType("files")).toBe(true);
      expect(isFileItemType("FILE")).toBe(true);
    });

    it("returns false for non-file types", () => {
      expect(isFileItemType("image")).toBe(false);
      expect(isFileItemType("snippet")).toBe(false);
      expect(isFileItemType(null)).toBe(false);
    });
  });

  describe("isImageItemType", () => {
    it("returns true for image types", () => {
      expect(isImageItemType("image")).toBe(true);
      expect(isImageItemType("images")).toBe(true);
      expect(isImageItemType("IMAGE")).toBe(true);
    });

    it("returns false for non-image types", () => {
      expect(isImageItemType("file")).toBe(false);
      expect(isImageItemType("snippet")).toBe(false);
      expect(isImageItemType(null)).toBe(false);
    });
  });

  describe("formatFileSize", () => {
    it("formats 0 bytes or invalid numbers properly", () => {
      expect(formatFileSize(0)).toBe("0 B");
      expect(formatFileSize(-100)).toBe("0 B");
      expect(formatFileSize(null)).toBe("0 B");
      expect(formatFileSize(undefined)).toBe("0 B");
    });

    it("formats bytes, kilobytes, and megabytes", () => {
      expect(formatFileSize(500)).toBe("500 B");
      expect(formatFileSize(1024)).toBe("1.0 KB");
      expect(formatFileSize(1536)).toBe("1.5 KB");
      expect(formatFileSize(1048576)).toBe("1.0 MB");
      expect(formatFileSize(5242880)).toBe("5.0 MB");
    });
  });

  describe("getFileExtension", () => {
    it("extracts extension correctly from simple filenames", () => {
      expect(getFileExtension("document.pdf")).toBe("pdf");
      expect(getFileExtension("archive.tar.gz")).toBe("gz");
      expect(getFileExtension("script.TS")).toBe("ts");
      expect(getFileExtension("data.csv")).toBe("csv");
    });

    it("extracts extension correctly from URLs or full paths", () => {
      expect(
        getFileExtension("https://r2.devstash.io/uploads/user-1/file.xlsx?token=abc#hash"),
      ).toBe("xlsx");
      expect(getFileExtension("C:\\projects\\devstash\\config.json")).toBe("json");
      expect(getFileExtension("uploads/user-123/172900-report.doc")).toBe("doc");
    });

    it("handles dotfiles correctly", () => {
      expect(getFileExtension(".env")).toBe("env");
      expect(getFileExtension(".gitignore")).toBe("gitignore");
    });

    it("returns empty string for files without extension or null/undefined", () => {
      expect(getFileExtension("Dockerfile")).toBe("");
      expect(getFileExtension("README")).toBe("");
      expect(getFileExtension(null)).toBe("");
      expect(getFileExtension(undefined)).toBe("");
      expect(getFileExtension("")).toBe("");
    });
  });

  describe("getFileIconInfo", () => {
    it("returns PDF icon and red styling for PDF files", () => {
      const info = getFileIconInfo("report.pdf");
      expect(info.icon).toBe(FileText);
      expect(info.colorClass).toContain("text-red-400");
      expect(info.category).toBe("PDF Document");
      expect(info.extension).toBe("pdf");
    });

    it("returns Code icon and sky styling for code and config files", () => {
      const infoTs = getFileIconInfo("app.tsx");
      expect(infoTs.icon).toBe(FileCode);
      expect(infoTs.colorClass).toContain("text-sky-400");
      expect(infoTs.category).toBe("Code & Config");

      const infoJson = getFileIconInfo("package.json");
      expect(infoJson.icon).toBe(FileCode);

      const infoEnv = getFileIconInfo(".env");
      expect(infoEnv.icon).toBe(FileCode);
    });

    it("returns Archive icon and amber styling for compressed files", () => {
      const infoZip = getFileIconInfo("backup.zip");
      expect(infoZip.icon).toBe(FileArchive);
      expect(infoZip.colorClass).toContain("text-amber-400");
      expect(infoZip.category).toBe("Archive");

      const infoTar = getFileIconInfo("archive.tar.gz");
      expect(infoTar.icon).toBe(FileArchive);
    });

    it("returns Spreadsheet icon and emerald styling for spreadsheet files", () => {
      const infoCsv = getFileIconInfo("dataset.csv");
      expect(infoCsv.icon).toBe(FileSpreadsheet);
      expect(infoCsv.colorClass).toContain("text-emerald-400");
      expect(infoCsv.category).toBe("Spreadsheet");

      const infoXlsx = getFileIconInfo("budget.xlsx");
      expect(infoXlsx.icon).toBe(FileSpreadsheet);
    });

    it("returns Document icon and blue styling for word documents and markdown", () => {
      const infoDoc = getFileIconInfo("notes.docx");
      expect(infoDoc.icon).toBe(FileText);
      expect(infoDoc.colorClass).toContain("text-blue-400");
      expect(infoDoc.category).toBe("Document");

      const infoMd = getFileIconInfo("README.md");
      expect(infoMd.icon).toBe(FileText);
    });

    it("returns Image icon and pink styling for image files", () => {
      const infoImg = getFileIconInfo("screenshot.png");
      expect(infoImg.icon).toBe(FileImage);
      expect(infoImg.colorClass).toContain("text-pink-400");
      expect(infoImg.category).toBe("Image");
    });

    it("returns Audio icon and purple styling for audio files", () => {
      const infoAudio = getFileIconInfo("podcast.mp3");
      expect(infoAudio.icon).toBe(FileAudio);
      expect(infoAudio.colorClass).toContain("text-purple-400");
      expect(infoAudio.category).toBe("Audio");
    });

    it("returns Video icon and rose styling for video files", () => {
      const infoVideo = getFileIconInfo("demo.mp4");
      expect(infoVideo.icon).toBe(FileVideo);
      expect(infoVideo.colorClass).toContain("text-rose-400");
      expect(infoVideo.category).toBe("Video");
    });

    it("falls back to generic File icon and indigo styling for unknown files", () => {
      const infoUnknown = getFileIconInfo("unknown-binary.bin");
      expect(infoUnknown.icon).toBe(File);
      expect(infoUnknown.colorClass).toContain("text-indigo-400");
      expect(infoUnknown.category).toBe("File");

      const infoNoExt = getFileIconInfo("NO_EXTENSION_FILE");
      expect(infoNoExt.icon).toBe(File);
    });
  });
});
