"use server";

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { getAuth } from "firebase-admin/auth";
import { db, COLLECTIONS } from "@/lib/firebase/firestore";
import { getAdminApp } from "@/lib/firebase/admin";
import type { SiteSettings, HomeSettings } from "@/types/settings";

const SETTINGS_DOC_ID = "main";

function convertTimestamps(data: any): any {
  if (!data) return data;
  
  const converted = { ...data };
  
  if (converted.createdAt instanceof Timestamp) {
    converted.createdAt = converted.createdAt.toDate().toISOString();
  }
  if (converted.updatedAt instanceof Timestamp) {
    converted.updatedAt = converted.updatedAt.toDate().toISOString();
  }
  
  return converted;
}

export async function getSettings(): Promise<SiteSettings> {
  try {
    const docRef = doc(db, COLLECTIONS.settings, SETTINGS_DOC_ID);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return convertTimestamps(data) as SiteSettings;
    }

    // Return default settings if document doesn't exist
    return {
      adminEmails: [],
    };
  } catch (err) {
    console.error("Error fetching settings:", err);
    return {
      adminEmails: [],
    };
  }
}

export async function getHomeSettings(): Promise<HomeSettings | null> {
  const settings = await getSettings();
  return (settings.home as HomeSettings) ?? null;
}

export async function updateSettings(
  updates: Partial<SiteSettings>
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const docRef = doc(db, COLLECTIONS.settings, SETTINGS_DOC_ID);
    const docSnap = await getDoc(docRef);

    const payload = {
      ...updates,
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

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update settings";
    return { success: false, error: message };
  }
}

export async function updateHomeSettings(
  updates: Partial<HomeSettings>
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const settings = await getSettings();
    const currentHome = (settings.home as HomeSettings) ?? {};
    const nextHome: HomeSettings = {
      ...currentHome,
      ...updates,
    };
    return await updateSettings({ home: nextHome });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update home settings";
    return { success: false, error: message };
  }
}

export async function updateContactSettings(
  updates: Partial<
    Pick<
      SiteSettings,
      "contactEmail" | "contactPhone" | "contactLocation" | "mapEmbedSrc" | "socialLinks"
    >
  >
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const payload: Partial<SiteSettings> = { ...updates };
    if (updates.socialLinks) {
      const settings = await getSettings();
      const current = settings.socialLinks ?? {};
      payload.socialLinks = { ...current, ...updates.socialLinks };
    }
    return await updateSettings(payload);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update contact settings";
    return { success: false, error: message };
  }
}

export async function addAdminEmail(
  email: string,
  password: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false, error: "Invalid email format" };
    }

    // Validate password strength
    if (password.length < 8) {
      return { success: false, error: "Password must be at least 8 characters long" };
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      return {
        success: false,
        error:
          "Password must contain uppercase, lowercase, number, and special character",
      };
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Create the Firebase user via Admin SDK (no self-request)
    try {
      const adminApp = getAdminApp();
      const adminAuth = getAuth(adminApp);
      await adminAuth.createUser({
        email: normalizedEmail,
        password,
        emailVerified: false,
      });
    } catch (createErr: unknown) {
      const err = createErr as { code?: string; message?: string };
      if (err.code === "auth/email-already-exists") {
        // User exists in Firebase; continue to add to admin list
      } else if (err.code === "auth/invalid-email") {
        return { success: false, error: "Invalid email" };
      } else if (err.code === "auth/weak-password") {
        return {
          success: false,
          error:
            "Password must contain uppercase, lowercase, number, and special character",
        };
      } else if (err.code === "auth/operation-not-allowed") {
        return {
          success: false,
          error:
            "Email/Password sign-in is not enabled. Enable it in Firebase Console → Authentication → Sign-in method",
        };
      } else if (
        err.message?.includes("Firebase Admin SDK") ||
        err.message?.includes("service account") ||
        err.message?.includes("Admin SDK")
      ) {
        return {
          success: false,
          error:
            "Firebase Admin SDK is not configured. Set up the Admin SDK (see FIREBASE_ADMIN_SETUP.md) to create new admin users from this page, or create the user in Firebase Console → Authentication and use 'Add existing user' below.",
        };
      } else {
        const msg = err.message || (createErr instanceof Error ? createErr.message : "Failed to create user");
        return { success: false, error: msg };
      }
    }

    // Add email to admin list
    const settings = await getSettings();
    const adminEmails = settings.adminEmails || [];

    // Check if email already exists in admin list
    if (adminEmails.includes(normalizedEmail)) {
      return { success: false, error: "Email already in admin list" };
    }

    // Add email to list
    const updatedEmails = [...adminEmails, normalizedEmail];

    return await updateSettings({ adminEmails: updatedEmails });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to add admin email";
    return { success: false, error: message };
  }
}

/** Add an existing Firebase Auth user to the admin list (email only). Use when the user was created in Firebase Console. */
export async function addExistingUserAsAdmin(
  email: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false, error: "Invalid email format" };
    }

    const settings = await getSettings();
    const adminEmails = settings.adminEmails || [];
    const normalizedEmail = email.toLowerCase().trim();

    if (adminEmails.includes(normalizedEmail)) {
      return { success: false, error: "Email already in admin list" };
    }

    const updatedEmails = [...adminEmails, normalizedEmail];
    return await updateSettings({ adminEmails: updatedEmails });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to add admin email";
    return { success: false, error: message };
  }
}

export async function removeAdminEmail(
  email: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const settings = await getSettings();
    const adminEmails = settings.adminEmails || [];
    const normalizedEmail = email.toLowerCase().trim();

    // Remove email from list
    const updatedEmails = adminEmails.filter((e) => e !== normalizedEmail);

    return await updateSettings({ adminEmails: updatedEmails });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to remove admin email";
    return { success: false, error: message };
  }
}

export async function isAdminEmail(email: string | null | undefined): Promise<boolean> {
  if (!email) return false;

  try {
    const settings = await getSettings();
    const adminEmails = settings.adminEmails || [];
    const normalizedEmail = email.toLowerCase().trim();

    return adminEmails.includes(normalizedEmail);
  } catch (err) {
    console.error("Error checking admin email:", err);
    return false;
  }
}
