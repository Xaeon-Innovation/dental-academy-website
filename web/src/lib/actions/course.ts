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
  where,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db, COLLECTIONS } from "@/lib/firebase/firestore";
import { courseSchema, type CourseFormData } from "@/lib/validations/course";
import type { Course, CourseCreatePayload, CourseUpdatePayload } from "@/types/course";

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

export async function getCourses(): Promise<Course[]> {
  try {
    const coursesRef = collection(db, COLLECTIONS.courses);
    const q = query(coursesRef, orderBy("order", "asc"));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...convertTimestamps(doc.data()),
    })) as Course[];
  } catch (err) {
    console.error("Error fetching courses:", err);
    return [];
  }
}

export async function getCourseBySlug(slug: string): Promise<Course | null> {
  try {
    const coursesRef = collection(db, COLLECTIONS.courses);
    const q = query(coursesRef, where("slug", "==", slug));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }
    
    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...convertTimestamps(doc.data()),
    } as Course;
  } catch (err) {
    console.error("Error fetching course by slug:", err);
    return null;
  }
}

export async function getCourseById(id: string): Promise<Course | null> {
  try {
    const docRef = doc(db, COLLECTIONS.courses, id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    return {
      id: docSnap.id,
      ...convertTimestamps(docSnap.data()),
    } as Course;
  } catch (err) {
    console.error("Error fetching course by id:", err);
    return null;
  }
}

export async function createCourse(
  data: CourseFormData
): Promise<{ success: true; id: string } | { success: false; error: string }> {
  try {
    // Validate data
    const validated = courseSchema.parse(data);
    
    // Check if slug already exists
    const existing = await getCourseBySlug(validated.slug);
    if (existing) {
      return { success: false, error: "A course with this slug already exists" };
    }
    
    const payload = omitUndefined({
      ...validated,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    const ref = await addDoc(collection(db, COLLECTIONS.courses), payload);
    
    return { success: true, id: ref.id };
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") {
      return { success: false, error: "Validation failed: " + err.message };
    }
    const message = err instanceof Error ? err.message : "Failed to create course";
    return { success: false, error: message };
  }
}

export async function updateCourse(
  id: string,
  data: Partial<CourseFormData>
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    // Check if course exists
    const existing = await getCourseById(id);
    if (!existing) {
      return { success: false, error: "Course not found" };
    }
    
    // If slug is being updated, check if new slug is available
    if (data.slug && data.slug !== existing.slug) {
      const slugExists = await getCourseBySlug(data.slug);
      if (slugExists) {
        return { success: false, error: "A course with this slug already exists" };
      }
    }
    
    // Validate data if provided
    let validated = data;
    if (Object.keys(data).length > 0) {
      const fullData = { ...existing, ...data };
      validated = courseSchema.partial().parse(fullData);
    }
    
    const payload = omitUndefined({
      ...validated,
      updatedAt: serverTimestamp(),
    });
    
    const docRef = doc(db, COLLECTIONS.courses, id);
    await updateDoc(docRef, payload);
    
    return { success: true };
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") {
      return { success: false, error: "Validation failed: " + err.message };
    }
    const message = err instanceof Error ? err.message : "Failed to update course";
    return { success: false, error: message };
  }
}

export async function deleteCourse(
  id: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const docRef = doc(db, COLLECTIONS.courses, id);
    await deleteDoc(docRef);
    
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete course";
    return { success: false, error: message };
  }
}
