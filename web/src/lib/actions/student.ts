"use server";

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db, COLLECTIONS } from "@/lib/firebase/firestore";
import { getAdminDb, getAdminApp } from "@/lib/firebase/admin";
import type { StudentProfile, StudentProfileCreatePayload, StudentProfileUpdatePayload } from "@/types/student";
import type { Registration } from "@/types/registration";

function toDate(val: unknown): Date | undefined {
  if (val && typeof (val as { toDate?: () => Date }).toDate === "function") {
    return (val as { toDate: () => Date }).toDate();
  }
  return undefined;
}

function convertTimestamps(data: Record<string, unknown> | null): Record<string, unknown> | null {
  if (!data) return data;
  const converted = { ...data };
  converted.createdAt = toDate(converted.createdAt) ?? converted.createdAt;
  converted.updatedAt = toDate(converted.updatedAt) ?? converted.updatedAt;
  if (converted.savedFormSnapshot && typeof converted.savedFormSnapshot === "object") {
    converted.savedFormSnapshot = converted.savedFormSnapshot as Record<string, unknown>;
  }
  return converted;
}

export async function getStudentProfile(uid: string): Promise<StudentProfile | null> {
  try {
    const adminDb = getAdminDb();
    if (adminDb) {
      const snap = await adminDb.collection(COLLECTIONS.students).doc(uid).get();
      if (!snap.exists) return null;
      const data = convertTimestamps({ ...snap.data(), uid: snap.id });
      return data as unknown as StudentProfile;
    }
    const ref = doc(db, COLLECTIONS.students, uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const data = convertTimestamps({ ...snap.data(), uid: snap.id });
    return data as unknown as StudentProfile;
  } catch (err) {
    console.error("Error fetching student profile:", err);
    return null;
  }
}

export async function createOrUpdateStudentProfile(
  uid: string,
  data: StudentProfileCreatePayload | StudentProfileUpdatePayload
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const adminDb = getAdminDb();
    if (adminDb) {
      const { FieldValue } = await import("firebase-admin/firestore");
      const ref = adminDb.collection(COLLECTIONS.students).doc(uid);
      const snap = await ref.get();
      const now = FieldValue.serverTimestamp();
      if (snap.exists) {
        const updateData: Record<string, unknown> = { ...data, updatedAt: now };
        delete updateData.uid;
        delete updateData.createdAt;
        await ref.update(updateData);
      } else {
        await ref.set({ uid, ...data, createdAt: now, updatedAt: now });
      }
      return { success: true };
    }
    const ref = doc(db, COLLECTIONS.students, uid);
    const snap = await getDoc(ref);
    const now = serverTimestamp();
    if (snap.exists()) {
      const updateData: Record<string, unknown> = { ...data, updatedAt: now };
      delete updateData.uid;
      delete updateData.createdAt;
      await updateDoc(ref, updateData);
    } else {
      await setDoc(ref, { uid, ...data, createdAt: now, updatedAt: now });
    }
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save student profile";
    return { success: false, error: message };
  }
}

export async function getRegistrationsByUserId(uid: string): Promise<(Registration & { id: string })[]> {
  try {
    const adminDb = getAdminDb();
    if (adminDb) {
      const snapshot = await adminDb.collection(COLLECTIONS.registrations).where("userId", "==", uid).get();
      return snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          createdAt: toDate(data.createdAt),
          updatedAt: toDate(data.updatedAt),
        } as Registration & { id: string };
      });
    }
    const ref = collection(db, COLLECTIONS.registrations);
    const q = query(ref, where("userId", "==", uid));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => {
      const data = d.data();
      const createdAt = data.createdAt instanceof Timestamp ? data.createdAt.toDate() : undefined;
      const updatedAt = data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : undefined;
      return { id: d.id, ...data, createdAt, updatedAt } as Registration & { id: string };
    });
  } catch (err) {
    console.error("Error fetching registrations by user:", err);
    return [];
  }
}

export async function updateStudentSavedForm(
  uid: string,
  snapshot: Partial<import("@/lib/validations/registration").RegistrationFormData>
): Promise<{ success: true } | { success: false; error: string }> {
  return createOrUpdateStudentProfile(uid, { savedFormSnapshot: snapshot });
}

export async function getAllStudents(): Promise<(StudentProfile & { id: string })[]> {
  try {
    const adminDb = getAdminDb();
    let students: (StudentProfile & { id: string })[] = [];

    if (adminDb) {
      const snapshot = await adminDb.collection(COLLECTIONS.students).get();
      students = snapshot.docs.map((d) => {
        const docData = d.data();
        const data = convertTimestamps({ ...docData, uid: d.id });
        return {
          id: d.id,
          uid: d.id,
          email: "", // Will be populated from Auth
          phone: docData.phone || "",
          displayName: docData.displayName,
          savedFormSnapshot: docData.savedFormSnapshot,
          createdAt: data?.createdAt as Date | undefined,
          updatedAt: data?.updatedAt as Date | undefined,
        } as StudentProfile & { id: string };
      });
    } else {
      const ref = collection(db, COLLECTIONS.students);
      const snapshot = await getDocs(ref);
      students = snapshot.docs.map((d) => {
        const data = d.data();
        const createdAt = data.createdAt instanceof Timestamp ? data.createdAt.toDate() : undefined;
        const updatedAt = data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : undefined;
        return {
          id: d.id,
          uid: d.id,
          email: "", // Will be populated from Auth
          phone: data.phone || "",
          displayName: data.displayName,
          savedFormSnapshot: data.savedFormSnapshot,
          createdAt,
          updatedAt,
        } as StudentProfile & { id: string };
      });
    }

    // Fetch emails from Firebase Auth using Admin SDK
    try {
      const adminApp = getAdminApp();
      const { getAuth } = await import("firebase-admin/auth");
      const adminAuth = getAuth(adminApp);

      // Fetch emails for all students in parallel
      const studentsWithEmails = await Promise.all(
        students.map(async (student) => {
          try {
            const userRecord = await adminAuth.getUser(student.uid);
            return {
              ...student,
              email: userRecord.email || "",
            };
          } catch (authError: any) {
            // If user not found in Auth, keep empty email
            console.warn(`User ${student.uid} not found in Firebase Auth:`, authError.message);
            return student;
          }
        })
      );

      return studentsWithEmails;
    } catch (authError: any) {
      // If Admin Auth fails, return students without emails
      console.warn("Failed to fetch emails from Firebase Auth:", authError.message);
      return students;
    }
  } catch (err) {
    console.error("Error fetching all students:", err);
    return [];
  }
}
