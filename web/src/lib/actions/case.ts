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
  deleteField,
} from "firebase/firestore";
import { db, COLLECTIONS } from "@/lib/firebase/firestore";
import { caseSchema, type CaseFormData } from "@/lib/validations/case";
import type { Case } from "@/types/case";

function convertTimestamps(data: any): any {
  if (!data) return data;
  const converted = { ...data };
  if (converted.createdAt instanceof Timestamp) {
    converted.createdAt = converted.createdAt.toDate();
  }
  if (converted.updatedAt instanceof Timestamp) {
    converted.updatedAt = converted.updatedAt.toDate();
  }
  return converted;
}

export async function getCases(): Promise<Case[]> {
  try {
    const casesRef = collection(db, COLLECTIONS.cases);
    const q = query(casesRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map((doc) => {
      const data = convertTimestamps(doc.data());
      // Handle migration: if old format has imageUrl, convert to images array
      if (data.imageUrl && !data.images) {
        data.images = [data.imageUrl];
        data.primaryImageIndex = 0;
      }
      return {
        id: doc.id,
        ...data,
      } as Case;
    });
  } catch (err) {
    console.error("Error fetching cases:", err);
    return [];
  }
}

export async function getCaseById(id: string): Promise<Case | null> {
  try {
    const docRef = doc(db, COLLECTIONS.cases, id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    const data = convertTimestamps(docSnap.data());
    // Handle migration: if old format has imageUrl, convert to images array
    if (data.imageUrl && !data.images) {
      data.images = [data.imageUrl];
      data.primaryImageIndex = 0;
    }
    
    return {
      id: docSnap.id,
      ...data,
    } as Case;
  } catch (err) {
    console.error("Error fetching case:", err);
    return null;
  }
}

export async function createCase(data: CaseFormData): Promise<{ success: true; id: string } | { success: false; error: string }> {
  try {
    // Clean up data before validation
    const cleanedData = {
      title: data.title?.trim() || "",
      description: data.description?.trim() || undefined,
      images: data.images || [],
      primaryImageIndex: typeof data.primaryImageIndex === "number" ? data.primaryImageIndex : 0,
    };

    // Log for debugging
    console.log("Creating case with data:", cleanedData);

    const validated = caseSchema.parse(cleanedData);
    
    // Ensure primaryImageIndex is valid
    const primaryIndex = validated.primaryImageIndex ?? 0;
    if (primaryIndex < 0 || primaryIndex >= validated.images.length) {
      return { success: false, error: "Primary image index is out of range." };
    }
    
    // Prepare payload, omitting undefined values (Firestore doesn't accept undefined)
    const payload: Record<string, any> = {
      title: validated.title,
      images: validated.images,
      primaryImageIndex: primaryIndex,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // Only include description if it's not empty
    if (validated.description && validated.description.trim().length > 0) {
      payload.description = validated.description.trim();
    }
    
    const ref = await addDoc(
      collection(db, COLLECTIONS.cases),
      payload
    );
    
    return { success: true, id: ref.id };
  } catch (err) {
    console.error("Case creation error:", err);
    if (err && typeof err === "object" && "name" in err && err.name === "ZodError") {
      // Provide more detailed error message
      const zodError = err as any;
      console.error("Zod validation errors:", zodError.errors);
      if (zodError.errors && zodError.errors.length > 0) {
        const firstError = zodError.errors[0];
        const fieldPath = firstError.path && firstError.path.length > 0 
          ? firstError.path.join(".") 
          : "unknown";
        return { success: false, error: `${fieldPath}: ${firstError.message}` };
      }
      return { success: false, error: "Invalid case data. Please check all fields." };
    }
    const message = err instanceof Error ? err.message : "Failed to create case";
    return { success: false, error: message };
  }
}

export async function updateCase(
  id: string,
  data: CaseFormData
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    // Clean up data before validation
    const cleanedData = {
      title: data.title?.trim() || "",
      description: data.description?.trim() || undefined,
      images: data.images || [],
      primaryImageIndex: typeof data.primaryImageIndex === "number" ? data.primaryImageIndex : 0,
    };

    // Log for debugging
    console.log("Updating case with data:", cleanedData);

    const validated = caseSchema.parse(cleanedData);
    
    // Ensure primaryImageIndex is valid
    const primaryIndex = validated.primaryImageIndex ?? 0;
    if (primaryIndex < 0 || primaryIndex >= validated.images.length) {
      return { success: false, error: "Primary image index is out of range." };
    }
    
    // Prepare update payload, omitting undefined values (Firestore doesn't accept undefined)
    const updatePayload: Record<string, any> = {
      title: validated.title,
      images: validated.images,
      primaryImageIndex: primaryIndex,
      updatedAt: serverTimestamp(),
    };

    // Only include description if it's not empty, or delete it if it's empty
    if (validated.description && validated.description.trim().length > 0) {
      updatePayload.description = validated.description.trim();
    } else {
      // Delete the description field if it's empty (using deleteField())
      updatePayload.description = deleteField();
    }
    
    const docRef = doc(db, COLLECTIONS.cases, id);
    await updateDoc(docRef, updatePayload);
    
    return { success: true };
  } catch (err) {
    console.error("Case update error:", err);
    if (err && typeof err === "object" && "name" in err && err.name === "ZodError") {
      // Provide more detailed error message
      const zodError = err as any;
      console.error("Zod validation errors:", zodError.errors);
      if (zodError.errors && zodError.errors.length > 0) {
        const firstError = zodError.errors[0];
        const fieldPath = firstError.path && firstError.path.length > 0 
          ? firstError.path.join(".") 
          : "unknown";
        return { success: false, error: `${fieldPath}: ${firstError.message}` };
      }
      return { success: false, error: "Invalid case data. Please check all fields." };
    }
    const message = err instanceof Error ? err.message : "Failed to update case";
    return { success: false, error: message };
  }
}

export async function deleteCase(id: string): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const docRef = doc(db, COLLECTIONS.cases, id);
    await deleteDoc(docRef);
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete case";
    return { success: false, error: message };
  }
}
