"use server";

import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db, COLLECTIONS } from "@/lib/firebase/firestore";
import type { RegistrationFormData } from "@/lib/validations/registration";

function omitUndefined<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as Record<string, unknown>;
}

export async function submitRegistration(data: RegistrationFormData): Promise<{ success: true; id: string } | { success: false; error: string }> {
  try {
    const payload = omitUndefined({
      ...data,
      status: "pending",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const ref = await addDoc(
      collection(db, COLLECTIONS.registrations),
      payload
    );

    return { success: true, id: ref.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to submit registration";
    return { success: false, error: message };
  }
}
