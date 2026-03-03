"use server";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db, COLLECTIONS } from "@/lib/firebase/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { caseSchema, type CaseFormData } from "@/lib/validations/case";
import type { Case, CaseCreatePayload, CaseUpdatePayload } from "@/types/case";

function omitUndefined<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as Record<string, unknown>;
}

// Aggressively convert all data to JSON-serializable primitives
function toPlainObject<T>(data: T): any {
  // Handle null and undefined
  if (data === null || data === undefined) {
    return data;
  }
  
  // Handle primitives (string, number, boolean)
  if (typeof data !== 'object') {
    return data;
  }
  
  // Handle Date objects
  if (data instanceof Date) {
    return data.toISOString();
  }
  
  // Handle Firestore Timestamp
  if (data && typeof data === 'object' && 'toDate' in data && typeof (data as any).toDate === 'function') {
    try {
      return (data as any).toDate().toISOString();
    } catch {
      return String(data);
    }
  }
  
  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => toPlainObject(item));
  }
  
  // Handle objects - convert to plain object with only primitives
  if (typeof data === 'object') {
    const plain: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      // Skip functions, undefined, symbols, and private properties
      if (
        typeof value === 'function' ||
        value === undefined ||
        typeof value === 'symbol' ||
        key.startsWith('_')
      ) {
        continue;
      }
      
      // Recursively convert nested values
      plain[key] = toPlainObject(value);
    }
    return plain;
  }
  
  // Fallback: convert to string
  return String(data);
}

// Ensure data is JSON-serializable for Next.js server actions
function ensureSerializable<T>(data: T): T {
  try {
    const plain = toPlainObject(data);
    // Test serialization
    const serialized = JSON.stringify(plain);
    // Parse back to ensure it's valid
    const parsed = JSON.parse(serialized);
    return parsed as T;
  } catch (error) {
    console.error("Serialization error:", error);
    // Return minimal safe fallback
    if (Array.isArray(data)) {
      return [] as T;
    }
    if (typeof data === 'object' && data !== null) {
      return {} as T;
    }
    return data;
  }
}

function convertTimestamps(data: any): any {
  // Use the new toPlainObject function for consistent conversion
  return toPlainObject(data);
}

export async function getCases(): Promise<Case[]> {
  try {
    // Check if db is initialized
    if (!db) {
      console.error("Firestore database not initialized");
      return [];
    }

    const casesRef = collection(db, COLLECTIONS.cases);
    
    // Try with orderBy first, fallback to no ordering if index doesn't exist
    let snapshot;
    try {
      const q = query(casesRef, orderBy("order", "asc"));
      snapshot = await getDocs(q);
    } catch (orderError: any) {
      // If ordering fails (likely missing index), fetch without ordering
      if (orderError?.code === "failed-precondition" || orderError?.message?.includes("index")) {
        console.warn("Cases index not found, fetching without order:", orderError);
        try {
          snapshot = await getDocs(casesRef);
        } catch (fetchError) {
          console.error("Error fetching cases without order:", fetchError);
          // Return empty array instead of throwing
          return [];
        }
      } else {
        // Log the error but don't throw - return empty array instead
        console.error("Error querying cases with order:", orderError);
        try {
          // Try fetching without order as fallback
          snapshot = await getDocs(casesRef);
        } catch (fetchError) {
          console.error("Error fetching cases:", fetchError);
          return [];
        }
      }
    }
    
    const cases = snapshot.docs.map((doc) => {
      try {
        const rawData = doc.data();
        // Convert all data to plain objects first
        const plainData = toPlainObject(rawData);
        
        // Build case object with only primitive values
        const caseData: Record<string, any> = {
          id: String(doc.id),
          title: String(plainData?.title || ""),
          order: typeof plainData?.order === 'number' ? Number(plainData.order) : 0,
        };
        
        // Add optional fields only if they exist and are valid
        if (plainData?.description && typeof plainData.description === 'string') {
          caseData.description = String(plainData.description);
        }
        if (plainData?.imageUrl && typeof plainData.imageUrl === 'string') {
          caseData.imageUrl = String(plainData.imageUrl);
        }
        if (Array.isArray(plainData?.imageUrls) && plainData.imageUrls.length > 0) {
          caseData.imageUrls = plainData.imageUrls
            .map((url: any) => String(url))
            .filter((url: string) => url.length > 0);
        }
        if (plainData?.createdAt) {
          caseData.createdAt = String(plainData.createdAt);
        }
        if (plainData?.updatedAt) {
          caseData.updatedAt = String(plainData.updatedAt);
        }
        
        // Final validation - ensure it's serializable
        JSON.stringify(caseData);
        return caseData as Case;
      } catch (itemError) {
        console.error(`Error processing case ${doc.id}:`, itemError);
        // Return minimal safe data
        return {
          id: String(doc.id),
          title: String(doc.data()?.title || ""),
          order: 0,
        } as Case;
      }
    });
    
    // Sort manually if we couldn't use orderBy
    cases.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    
    // Convert entire array to plain objects and validate serialization
    try {
      const plainCases = cases.map(c => toPlainObject(c));
      // Test serialization
      const testSerialized = JSON.stringify(plainCases);
      const testParsed = JSON.parse(testSerialized);
      return testParsed as Case[];
    } catch (serializeError: any) {
      console.error("Serialization error in getCases:", serializeError);
      console.error("Error details:", {
        message: serializeError?.message,
        stack: serializeError?.stack,
        casesCount: cases.length,
        firstCase: cases[0] ? JSON.stringify(cases[0], null, 2) : "none",
      });
      // Return minimal safe data - only primitives
      return cases.map((c) => {
        const safe: Record<string, any> = {
          id: String(c.id || ""),
          title: String(c.title || ""),
          order: Number(c.order || 0),
        };
        if (c.description) safe.description = String(c.description);
        if (c.imageUrl) safe.imageUrl = String(c.imageUrl);
        if (Array.isArray(c.imageUrls) && c.imageUrls.length > 0) {
          safe.imageUrls = c.imageUrls.map(String);
        }
        return safe;
      }).filter((c) => c.id && c.title) as Case[];
    }
  } catch (err: any) {
    console.error("Error fetching cases:", err);
    
    // Provide more detailed error information
    const errorCode = err?.code || err?.error?.code;
    const errorMessage = err?.message || err?.error?.message || String(err);
    
    // Log specific error types for debugging
    if (errorCode === "permission-denied") {
      console.error("Firestore permission denied. Please check security rules for 'cases' collection.");
    } else if (errorCode === "unavailable" || errorMessage?.includes("Failed to fetch")) {
      console.error("Firestore service unavailable. Check your internet connection.");
    } else if (errorCode === "unauthenticated") {
      console.error("Firestore authentication failed.");
    }
    
    // Return empty array instead of throwing to prevent "Failed to fetch" error
    // The error will be logged to console for debugging
    return [];
  }
}

