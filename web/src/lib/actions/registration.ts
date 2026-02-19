"use server";

import { addDoc, collection, serverTimestamp, query, orderBy, getDocs, Timestamp, doc, updateDoc } from "firebase/firestore";
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

export async function submitRegistration(
  data: RegistrationFormData,
  userId?: string
): Promise<{ success: true; id: string } | { success: false; error: string }> {
  try {
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
