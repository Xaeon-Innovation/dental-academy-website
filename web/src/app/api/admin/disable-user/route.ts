import { NextResponse } from "next/server";
import { getAdminApp } from "@/lib/firebase/admin";
import { getAuth } from "firebase-admin/auth";

export async function POST(request: Request) {
  try {
    const { email, disabled } = await request.json();

    if (!email || typeof disabled !== "boolean") {
      return NextResponse.json(
        { success: false, error: "Email and disabled status are required" },
        { status: 400 }
      );
    }

    // Try to use Admin SDK to disable/enable the user
    try {
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
              `To ${disabled ? "disable" : "enable"} Firebase users, Firebase Admin SDK must be configured. ` +
              "Please set up Firebase Admin SDK (see FIREBASE_ADMIN_SETUP.md) or " +
              "manage users manually from Firebase Console → Authentication → Users. " +
              `Error: ${sdkError.message || "Firebase Admin SDK not configured"}`,
          },
          { status: 500 }
        );
      }

      const adminAuth = getAuth(adminApp);
      
      // Get user by email
      const userRecord = await adminAuth.getUserByEmail(email.toLowerCase().trim());
      
      // Update user disabled status
      await adminAuth.updateUser(userRecord.uid, {
        disabled: disabled,
      });
      
      return NextResponse.json({
        success: true,
        message: `User account ${disabled ? "disabled" : "enabled"} successfully`,
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
          error: "Failed to update user",
          message: `Failed to ${disabled ? "disable" : "enable"} Firebase account: ${errorMessage}`,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.code || "Unknown error",
        message: error.message || "Failed to update user status",
      },
      { status: 500 }
    );
  }
}
