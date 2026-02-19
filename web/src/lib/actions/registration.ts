"use server";

import { addDoc, collection, serverTimestamp, query, orderBy, getDocs, getDoc, where, Timestamp, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db, COLLECTIONS } from "@/lib/firebase/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import type { RegistrationFormData } from "@/lib/validations/registration";
import type { Registration, RegistrationStatus } from "@/types/registration";
import { updateStudentSavedForm } from "@/lib/actions/student";

function omitUndefined<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as Record<string, unknown>;
}

function toDate(val: unknown): Date | undefined {
  if (val && typeof (val as { toDate?: () => Date }).toDate === "function") {
    return (val as { toDate: () => Date }).toDate();
  }
  if (val instanceof Timestamp) {
    return val.toDate();
  }
  return undefined;
}

/** Returns an existing non-cancelled registration for the same user/course or email/course, or null. */
async function getExistingRegistration(
  courseId: string,
  userId?: string,
  email?: string
): Promise<{ id: string } | null> {
  const nonCancelled = (d: { data: () => { status?: string } }) => d.data().status !== "cancelled";

  try {
    const adminDb = getAdminDb();
    if (adminDb) {
      if (userId) {
        const snapshot = await adminDb
          .collection(COLLECTIONS.registrations)
          .where("userId", "==", userId)
          .where("courseId", "==", courseId)
          .get();
        const existing = snapshot.docs.find(nonCancelled);
        return existing ? { id: existing.id } : null;
      }
      if (email) {
        const snapshot = await adminDb
          .collection(COLLECTIONS.registrations)
          .where("email", "==", email)
          .where("courseId", "==", courseId)
          .get();
        const existing = snapshot.docs.find(nonCancelled);
        return existing ? { id: existing.id } : null;
      }
      return null;
    }
    const ref = collection(db, COLLECTIONS.registrations);
    if (userId) {
      const q = query(ref, where("userId", "==", userId), where("courseId", "==", courseId));
      const snapshot = await getDocs(q);
      const existing = snapshot.docs.find(nonCancelled);
      return existing ? { id: existing.id } : null;
    }
    if (email) {
      const q = query(ref, where("email", "==", email), where("courseId", "==", courseId));
      const snapshot = await getDocs(q);
      const existing = snapshot.docs.find(nonCancelled);
      return existing ? { id: existing.id } : null;
    }
    return null;
  } catch (err) {
    console.error("Error checking existing registration:", err);
    return null;
  }
}

