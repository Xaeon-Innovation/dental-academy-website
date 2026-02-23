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
import { instructorSchema, type InstructorFormData } from "@/lib/validations/instructor";
import type { Instructor, InstructorPageVisibility } from "@/types/instructor";

function omitUndefined<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as Record<string, unknown>;
}

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

export async function getInstructors(): Promise<Instructor[]> {
  try {
    const instructorsRef = collection(db, COLLECTIONS.instructors);
    const q = query(instructorsRef, orderBy("name", "asc"));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...convertTimestamps(doc.data()),
    })) as Instructor[];
  } catch (err) {
    console.error("Error fetching instructors:", err);
    return [];
  }
}

/** Page key for filtering instructors by visibility. */
export type InstructorPageKey = InstructorPageVisibility;

export async function getInstructorsForPage(
  page: InstructorPageKey
): Promise<Instructor[]> {
  const all = await getInstructors();
  return all.filter((instructor) => {
    const visibleOn = instructor.visibleOn;
    // Backward compat: undefined or empty = show on all pages
    if (!visibleOn || visibleOn.length === 0) return true;
    return visibleOn.includes(page);
  });
}

export async function getInstructorById(id: string): Promise<Instructor | null> {
  try {
    const docRef = doc(db, COLLECTIONS.instructors, id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    return {
      id: docSnap.id,
      ...convertTimestamps(docSnap.data()),
    } as Instructor;
  } catch (err) {
    console.error("Error fetching instructor by id:", err);
    return null;
  }
}

export async function createInstructor(
  data: InstructorFormData
): Promise<{ success: true; id: string } | { success: false; error: string }> {
  try {
    const validated = instructorSchema.parse(data);
    
    const payload = omitUndefined({
      ...validated,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    const ref = await addDoc(collection(db, COLLECTIONS.instructors), payload);
    
    return { success: true, id: ref.id };
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") {
      return { success: false, error: "Validation failed: " + err.message };
    }
    const message = err instanceof Error ? err.message : "Failed to create instructor";
    return { success: false, error: message };
  }
}

export async function updateInstructor(
  id: string,
  data: Partial<InstructorFormData>
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const existing = await getInstructorById(id);
    if (!existing) {
      return { success: false, error: "Instructor not found" };
    }
    
    let validated = data;
    if (Object.keys(data).length > 0) {
      validated = instructorSchema.partial().parse(data);
    }
    
    const payload = omitUndefined({
      ...validated,
      updatedAt: serverTimestamp(),
    });
    
    const docRef = doc(db, COLLECTIONS.instructors, id);
    await updateDoc(docRef, payload);
    
    return { success: true };
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") {
      return { success: false, error: "Validation failed: " + err.message };
    }
    const message = err instanceof Error ? err.message : "Failed to update instructor";
    return { success: false, error: message };
  }
}

export async function deleteInstructor(
  id: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const docRef = doc(db, COLLECTIONS.instructors, id);
    await deleteDoc(docRef);
    
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete instructor";
    return { success: false, error: message };
  }
}
