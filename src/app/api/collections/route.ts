import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  createCollection,
  getDashboardCollections,
} from "@/lib/db/collections";
import { createCollectionSchema } from "@/lib/validations/collection";

export const dynamic = "force-dynamic";

async function resolveAuthenticatedUserId(): Promise<string | null> {
  let session = null;
  try {
    session = await auth();
  } catch {
    session = null;
  }

  let userId = session?.user?.id;

  if (!userId && session?.user?.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    userId = user?.id;
  }

  return userId ?? null;
}

export async function GET(request: Request) {
  try {
    const userId = await resolveAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to view collections." },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    const parsedLimit = limitParam ? Number(limitParam) : 50;
    const limit =
      Number.isFinite(parsedLimit) && parsedLimit > 0
        ? Math.min(Math.floor(parsedLimit), 50)
        : 50;

    const collections = await getDashboardCollections(userId, limit);

    return NextResponse.json({ collections }, { status: 200 });
  } catch (error) {
    console.error("Error fetching collections:", error);
    return NextResponse.json(
      { error: "Failed to fetch collections. Please try again later." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const userId = await resolveAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to create a collection." },
        { status: 401 },
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request payload." },
        { status: 400 },
      );
    }

    const validation = createCollectionSchema.safeParse(body);
    if (!validation.success) {
      const firstIssue = validation.error.issues[0];
      return NextResponse.json(
        {
          error: firstIssue
            ? firstIssue.message
            : "Invalid collection payload.",
        },
        { status: 400 },
      );
    }

    const collection = await createCollection(userId, {
      name: validation.data.name,
      description: validation.data.description,
    });

    try {
      revalidatePath("/dashboard");
      revalidatePath("/collections");
      revalidatePath("/items");
      revalidatePath("/profile");
    } catch {
      // Ignore revalidation errors in non-request contexts
    }

    return NextResponse.json({ collection }, { status: 201 });
  } catch (error) {
    console.error("Error creating collection:", error);
    return NextResponse.json(
      { error: "Failed to create collection. Please try again later." },
      { status: 500 },
    );
  }
}