export async function getCaseById(id: string): Promise<Case | null> {
  try {
    const ref = doc(db, COLLECTIONS.cases, id);
    const snap = await getDoc(ref);
    
    if (!snap.exists()) {
      return null;
    }
    
    const rawData = snap.data();
    // Convert to plain object first
    const plainData = toPlainObject(rawData);
    
    // Build case object with only primitive values
    const caseData: Record<string, any> = {
      id: String(snap.id),
      title: String(plainData?.title || ""),
      order: typeof plainData?.order === 'number' ? Number(plainData.order) : 0,
    };
    
    // Add optional fields only if they exist and are valid
    if (plainData?.description && typeof plainData.description === 'string') {
      caseData.description = String(plainData.description);
    }
    if (plainData?.imageUrl && typeof plainData.imageUrl === 'string') {
      caseData.imageUrl = String(plainData.imageUrl);
    }
    if (Array.isArray(plainData?.imageUrls) && plainData.imageUrls.length > 0) {
      caseData.imageUrls = plainData.imageUrls
        .map((url: any) => String(url))
        .filter((url: string) => url.length > 0);
    }
    if (plainData?.createdAt) {
      caseData.createdAt = String(plainData.createdAt);
    }
    if (plainData?.updatedAt) {
      caseData.updatedAt = String(plainData.updatedAt);
    }
    
    try {
      // Convert to plain object and validate serialization
      const plainCase = toPlainObject(caseData);
      const testSerialized = JSON.stringify(plainCase);
      const testParsed = JSON.parse(testSerialized);
      return testParsed as Case;
    } catch (serializeError) {
      console.error("Serialization error in getCaseById:", serializeError);
      // Return minimal safe data - only primitives
      return {
        id: String(caseData.id || ""),
        title: String(caseData.title || ""),
        description: caseData.description ? String(caseData.description) : undefined,
        imageUrl: caseData.imageUrl ? String(caseData.imageUrl) : undefined,
        imageUrls: Array.isArray(caseData.imageUrls) ? caseData.imageUrls.map(String) : undefined,
        order: Number(caseData.order || 0),
      } as Case;
    }
  } catch (err) {
    console.error("Error fetching case by id:", err);
    return null;
  }
}

