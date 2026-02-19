"use server";

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db, COLLECTIONS } from "@/lib/firebase/firestore";
import type { SiteSettings } from "@/types/settings";

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

    // First, create the Firebase user via API route
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    
    const createUserResponse = await fetch(
      `${baseUrl}/api/admin/create-user`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: normalizedEmail, password }),
      }
    );

    const createUserResult = await createUserResponse.json();

    if (!createUserResult.success && createUserResult.error !== "User already exists") {
      return { success: false, error: createUserResult.error || createUserResult.message };
    }

    // Then add email to admin list
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
