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
import { getAdminDb } from "@/lib/firebase/admin";
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
    const ref = doc(db, COLLECTIONS.courses, id);
    const snap = await getDoc(ref);
    
    if (!snap.exists()) {
      return null;
    }
    
    return {
      id: snap.id,
      ...convertTimestamps(snap.data()),
    } as Course;
  } catch (err) {
    console.error("Error fetching course by id:", err);
    return null;
  }
}

export async function getEnrollmentCount(courseId: string): Promise<number> {
  try {
    const adminDb = getAdminDb();
    if (adminDb) {
      // Firestore doesn't support !=, so we get all and filter
      const snapshot = await adminDb
        .collection(COLLECTIONS.registrations)
        .where("courseId", "==", courseId)
        .get();
      return snapshot.docs.filter((d) => d.data().status !== "cancelled").length;
    }
    const ref = collection(db, COLLECTIONS.registrations);
    const q = query(ref, where("courseId", "==", courseId));
    const snapshot = await getDocs(q);
    return snapshot.docs.filter((d) => d.data().status !== "cancelled").length;
  } catch (err) {
    console.error("Error counting enrollments:", err);
    return 0;
  }
}

export async function createCourse(data: CourseFormData): Promise<{ success: true; id: string } | { success: false; error: string }> {
  try {
    const validated = courseSchema.parse(data);
    
    // Check if slug already exists
    const existing = await getCourseBySlug(validated.slug);
    if (existing) {
      return { success: false, error: "A course with this slug already exists." };
    }
    
    const payload = omitUndefined({
      ...validated,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    const ref = await addDoc(
      collection(db, COLLECTIONS.courses),
      payload
    );
    
    return { success: true, id: ref.id };
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") {
      return { success: false, error: "Invalid course data." };
    }
    const message = err instanceof Error ? err.message : "Failed to create course";
    return { success: false, error: message };
  }
}

export async function updateCourse(
  id: string,
  data: CourseFormData
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const validated = courseSchema.parse(data);
    
    // Check if slug exists for another course
    const existing = await getCourseBySlug(validated.slug);
    if (existing && existing.id !== id) {
      return { success: false, error: "A course with this slug already exists." };
    }
    
    const ref = doc(db, COLLECTIONS.courses, id);
    const payload = omitUndefined({
      ...validated,
      updatedAt: serverTimestamp(),
    });
    
    await updateDoc(ref, payload);
    
    return { success: true };
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") {
      return { success: false, error: "Invalid course data." };
    }
    const message = err instanceof Error ? err.message : "Failed to update course";
    return { success: false, error: message };
  }
}

export async function deleteCourse(id: string): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const ref = doc(db, COLLECTIONS.courses, id);
    await deleteDoc(ref);
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete course";
    return { success: false, error: message };
  }
}
