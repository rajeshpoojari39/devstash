import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";

/**
 * File constraints per specification (context/features/file-image-spec.md)
 */
export const FILE_CONSTRAINTS = {
  image: {
    maxSizeBytes: 5 * 1024 * 1024, // 5 MB
    maxSizeLabel: "5 MB",
    extensions: [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"],
    mimeTypes: [
      "image/png",
      "image/jpeg",
      "image/gif",
      "image/webp",
      "image/svg+xml",
    ],
  },
  file: {
    maxSizeBytes: 10 * 1024 * 1024, // 10 MB
    maxSizeLabel: "10 MB",
    extensions: [
      ".pdf",
      ".txt",
      ".md",
      ".json",
      ".yaml",
      ".yml",
      ".xml",
      ".csv",
      ".toml",
      ".ini",
    ],
    mimeTypes: [
      "application/pdf",
      "text/plain",
      "text/markdown",
      "application/json",
      "application/x-yaml",
      "text/yaml",
      "application/xml",
      "text/xml",
      "text/csv",
      "application/toml",
    ],
  },
} as const;

export type FileCategory = keyof typeof FILE_CONSTRAINTS;

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates a file against size, extension, and MIME type constraints.
 */
export function validateFile(
  file: { name: string; size: number; type?: string | null },
  category: FileCategory,
): FileValidationResult {
  const config = FILE_CONSTRAINTS[category];

  if (!file.name || !file.name.includes(".")) {
    return {
      valid: false,
      error: "File must have a valid extension.",
    };
  }

  if (file.size <= 0) {
    return {
      valid: false,
      error: "File cannot be empty.",
    };
  }

  if (file.size > config.maxSizeBytes) {
    return {
      valid: false,
      error: `File size exceeds the ${config.maxSizeLabel} limit for ${category}s.`,
    };
  }

  const extension = `.${file.name.split(".").pop()?.toLowerCase() || ""}`;
  const allowedExtensions: readonly string[] = config.extensions;
  const isExtensionValid = allowedExtensions.includes(extension);

  if (!isExtensionValid) {
    const allowed = config.extensions.join(", ");
    return {
      valid: false,
      error: `Unsupported file extension "${extension}". Allowed: ${allowed}`,
    };
  }

  // If MIME type is provided and not generic octet-stream, check it
  if (file.type && file.type !== "application/octet-stream") {
    const normalizedType = file.type.toLowerCase();
    const allowedMimeTypes: readonly string[] = config.mimeTypes;
    // Allow text/plain for .ini or .md, and match against allowed mimeTypes
    const isMimeValid =
      allowedMimeTypes.includes(normalizedType) ||
      (category === "file" &&
        (extension === ".ini" || extension === ".md") &&
        normalizedType === "text/plain");

    if (!isMimeValid) {
      return {
        valid: false,
        error: `Unsupported file type "${file.type}".`,
      };
    }
  }

  return { valid: true };
}

/**
 * Sanitizes a filename to prevent path traversal and odd characters.
 */
export function sanitizeFileName(fileName: string): string {
  const basename = fileName.replace(/^.*[\\/]/, "");
  return basename.replace(/[^a-zA-Z0-9._-]/g, "_");
}

/**
 * Generates an isolated R2 storage key scoped by user ID and timestamp.
 */
export function generateR2Key(userId: string, fileName: string): string {
  const sanitized = sanitizeFileName(fileName);
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `uploads/${userId}/${timestamp}-${randomSuffix}-${sanitized}`;
}

/**
 * Extracts the R2 object key from a full URL, relative API path, or raw key.
 */
export function extractR2Key(fileUrlOrKey: string): string {
  if (!fileUrlOrKey) return "";

  const trimmed = fileUrlOrKey.trim();

  // If it's a download proxy URL: /api/download?key=...
  if (trimmed.includes("key=")) {
    try {
      const url = new URL(trimmed, "http://localhost");
      const keyParam = url.searchParams.get("key");
      if (keyParam) return decodeURIComponent(keyParam);
    } catch {
      // Fallback
    }
  }

  // If it's a full HTTP/HTTPS URL
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      const url = new URL(trimmed);
      // Remove leading slash
      return decodeURIComponent(url.pathname.replace(/^\/+/, ""));
    } catch {
      // Fallback
    }
  }

  // If it's a relative path starting with /
  return trimmed.replace(/^\/+/, "");
}

// Global S3 client cache for Next.js hot reloading
const globalForR2 = globalThis as unknown as {
  r2Client?: S3Client;
};

/**
 * Gets or initializes the Cloudflare R2 S3-compatible client.
 */
export function getR2Client(): S3Client {
  if (globalForR2.r2Client) {
    return globalForR2.r2Client;
  }

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "Cloudflare R2 configuration missing. Ensure R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY are set.",
    );
  }

  const endpoint = `https://${accountId}.r2.cloudflarestorage.com`;

  const client = new S3Client({
    region: "auto",
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  if (process.env.NODE_ENV !== "production") {
    globalForR2.r2Client = client;
  }

  return client;
}

export interface UploadToR2Params {
  body: Buffer | Uint8Array;
  fileName: string;
  contentType: string;
  userId: string;
}

export interface UploadToR2Result {
  key: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  contentType: string;
}

/**
 * Uploads a file buffer to Cloudflare R2 and returns its key, URL, and metadata.
 */
export async function uploadToR2(
  params: UploadToR2Params,
): Promise<UploadToR2Result> {
  const { body, fileName, contentType, userId } = params;
  const client = getR2Client();
  const bucket = process.env.R2_BUCKET_NAME || "devstash";
  const publicUrl = process.env.R2_PUBLIC_URL?.trim();

  const key = generateR2Key(userId, fileName);
  const fileSize = body.length || (body as Buffer).byteLength || 0;

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );

  // If public URL is provided, build absolute R2 public URL; otherwise use download proxy
  const fileUrl = publicUrl
    ? `${publicUrl.replace(/\/+$/, "")}/${key}`
    : `/api/download?key=${encodeURIComponent(key)}`;

  return {
    key,
    fileUrl,
    fileName,
    fileSize,
    contentType,
  };
}

/**
 * Deletes an object from Cloudflare R2 by its key or fileUrl.
 */
export async function deleteFromR2(fileUrlOrKey: string): Promise<boolean> {
  if (!fileUrlOrKey) return false;

  const key = extractR2Key(fileUrlOrKey);
  if (!key) return false;

  try {
    const client = getR2Client();
    const bucket = process.env.R2_BUCKET_NAME || "devstash";

    await client.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
    );
    return true;
  } catch (error) {
    console.error("Error deleting object from Cloudflare R2:", error);
    return false;
  }
}

/**
 * Fetches an object stream from Cloudflare R2 by its key.
 */
export async function getObjectFromR2(keyOrUrl: string) {
  const key = extractR2Key(keyOrUrl);
  if (!key) {
    throw new Error("Invalid object key provided.");
  }

  const client = getR2Client();
  const bucket = process.env.R2_BUCKET_NAME || "devstash";

  return await client.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
  );
}

