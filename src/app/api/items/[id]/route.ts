import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getItemById } from "@/lib/db/items";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Item ID is required." },
        { status: 400 },
      );
    }

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
        { error: "Unauthorized. Please sign in to view this item." },
        { status: 401 },
      );
    }

    const item = await getItemById(id, targetUserId);

    if (!item) {
      return NextResponse.json({ error: "Item not found." }, { status: 404 });
    }

    return NextResponse.json({ item }, { status: 200 });
  } catch (error) {
    console.error("Error fetching item details:", error);
    return NextResponse.json(
      { error: "Failed to fetch item details. Please try again later." },
      { status: 500 },
    );
  }
}
