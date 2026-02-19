import { NextResponse } from "next/server";
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    // Check for strong password requirements
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
        },
        { status: 400 }
      );
    }

    // Validate Firebase config
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
      return NextResponse.json(
        {
          success: false,
          error: "Firebase configuration is missing. Please check your .env.local file.",
        },
        { status: 500 }
      );
    }

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);

    // Create user
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email.toLowerCase().trim(),
      password
    );

    return NextResponse.json({
      success: true,
      message: "Admin user created successfully!",
      user: {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
      },
    });
  } catch (error: any) {
    if (error.code === "auth/email-already-in-use") {
      return NextResponse.json(
        {
          success: false,
          error: "User already exists",
          message: "A user with this email already exists in Firebase Authentication.",
        },
        { status: 400 }
      );
    }

    if (error.code === "auth/invalid-email") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid email",
          message: "The email address is not valid.",
        },
        { status: 400 }
      );
    }

    if (error.code === "auth/weak-password") {
      return NextResponse.json(
        {
          success: false,
          error: "Weak password",
          message: "The password is too weak. Please use a stronger password.",
        },
        { status: 400 }
      );
    }

    if (error.code === "auth/operation-not-allowed") {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication not enabled",
          message:
            "Email/Password authentication is not enabled. Please enable it in Firebase Console → Authentication → Sign-in method",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.code || "Unknown error",
        message: error.message || "Failed to create user",
      },
      { status: 500 }
    );
  }
}
