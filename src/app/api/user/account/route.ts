import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { deleteUserAccount } from "@/lib/db/profile";

export async function DELETE() {
  try {
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
        { error: "Unauthorized. Please sign in to perform this action." },
        { status: 401 },
      );
    }

    // Perform account deletion
    const result = await deleteUserAccount(targetUserId);

    if (!result.success) {
      const statusCode =
        result.error === "The demo user account cannot be deleted." ? 403 : 400;
      return NextResponse.json(
        { error: result.error || "Failed to delete account." },
        { status: statusCode },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message:
          "Your account and associated data have been deleted successfully.",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting user account:", error);
    return NextResponse.json(
      { error: "Failed to delete account. Please try again later." },
      { status: 500 },
    );
  }
}
