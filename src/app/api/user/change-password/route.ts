import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { changeUserPassword } from "@/lib/db/profile";

export async function POST(request: Request) {
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
        { error: "Unauthorized. Please sign in to change your password." },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { currentPassword, newPassword, confirmPassword } = body;

    // 1. Validate fields presence
    if (!currentPassword || typeof currentPassword !== "string") {
      return NextResponse.json(
        { error: "Current password is required." },
        { status: 400 },
      );
    }

    if (!newPassword || typeof newPassword !== "string") {
      return NextResponse.json(
        { error: "New password is required." },
        { status: 400 },
      );
    }

    if (!confirmPassword || typeof confirmPassword !== "string") {
      return NextResponse.json(
        { error: "Password confirmation is required." },
        { status: 400 },
      );
    }

    // 2. Validate password length
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters long." },
        { status: 400 },
      );
    }

    // 3. Validate matching passwords
    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: "New passwords do not match." },
        { status: 400 },
      );
    }

    // 4. Perform password update
    const result = await changeUserPassword(
      targetUserId,
      currentPassword,
      newPassword,
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to update password." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Your password has been changed successfully.",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error changing password:", error);
    return NextResponse.json(
      { error: "Failed to change password. Please try again later." },
      { status: 500 },
    );
  }
}