export async function createCase(data: CaseFormData): Promise<{ success: true; id: string } | { success: false; error: string }> {
  try {
    // Clean up the data before validation
    const cleanedData = {
      ...data,
      // Ensure imageUrls is an array and filter out empty values
      imageUrls: data.imageUrls?.filter((url) => url && url.trim().length > 0) || undefined,
      // Remove imageUrls if empty array
      ...(data.imageUrls && data.imageUrls.length === 0 ? { imageUrls: undefined } : {}),
    };

    const validated = caseSchema.parse(cleanedData);
    
    const payload = omitUndefined({
      ...validated,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    const ref = await addDoc(
      collection(db, COLLECTIONS.cases),
      payload
    );
    
    // Ensure return value is serializable
    const result = { success: true as const, id: String(ref.id) };
    try {
      JSON.stringify(result);
      return result;
    } catch (err) {
      console.error("Serialization error in createCase return:", err);
      return { success: true as const, id: String(ref.id) };
    }
  } catch (err: any) {
    console.error("Error creating case:", err);
    
    let errorMessage = "Failed to create case";
    
    if (err instanceof Error && err.name === "ZodError") {
      // Provide more detailed validation error
      const zodError = err as any;
      const firstError = zodError.errors?.[0];
      errorMessage = firstError?.message || "Invalid case data.";
    } else if (err instanceof Error) {
      errorMessage = err.message || "Failed to create case";
    } else if (typeof err === 'string') {
      errorMessage = err;
    }
    
    // Ensure error response is serializable
    const errorResult = { success: false as const, error: String(errorMessage) };
    try {
      JSON.stringify(errorResult);
      return errorResult;
    } catch (err) {
      console.error("Serialization error in createCase error return:", err);
      return { success: false as const, error: "Failed to create case" };
    }
  }
}

export async function updateCase(
  id: string,
  data: CaseUpdatePayload
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const ref = doc(db, COLLECTIONS.cases, id);
    const existing = await getDoc(ref);
    
    if (!existing.exists()) {
      return { success: false, error: "Case not found." };
    }
    
    const existingData = existing.data();
    
    // Validate if we have form data
    if (data.title || data.imageUrl !== undefined || data.imageUrls !== undefined) {
      const toValidate: Partial<CaseFormData> = {
        title: data.title ?? existingData.title,
        description: data.description ?? existingData.description,
        imageUrl: data.imageUrl ?? existingData.imageUrl,
        imageUrls: data.imageUrls ?? existingData.imageUrls,
        order: data.order ?? existingData.order,
      };
      
      caseSchema.parse(toValidate);
    }
    
    const payload = omitUndefined({
      ...data,
      updatedAt: serverTimestamp(),
    });
    
    await updateDoc(ref, payload);
    
    // Ensure return value is serializable
    const result = { success: true as const };
    try {
      JSON.stringify(result);
      return result;
    } catch (err) {
      console.error("Serialization error in updateCase return:", err);
      return { success: true as const };
    }
  } catch (err: any) {
    console.error("Error updating case:", err);
    
    let errorMessage = "Failed to update case";
    
    if (err instanceof Error && err.name === "ZodError") {
      errorMessage = "Invalid case data.";
    } else if (err instanceof Error) {
      errorMessage = err.message || "Failed to update case";
    } else if (typeof err === 'string') {
      errorMessage = err;
    }
    
    // Ensure error response is serializable
    const errorResult = { success: false as const, error: String(errorMessage) };
    try {
      JSON.stringify(errorResult);
      return errorResult;
    } catch (serializeErr) {
      console.error("Serialization error in updateCase error return:", serializeErr);
      return { success: false as const, error: "Failed to update case" };
    }
  }
}

export async function deleteCase(id: string): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const ref = doc(db, COLLECTIONS.cases, id);
    const existing = await getDoc(ref);
    
    if (!existing.exists()) {
      return { success: false, error: "Case not found." };
    }
    
    await deleteDoc(ref);
    
    // Ensure return value is serializable
    const result = { success: true as const };
    try {
      JSON.stringify(result);
      return result;
    } catch (err) {
      console.error("Serialization error in deleteCase return:", err);
      return { success: true as const };
    }
  } catch (err: any) {
    console.error("Error deleting case:", err);
    
    const errorMessage = err instanceof Error ? err.message : (typeof err === 'string' ? err : "Failed to delete case");
    
    // Ensure error response is serializable
    const errorResult = { success: false as const, error: String(errorMessage) };
    try {
      JSON.stringify(errorResult);
      return errorResult;
    } catch (serializeErr) {
      console.error("Serialization error in deleteCase error return:", serializeErr);
      return { success: false as const, error: "Failed to delete case" };
    }
  }
}
