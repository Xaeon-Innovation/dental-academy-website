/**
 * Firebase Admin SDK Configuration
 * 
 * This file provides server-side Firebase access using Admin SDK.
 * Admin SDK bypasses security rules and is recommended for production.
 * 
 * To use:
 * 1. Install: npm install firebase-admin
 * 2. Get service account key from Firebase Console
 * 3. Set FIREBASE_SERVICE_ACCOUNT_KEY or FIREBASE_SERVICE_ACCOUNT_KEY_BASE64 in .env.local
 * 4. Import adminDb instead of db in server actions
 */

import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { join } from "path";

let adminApp: App | null = null;
let adminDbCache: ReturnType<typeof getFirestore> | null = null;

export function getAdminApp(): App {
  if (adminApp) return adminApp;

  const apps = getApps();
  if (apps.length > 0) {
    adminApp = apps[0];
    return adminApp;
  }

  // Try to load service account
  try {
    let serviceAccount;

    const keyEnv = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    const base64Env = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64;

    // FIREBASE_SERVICE_ACCOUNT_KEY can be either a file path or a base64 string (e.g. on Vercel)
    const looksLikeFilePath =
      keyEnv &&
      (keyEnv.includes("/") || keyEnv.includes("\\") || keyEnv.endsWith(".json"));

    if (base64Env) {
      // Explicit base64 env (recommended for Vercel)
      try {
        const decoded = Buffer.from(base64Env, "base64").toString("utf8");
        serviceAccount = JSON.parse(decoded);
      } catch (parseError: unknown) {
        const msg = parseError instanceof Error ? parseError.message : String(parseError);
        throw new Error(
          `Failed to parse base64 encoded service account key: ${msg}\n` +
            "Make sure FIREBASE_SERVICE_ACCOUNT_KEY_BASE64 is valid base64 encoded JSON."
        );
      }
    } else if (keyEnv && looksLikeFilePath) {
      // Path to service account JSON file (local dev)
      const fullPath =
        keyEnv.startsWith("/") || keyEnv.match(/^[A-Z]:/i)
          ? keyEnv
          : join(process.cwd(), keyEnv);

      try {
        const fileContents = readFileSync(fullPath, "utf8");
        serviceAccount = JSON.parse(fileContents);
      } catch (fileError: unknown) {
        const msg = fileError instanceof Error ? fileError.message : String(fileError);
        throw new Error(
          `Failed to read service account key file at "${keyEnv}": ${msg}\n` +
            `Make sure the file exists. Current working directory: ${process.cwd()}`
        );
      }
    } else if (keyEnv) {
      // Value doesn't look like a path → treat as base64 (e.g. FIREBASE_SERVICE_ACCOUNT_KEY on Vercel)
      try {
        const decoded = Buffer.from(keyEnv, "base64").toString("utf8");
        serviceAccount = JSON.parse(decoded);
      } catch (parseError: unknown) {
        const msg = parseError instanceof Error ? parseError.message : String(parseError);
        throw new Error(
          `Failed to parse service account key: ${msg}\n` +
            "For a base64 value use FIREBASE_SERVICE_ACCOUNT_KEY_BASE64, or use a file path for FIREBASE_SERVICE_ACCOUNT_KEY."
        );
      }
    } else {
      // No service account configured
      throw new Error(
        "Firebase Admin SDK requires service account credentials.\n\n" +
        "To set up Admin SDK:\n" +
        "1. Go to Firebase Console → Project Settings → Service Accounts\n" +
        "2. Click 'Generate new private key' and download the JSON file\n" +
        "3. Add to your .env.local file:\n" +
        "   FIREBASE_SERVICE_ACCOUNT_KEY=./serviceAccountKey.json\n" +
        "   (or use FIREBASE_SERVICE_ACCOUNT_KEY_BASE64 for base64 encoded)\n" +
        "4. Restart your development server\n\n" +
        "See FIREBASE_ADMIN_SETUP.md for detailed instructions."
      );
    }

    // Validate service account structure
    if (!serviceAccount.private_key || !serviceAccount.client_email || !serviceAccount.project_id) {
      throw new Error(
        "Invalid service account key format. The JSON file must contain:\n" +
        "- private_key\n" +
        "- client_email\n" +
        "- project_id\n\n" +
        "Make sure you downloaded the correct file from Firebase Console."
      );
    }

    adminApp = initializeApp({
      credential: cert(serviceAccount),
    });
    
    return adminApp;
  } catch (error: any) {
    // Re-throw with better error message
    if (error.message && error.message.includes("Firebase Admin SDK requires")) {
      throw error;
    }
    throw new Error(
      `Firebase Admin SDK configuration error: ${error.message}\n\n` +
      "Make sure:\n" +
      "1. The service account key file exists and is readable\n" +
      "2. The path in .env.local is correct (use forward slashes or double backslashes on Windows)\n" +
      "3. The JSON file is valid and not corrupted\n" +
      "4. You've restarted your dev server after adding the environment variable\n\n" +
      "See FIREBASE_ADMIN_SETUP.md for help."
    );
  }
}

export function getAdminDb() {
  if (adminDbCache) return adminDbCache;
  
  try {
    const app = getAdminApp();
    adminDbCache = getFirestore(app);
    return adminDbCache;
  } catch (error) {
    // If Admin SDK fails, return null and fall back to client SDK
    return null;
  }
}
