import { NextResponse } from "next/server";
import { Readable } from "node:stream";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getObjectFromR2, extractR2Key, sanitizeFileName } from "@/lib/storage/r2";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    // 1. Authenticate user
    let session = null;
    try {
      session = await auth();
    } catch {
      session = null;
    }

    let targetUserId = session?.user?.id;

    if (!targetUserId && session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
      });
      targetUserId = user?.id;
    }

    if (!targetUserId) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to download or view files." },
        { status: 401 },
      );
    }

    // 2. Parse query parameters
    const url = new URL(request.url);
    const rawKey = url.searchParams.get("key") || url.searchParams.get("url");
    const requestedFileName = url.searchParams.get("filename");
    const requestedDisposition =
      url.searchParams.get("disposition") === "inline"
        ? "inline"
        : "attachment";

    if (!rawKey) {
      return NextResponse.json(
        { error: "Missing required 'key' or 'url' query parameter." },
        { status: 400 },
      );
    }

    const key = extractR2Key(rawKey);

    if (!key) {
      return NextResponse.json(
        { error: "Invalid storage key format." },
        { status: 400 },
      );
    }

    // Security check: ensure key belongs to the current user (uploads/{userId}/...)
    // If not matching prefix, check if user owns an item referencing this fileUrl
    if (!key.startsWith(`uploads/${targetUserId}/`)) {
      const itemWithFile = await prisma.item.findFirst({
        where: {
          userId: targetUserId,
          fileUrl: {
            contains: key,
          },
        },
        select: { id: true },
      });

      if (!itemWithFile) {
        return NextResponse.json(
          { error: "Access denied. You do not have permission to access this file." },
          { status: 403 },
        );
      }
    }

    // 3. Retrieve object from Cloudflare R2
    let s3Response;
    try {
      s3Response = await getObjectFromR2(key);
    } catch (err: unknown) {
      const s3Error = err as { name?: string; message?: string };
      if (s3Error.name === "NoSuchKey" || s3Error.name === "NotFound") {
        return NextResponse.json({ error: "File not found." }, { status: 404 });
      }
      throw err;
    }

    if (!s3Response.Body) {
      return NextResponse.json({ error: "File body is empty." }, { status: 404 });
    }

    // 4. Determine response headers
    const contentType = s3Response.ContentType || "application/octet-stream";
    const contentLength = s3Response.ContentLength;

    // Determine filename
    let downloadFileName = requestedFileName;
    if (!downloadFileName) {
      const keyParts = key.split("/");
      const lastPart = keyParts[keyParts.length - 1] || "downloaded-file";
      // Strip timestamp prefix if present (e.g. 1729000000-abc123-filename.pdf -> filename.pdf)
      downloadFileName = lastPart.replace(/^\d+-[a-z0-9]+-/, "");
    }
    const safeName = sanitizeFileName(downloadFileName);

    const headers = new Headers();
    headers.set("Content-Type", contentType);
    if (contentLength) {
      headers.set("Content-Length", contentLength.toString());
    }
    headers.set(
      "Content-Disposition",
      `${requestedDisposition}; filename="${safeName}"`,
    );
    headers.set("Cache-Control", "private, max-age=3600");

    // 5. Convert S3 Body to Web ReadableStream
    let webStream: ReadableStream;
    const body = s3Response.Body as unknown as {
      transformToWebStream?: () => ReadableStream;
      pipe?: unknown;
    };

    if (typeof body.transformToWebStream === "function") {
      webStream = body.transformToWebStream();
    } else if (body instanceof Readable) {
      webStream = Readable.toWeb(body) as ReadableStream;
    } else {
      webStream = s3Response.Body as unknown as ReadableStream;
    }

    return new Response(webStream, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Error in download proxy route:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to download file from storage.",
      },
      { status: 500 },
    );
  }
}

