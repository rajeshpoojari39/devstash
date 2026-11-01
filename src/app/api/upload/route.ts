import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  uploadToR2,
  validateFile,
  FileCategory,
} from "@/lib/storage/r2";
import {
  getClientIp,
  buildRateLimitIdentifier,
  checkRateLimit,
  createRateLimitResponse,
} from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
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
        { success: false, error: "Unauthorized. Please sign in to upload files." },
        { status: 401 },
      );
    }

    // 2. Rate limit check (20 uploads per hour by IP + user ID)
    const clientIp = getClientIp(request);
    const identifier = buildRateLimitIdentifier("upload", clientIp, targetUserId);
    const rateLimit = await checkRateLimit("upload", identifier);
    if (!rateLimit.success) {
      return createRateLimitResponse(rateLimit);
    }

    // 3. Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("file");
    const rawType = formData.get("type");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "No file was provided in the upload request." },
        { status: 400 },
      );
    }

    // Determine category: image vs file
    let category: FileCategory = "file";
    if (
      rawType === "image" ||
      rawType === "images" ||
      file.type.startsWith("image/")
    ) {
      category = "image";
    }

    // 3. Validate file against constraints
    const validation = validateFile(
      {
        name: file.name,
        size: file.size,
        type: file.type,
      },
      category,
    );

    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 },
      );
    }

    // 4. Read file content into Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 5. Upload to Cloudflare R2
    const uploadResult = await uploadToR2({
      body: buffer,
      fileName: file.name,
      contentType: file.type || "application/octet-stream",
      userId: targetUserId,
    });

    return NextResponse.json(
      {
        success: true,
        data: uploadResult,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error in upload API route:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to upload file to storage.",
      },
      { status: 500 },
    );
  }
}

