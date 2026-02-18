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

let adminApp: App | null = null;
let adminDb: ReturnType<typeof getFirestore> | null = null;

function getAdminApp(): App {
  if (adminApp) return adminApp;

  const apps = getApps();
  if (apps.length > 0) {
    adminApp = apps[0];
    return adminApp;
  }

  // Try to load service account
  try {
    let serviceAccount;
    
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      // Path to service account JSON file
      serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64) {
      // Base64 encoded service account JSON
      serviceAccount = JSON.parse(
        Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64, "base64").toString()
      );
    } else {
      // Fallback: try to use default credentials (for Firebase hosting/Cloud Functions)
      adminApp = initializeApp();
      return adminApp;
    }

    adminApp = initializeApp({
      credential: cert(serviceAccount),
    });
    
    return adminApp;
  } catch (error) {
    console.warn("Firebase Admin SDK not configured. Using client SDK instead.");
    throw new Error("Firebase Admin SDK requires service account credentials");
  }
}

export function getAdminDb() {
  if (adminDb) return adminDb;
  
  try {
    const app = getAdminApp();
    adminDb = getFirestore(app);
    return adminDb;
  } catch (error) {
    // If Admin SDK fails, return null and fall back to client SDK
    return null;
  }
}

// Export for convenience
export const adminDb = getAdminDb();
