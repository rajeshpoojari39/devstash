import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  validateFile,
  sanitizeFileName,
  generateR2Key,
  extractR2Key,
  uploadToR2,
  deleteFromR2,
  getObjectFromR2,

} from "./r2";

// Mock S3Client
const mockSend = vi.fn();

vi.mock("@aws-sdk/client-s3", () => {
  return {
    S3Client: vi.fn().mockImplementation(function (this: unknown) {
      return {
        send: mockSend,
      };
    }),
    PutObjectCommand: vi.fn().mockImplementation(function (
      this: unknown,
      input: Record<string, unknown>,
    ) {
      return {
        ...input,
        _type: "PutObjectCommand",
      };
    }),
    DeleteObjectCommand: vi.fn().mockImplementation(function (
      this: unknown,
      input: Record<string, unknown>,
    ) {
      return {
        ...input,
        _type: "DeleteObjectCommand",
      };
    }),
    GetObjectCommand: vi.fn().mockImplementation(function (
      this: unknown,
      input: Record<string, unknown>,
    ) {
      return {
        ...input,
        _type: "GetObjectCommand",
      };
    }),
  };
});

describe("Cloudflare R2 Storage Utility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.R2_ACCOUNT_ID = "mock-account-id";
    process.env.R2_ACCESS_KEY_ID = "mock-access-key";
    process.env.R2_SECRET_ACCESS_KEY = "mock-secret-key";
    process.env.R2_BUCKET_NAME = "devstash-test-bucket";
    process.env.R2_PUBLIC_URL = "https://pub-r2.test.dev";
  });

  describe("validateFile", () => {
    it("validates valid images within size limit", () => {
      const validImage = {
        name: "hero-image.png",
        size: 2 * 1024 * 1024, // 2 MB
        type: "image/png",
      };
      const result = validateFile(validImage, "image");
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("rejects images exceeding 5 MB limit", () => {
      const largeImage = {
        name: "huge-photo.jpg",
        size: 5.5 * 1024 * 1024,
        type: "image/jpeg",
      };
      const result = validateFile(largeImage, "image");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("5 MB limit");
    });

    it("rejects images with unsupported extensions", () => {
      const invalidExt = {
        name: "document.pdf",
        size: 1024,
        type: "application/pdf",
      };
      const result = validateFile(invalidExt, "image");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("Unsupported file extension");
    });

    it("rejects files without extensions", () => {
      const noExt = {
        name: "unknown-file",
        size: 1024,
        type: "text/plain",
      };
      const result = validateFile(noExt, "file");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("valid extension");
    });

    it("rejects empty files (0 bytes)", () => {
      const emptyFile = {
        name: "empty.txt",
        size: 0,
        type: "text/plain",
      };
      const result = validateFile(emptyFile, "file");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("cannot be empty");
    });

    it("validates valid document files within 10 MB limit", () => {
      const validDoc = {
        name: "spec-document.pdf",
        size: 4 * 1024 * 1024, // 4 MB
        type: "application/pdf",
      };
      const result = validateFile(validDoc, "file");
      expect(result.valid).toBe(true);
    });

    it("validates markdown and config files (.md, .json, .yaml, .toml, .ini)", () => {
      const files = [
        { name: "readme.md", size: 1000, type: "text/markdown" },
        { name: "data.json", size: 2000, type: "application/json" },
        { name: "config.yaml", size: 1500, type: "text/yaml" },
        { name: "settings.ini", size: 500, type: "text/plain" },
        { name: "manifest.toml", size: 800, type: "application/toml" },
      ];

      for (const f of files) {
        expect(validateFile(f, "file").valid).toBe(true);
      }
    });

    it("rejects files exceeding 10 MB limit", () => {
      const hugeFile = {
        name: "giant-archive.pdf",
        size: 11 * 1024 * 1024,
        type: "application/pdf",
      };
      const result = validateFile(hugeFile, "file");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("10 MB limit");
    });

    it("rejects disallowed file extensions e.g. .exe", () => {
      const dangerousFile = {
        name: "malware.exe",
        size: 1024,
        type: "application/x-msdownload",
      };
      const result = validateFile(dangerousFile, "file");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("Unsupported file extension");
    });
  });

  describe("sanitizeFileName", () => {
    it("strips path traversal characters", () => {
      expect(sanitizeFileName("../../secret.txt")).toBe("secret.txt");
      expect(sanitizeFileName("..\\..\\windows.ini")).toBe("windows.ini");
    });

    it("replaces spaces and special characters with underscores", () => {
      expect(sanitizeFileName("my cool file (1) [final]!.png")).toBe(
        "my_cool_file__1___final__.png",
      );
    });

    it("preserves alphanumeric characters, dots, and hyphens", () => {
      expect(sanitizeFileName("DevStash-Architecture_2026.pdf")).toBe(
        "DevStash-Architecture_2026.pdf",
      );
    });
  });

  describe("generateR2Key", () => {
    it("generates an isolated key with user ID and sanitized name", () => {
      const key = generateR2Key("user-123", "report 2026.pdf");
      expect(key.startsWith("uploads/user-123/")).toBe(true);
      expect(key.endsWith("-report_2026.pdf")).toBe(true);
    });
  });

  describe("extractR2Key", () => {
    it("extracts key from full public URL", () => {
      const url = "https://pub-r2.test.dev/uploads/user-123/file.pdf";
      expect(extractR2Key(url)).toBe("uploads/user-123/file.pdf");
    });

    it("extracts key from download proxy URL", () => {
      const url = "/api/download?key=uploads%2Fuser-123%2Ffile.pdf";
      expect(extractR2Key(url)).toBe("uploads/user-123/file.pdf");
    });

    it("returns raw key if already a relative key", () => {
      expect(extractR2Key("uploads/user-123/file.pdf")).toBe(
        "uploads/user-123/file.pdf",
      );
    });

    it("handles empty or whitespace strings safely", () => {
      expect(extractR2Key("")).toBe("");
      expect(extractR2Key("   ")).toBe("");
    });
  });

  describe("uploadToR2", () => {
    it("uploads buffer to R2 and returns key, fileUrl, and metadata", async () => {
      mockSend.mockResolvedValueOnce({});

      const buffer = Buffer.from("test file content");
      const result = await uploadToR2({
        body: buffer,
        fileName: "test.txt",
        contentType: "text/plain",
        userId: "user-456",
      });

      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(result.fileName).toBe("test.txt");
      expect(result.fileSize).toBe(buffer.length);
      expect(result.contentType).toBe("text/plain");
      expect(result.key.startsWith("uploads/user-456/")).toBe(true);
      expect(result.fileUrl).toContain("https://pub-r2.test.dev/uploads/user-456/");
    });

    it("falls back to download proxy URL if R2_PUBLIC_URL is empty", async () => {
      delete process.env.R2_PUBLIC_URL;
      mockSend.mockResolvedValueOnce({});

      const buffer = Buffer.from("test file");
      const result = await uploadToR2({
        body: buffer,
        fileName: "test.pdf",
        contentType: "application/pdf",
        userId: "user-789",
      });

      expect(result.fileUrl.startsWith("/api/download?key=")).toBe(true);
    });
  });

  describe("deleteFromR2", () => {
    it("calls DeleteObjectCommand with extracted key", async () => {
      mockSend.mockResolvedValueOnce({});

      const success = await deleteFromR2(
        "https://pub-r2.test.dev/uploads/user-123/img.png",
      );

      expect(success).toBe(true);
      expect(mockSend).toHaveBeenCalledTimes(1);
      const callArg = mockSend.mock.calls[0][0];
      expect(callArg.Key).toBe("uploads/user-123/img.png");
      expect(callArg.Bucket).toBe("devstash-test-bucket");
    });

    it("returns false if fileUrl is empty", async () => {
      const success = await deleteFromR2("");
      expect(success).toBe(false);
      expect(mockSend).not.toHaveBeenCalled();
    });

    it("handles S3 errors gracefully without crashing", async () => {
      mockSend.mockRejectedValueOnce(new Error("R2 connection timeout"));

      const success = await deleteFromR2("uploads/user-123/img.png");
      expect(success).toBe(false);
    });
  });

  describe("getObjectFromR2", () => {
    it("calls GetObjectCommand with extracted key", async () => {
      mockSend.mockResolvedValueOnce({
        Body: "mock-stream",
        ContentType: "application/pdf",
        ContentLength: 1024,
      });

      const response = await getObjectFromR2("uploads/user-123/doc.pdf");
      expect(mockSend).toHaveBeenCalledTimes(1);
      const callArg = mockSend.mock.calls[0][0];
      expect(callArg.Key).toBe("uploads/user-123/doc.pdf");
      expect(callArg.Bucket).toBe("devstash-test-bucket");
      expect(response).toBeDefined();
    });

    it("throws error if key is empty", async () => {
      await expect(getObjectFromR2("")).rejects.toThrow("Invalid object key");
    });
  });
});
