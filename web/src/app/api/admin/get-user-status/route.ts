import { NextResponse } from "next/server";
import { getAdminApp } from "@/lib/firebase/admin";
import { getAuth } from "firebase-admin/auth";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    }

    // Try to use Admin SDK to get user status
    let adminApp;
    try {
      adminApp = getAdminApp();
    } catch (sdkError: any) {
      // Admin SDK not configured - return default status (enabled)
      return NextResponse.json({
        success: true,
        disabled: false,
        email: email,
        note: "Admin SDK not configured - assuming enabled",
      });
    }

    try {
      const adminAuth = getAuth(adminApp);
      
      // Get user by email
      const userRecord = await adminAuth.getUserByEmail(email.toLowerCase().trim());
      
      return NextResponse.json({
        success: true,
        disabled: userRecord.disabled || false,
        email: userRecord.email,
        uid: userRecord.uid,
      });
    } catch (adminError: any) {
      if (adminError.code === "auth/user-not-found") {
        return NextResponse.json(
          {
            success: false,
            error: "User not found",
            message: "No user account exists with this email.",
          },
          { status: 404 }
        );
      }
      
      // If we can't get status, assume enabled
      return NextResponse.json({
        success: true,
        disabled: false,
        email: email,
        note: "Could not determine status - assuming enabled",
      });
    }
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.code || "Unknown error",
        message: error.message || "Failed to get user status",
      },
      { status: 500 }
    );
  }
}
