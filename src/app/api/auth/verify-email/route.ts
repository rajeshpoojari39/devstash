import { NextResponse } from "next/server";
import { verifyEmailToken } from "@/lib/tokens";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    if (!token) {
      return NextResponse.json(
        { error: "Verification token is required" },
        { status: 400 },
      );
    }

    const result = await verifyEmailToken(token, email);

    if (!result.success) {
      return NextResponse.json(
        { error: result.message, code: result.error },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      email: result.email,
    });
  } catch (error) {
    console.error("Error in verify-email API GET:", error);
    return NextResponse.json(
      { error: "Internal server error during verification" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, email } = body;

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Verification token is required" },
        { status: 400 },
      );
    }

    const result = await verifyEmailToken(token, email);

    if (!result.success) {
      return NextResponse.json(
        { error: result.message, code: result.error },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      email: result.email,
    });
  } catch (error) {
    console.error("Error in verify-email API POST:", error);
    return NextResponse.json(
      { error: "Internal server error during verification" },
      { status: 500 },
    );
  }
}
