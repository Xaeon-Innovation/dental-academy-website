import { NextResponse } from "next/server";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db, COLLECTIONS } from "@/lib/firebase/firestore";

const SETTINGS_DOC_ID = "main";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email is required" },
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

    const normalizedEmail = email.toLowerCase().trim();

    // Get current settings
    const docRef = doc(db, COLLECTIONS.settings, SETTINGS_DOC_ID);
    const docSnap = await getDoc(docRef);

    let adminEmails: string[] = [];
    if (docSnap.exists()) {
      const data = docSnap.data();
      adminEmails = data.adminEmails || [];
    }

    // Check if email already exists
    if (adminEmails.includes(normalizedEmail)) {
      return NextResponse.json({
        success: true,
        message: "Email already in admin list",
      });
    }

    // Add email to list
    const updatedEmails = [...adminEmails, normalizedEmail];

    const payload = {
      adminEmails: updatedEmails,
      updatedAt: serverTimestamp(),
    };

    if (docSnap.exists()) {
      await updateDoc(docRef, payload);
    } else {
      await setDoc(docRef, {
        ...payload,
        createdAt: serverTimestamp(),
      });
    }

    return NextResponse.json({
      success: true,
      message: "Email added to admin whitelist",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to add email to whitelist",
      },
      { status: 500 }
    );
  }
}
