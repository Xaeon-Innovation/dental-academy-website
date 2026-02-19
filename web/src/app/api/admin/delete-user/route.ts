import { NextResponse } from "next/server";
import { getAdminApp } from "@/lib/firebase/admin";
import { getAuth } from "firebase-admin/auth";

export async function DELETE(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    }

    // Try to use Admin SDK to delete the user
    let adminApp;
    try {
      adminApp = getAdminApp();
    } catch (sdkError: any) {
      // Admin SDK not configured
      return NextResponse.json(
        {
          success: false,
          error: "Admin SDK required",
          message:
            "To delete Firebase users, Firebase Admin SDK must be configured. " +
            "Please set up Firebase Admin SDK (see FIREBASE_ADMIN_SETUP.md) or " +
            "delete the user manually from Firebase Console → Authentication → Users. " +
            `Error: ${sdkError.message || "Firebase Admin SDK not configured"}`,
        },
        { status: 500 }
      );
    }

    try {
      const adminAuth = getAuth(adminApp);
      
      // Get user by email
      const userRecord = await adminAuth.getUserByEmail(email.toLowerCase().trim());
      
      // Delete the user
      await adminAuth.deleteUser(userRecord.uid);
      
      return NextResponse.json({
        success: true,
        message: "User account deleted successfully",
      });
    } catch (adminError: any) {
      // If Admin SDK fails, provide instructions
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
      
      // Other Admin SDK errors
      const errorMessage = adminError.message || adminError.toString() || "Unknown error";
      
      return NextResponse.json(
        {
          success: false,
          error: "Failed to delete user",
          message: `Failed to delete Firebase account: ${errorMessage}`,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.code || "Unknown error",
        message: error.message || "Failed to delete user",
      },
      { status: 500 }
    );
  }
}
