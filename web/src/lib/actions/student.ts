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
import { getAuth } from "firebase-admin/auth";
import { isAdminEmail } from "@/lib/actions/settings";
import type { StudentProfile, StudentProfileCreatePayload, StudentProfileUpdatePayload } from "@/types/student";
import type { Registration } from "@/types/registration";
import { normalizeEmail, normalizePhone } from "@/lib/identity";

function toDate(val: unknown): Date | undefined {
  if (val && typeof (val as { toDate?: () => Date }).toDate === "function") {
    return (val as { toDate: () => Date }).toDate();
  }
  if (val instanceof Timestamp) {
    return val.toDate();
  }
  if (val && typeof val === "object" && "_seconds" in val && typeof (val as { _seconds: number })._seconds === "number") {
    const s = (val as { _seconds: number; _nanoseconds?: number })._seconds;
    return new Date(s * 1000);
  }
  return undefined;
}

/** Normalize registration so Firestore Timestamps become plain Dates (serializable to Client Components). */
function normalizeRegistrationForClient(
  id: string,
  data: Record<string, unknown>
): Registration & { id: string } {
  const sr = data.specialRequest as { description?: string; requestedAt?: unknown; status?: string } | undefined;
  return {
    ...data,
    id,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
    paidAt: toDate(data.paidAt),
    specialRequest: sr
      ? {
          description: sr.description ?? "",
          status: (sr.status as Registration["specialRequest"]["status"]) ?? "pending",
          requestedAt: toDate(sr.requestedAt) ?? new Date(0),
        }
      : undefined,
  } as Registration & { id: string };
}

function convertTimestamps(data: Record<string, unknown> | null): Record<string, unknown> | null {
  if (!data) return data;
  const converted = { ...data };
  converted.createdAt = toDate(converted.createdAt) ?? converted.createdAt;
  converted.updatedAt = toDate(converted.updatedAt) ?? converted.updatedAt;
  converted.approvedAt = toDate(converted.approvedAt) ?? converted.approvedAt;
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
    const nextData: Record<string, unknown> = { ...data };
    if (typeof nextData.email === "string" && nextData.email.trim()) {
      nextData.normalizedEmail = normalizeEmail(nextData.email);
    }
    if (typeof nextData.phone === "string" && nextData.phone.trim()) {
      nextData.normalizedPhone = normalizePhone(nextData.phone);
    }
    if (nextData.loginEnabled === undefined) {
      nextData.loginEnabled = true;
    }
    const adminDb = getAdminDb();
    if (adminDb) {
      const { FieldValue } = await import("firebase-admin/firestore");
      const ref = adminDb.collection(COLLECTIONS.students).doc(uid);
      const snap = await ref.get();
      const now = FieldValue.serverTimestamp();
      if (snap.exists) {
        const updateData: Record<string, unknown> = { ...nextData, updatedAt: now };
        delete updateData.uid;
        delete updateData.createdAt;
        await ref.update(updateData);
      } else {
        await ref.set({ uid, ...nextData, createdAt: now, updatedAt: now });
      }
      return { success: true };
    }
    const ref = doc(db, COLLECTIONS.students, uid);
    const snap = await getDoc(ref);
    const now = serverTimestamp();
    if (snap.exists()) {
      const updateData: Record<string, unknown> = { ...nextData, updatedAt: now };
      delete updateData.uid;
      delete updateData.createdAt;
      await updateDoc(ref, updateData);
    } else {
      await setDoc(ref, { uid, ...nextData, createdAt: now, updatedAt: now });
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
      return snapshot.docs.map((d) => normalizeRegistrationForClient(d.id, d.data() as Record<string, unknown>));
    }
    const ref = collection(db, COLLECTIONS.registrations);
    const q = query(ref, where("userId", "==", uid));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => {
      const data = d.data() as Record<string, unknown>;
      return normalizeRegistrationForClient(d.id, data);
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

/**
 * Admin-only: delete a delegate’s Firebase Auth account, `students/{uid}` doc, and their registration docs
 * (by `userId` and by email when the Auth user exists).
 */
export async function deleteDelegateUser(
  uid: string,
  idToken: string
): Promise<{ success: true } | { success: false; error: string }> {
  const trimmedUid = uid?.trim();
  if (!trimmedUid) {
    return { success: false, error: "User ID is required." };
  }

  try {
    const adminApp = getAdminApp();
    const adminAuth = getAuth(adminApp);

    let decoded: { uid: string; email?: string };
    try {
      decoded = await adminAuth.verifyIdToken(idToken);
    } catch {
      return { success: false, error: "Your session expired. Please sign in again." };
    }

    if (!(await isAdminEmail(decoded.email))) {
      return { success: false, error: "Only admins can delete delegate accounts." };
    }

    if (decoded.uid === trimmedUid) {
      return { success: false, error: "You cannot delete your own account from here." };
    }

    let targetEmail: string | null = null;
    try {
      const userRecord = await adminAuth.getUser(trimmedUid);
      targetEmail = userRecord.email?.toLowerCase().trim() ?? null;
      if (targetEmail && (await isAdminEmail(targetEmail))) {
        return {
          success: false,
          error:
            "This account is an admin. Remove admin access in Settings before deleting, or use the admin user tools.",
        };
      }
    } catch (e: unknown) {
      const code =
        e && typeof e === "object" && "code" in e ? String((e as { code: string }).code) : "";
      if (code !== "auth/user-not-found") {
        const message = e instanceof Error ? e.message : "Failed to look up user.";
        return { success: false, error: message };
      }
    }

    const adminDb = getAdminDb();
    if (!adminDb) {
      return { success: false, error: "Admin database is not available on the server." };
    }

    const regCol = adminDb.collection(COLLECTIONS.registrations);
    const registrationIds = new Set<string>();

    const byUid = await regCol.where("userId", "==", trimmedUid).get();
    byUid.docs.forEach((d) => registrationIds.add(d.id));

    if (targetEmail) {
      const byEmail = await regCol.where("email", "==", targetEmail).get();
      byEmail.docs.forEach((d) => registrationIds.add(d.id));
    }

    const ids = [...registrationIds];
    const chunkSize = 400;
    for (let i = 0; i < ids.length; i += chunkSize) {
      const batch = adminDb.batch();
      for (const id of ids.slice(i, i + chunkSize)) {
        batch.delete(regCol.doc(id));
      }
      await batch.commit();
    }

    await adminDb.collection(COLLECTIONS.students).doc(trimmedUid).delete();

    try {
      await adminAuth.deleteUser(trimmedUid);
    } catch (e: unknown) {
      const code =
        e && typeof e === "object" && "code" in e ? String((e as { code: string }).code) : "";
      if (code !== "auth/user-not-found") {
        const message = e instanceof Error ? e.message : "Failed to delete Firebase Auth user.";
        return {
          success: false,
          error: `Registrations and profile were removed, but Auth deletion failed: ${message}`,
        };
      }
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete delegate";
    return { success: false, error: message };
  }
}