export async function submitRegistration(
  data: RegistrationFormData,
  userId?: string
): Promise<{ success: true; id: string } | { success: false; error: string }> {
  try {
    const existing = await getExistingRegistration(data.courseId, userId, data.email);
    if (existing) {
      return { success: false, error: "You are already enrolled in this course." };
    }

    const payload = omitUndefined({
      ...data,
      ...(userId ? { userId } : {}),
      status: "pending",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const ref = await addDoc(
      collection(db, COLLECTIONS.registrations),
      payload
    );

    if (userId) {
      await updateStudentSavedForm(userId, data);
    }

    return { success: true, id: ref.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to submit registration";
    return { success: false, error: message };
  }
}

export async function getAllRegistrations(): Promise<(Registration & { id: string })[]> {
  try {
    const adminDb = getAdminDb();
    if (adminDb) {
      // Admin SDK uses different query syntax
      const snapshot = await adminDb
        .collection(COLLECTIONS.registrations)
        .orderBy("createdAt", "desc")
        .get();
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
    const q = query(ref, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => {
      const data = d.data();
      const createdAt = data.createdAt instanceof Timestamp ? data.createdAt.toDate() : undefined;
      const updatedAt = data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : undefined;
      return { id: d.id, ...data, createdAt, updatedAt } as Registration & { id: string };
    });
  } catch (err) {
    console.error("Error fetching all registrations:", err);
    return [];
  }
}

/** Returns the registration if it exists and is owned by the given user; otherwise null. */
export async function getRegistrationByIdForUser(
  registrationId: string,
  userId: string
): Promise<(Registration & { id: string }) | null> {
  try {
    const adminDb = getAdminDb();
    if (adminDb) {
      const ref = adminDb.collection(COLLECTIONS.registrations).doc(registrationId);
      const snap = await ref.get();
      if (!snap.exists) return null;
      const data = snap.data()!;
      if (data.userId !== userId) return null;
      return {
        id: snap.id,
        ...data,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
      } as Registration & { id: string };
    }
    const ref = doc(db, COLLECTIONS.registrations, registrationId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const data = snap.data();
    if (data?.userId !== userId) return null;
    return {
      id: snap.id,
      ...data,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : undefined,
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : undefined,
    } as Registration & { id: string };
  } catch (err) {
    console.error("Error fetching registration for user:", err);
    return null;
  }
}

/** Editable fields when a student updates their own pending registration. */
const STUDENT_EDITABLE_FIELDS = [
  "name", "email", "phone", "country", "instagramHandle",
  "currentRole", "yearsExperience", "primaryWorkSetting", "gdcNumber",
  "hasPlacedImplants", "implantsPlacedCount", "hasRestoredCases", "aspectsToDevelop",
  "preferredFormat", "howDidYouHear", "whatAttractedYou",
  "contactByWhatsApp", "consentContact", "singleOccupancyUpgrade",
] as const;

export async function updateRegistrationByStudent(
  registrationId: string,
  data: RegistrationFormData,
  userId: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const payload: Record<string, unknown> = {};
    for (const key of STUDENT_EDITABLE_FIELDS) {
      const val = data[key];
      if (val !== undefined) payload[key] = val;
    }

    const adminDb = getAdminDb();
    if (adminDb) {
      const { FieldValue } = await import("firebase-admin/firestore");
      const ref = adminDb.collection(COLLECTIONS.registrations).doc(registrationId);
      const snap = await ref.get();
      if (!snap.exists) return { success: false, error: "Enrollment not found." };
      const existing = snap.data()!;
      if (existing.userId !== userId) return { success: false, error: "You can only update your own enrollment." };
      if (existing.status !== "pending") return { success: false, error: "You can only update an enrollment that is still pending. Once confirmed, it cannot be changed." };
      await ref.update({ ...payload, updatedAt: FieldValue.serverTimestamp() });
      return { success: true };
    }
    const ref = doc(db, COLLECTIONS.registrations, registrationId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return { success: false, error: "Enrollment not found." };
    const existing = snap.data();
    if (existing?.userId !== userId) return { success: false, error: "You can only update your own enrollment." };
    if (existing?.status !== "pending") return { success: false, error: "You can only update an enrollment that is still pending. Once confirmed, it cannot be changed." };
    await updateDoc(ref, { ...payload, updatedAt: serverTimestamp() });
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update enrollment";
    return { success: false, error: message };
  }
}

export async function updateRegistrationStatus(
  registrationId: string,
  status: RegistrationStatus
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const adminDb = getAdminDb();
    if (adminDb) {
      const { FieldValue } = await import("firebase-admin/firestore");
      const ref = adminDb.collection(COLLECTIONS.registrations).doc(registrationId);
      await ref.update({
        status,
        updatedAt: FieldValue.serverTimestamp(),
      });
      return { success: true };
    }
    const ref = doc(db, COLLECTIONS.registrations, registrationId);
    await updateDoc(ref, {
      status,
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update registration status";
    return { success: false, error: message };
  }
}

export async function deleteRegistration(
  registrationId: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const adminDb = getAdminDb();
    if (adminDb) {
      const ref = adminDb.collection(COLLECTIONS.registrations).doc(registrationId);
      await ref.delete();
      return { success: true };
    }
    const ref = doc(db, COLLECTIONS.registrations, registrationId);
    await deleteDoc(ref);
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete enrollment";
    return { success: false, error: message };
  }
}
