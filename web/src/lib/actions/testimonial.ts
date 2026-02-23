"use server";

import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db, COLLECTIONS } from "@/lib/firebase/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import type { Testimonial, TestimonialDisplayItem } from "@/types/testimonial";
import { getRegistrationsByUserId } from "@/lib/actions/student";

function toDate(val: unknown): Date | undefined {
  if (val instanceof Timestamp) return val.toDate();
  if (val && typeof (val as { toDate?: () => Date }).toDate === "function") {
    return (val as { toDate: () => Date }).toDate();
  }
  return undefined;
}

/** Returns testimonials for the Home marquee: approved only, as display items, newest first. */
export async function getTestimonialsForDisplay(): Promise<TestimonialDisplayItem[]> {
  try {
    const adminDb = getAdminDb();

    if (adminDb) {
      const snapshot = await adminDb
        .collection(COLLECTIONS.testimonials)
        .where("status", "==", "approved")
        .get();
      const items = snapshot.docs.map((d) => {
        const data = d.data();
        const createdAt = toDate(data.createdAt);
        return {
          name: (data.displayName as string)?.trim() || "Student",
          rating: typeof data.rating === "number" ? data.rating : 5,
          quote: (data.quote as string)?.trim() || "",
          _createdAt: createdAt ? createdAt.getTime() : 0,
        };
      });
      items.sort((a, b) => b._createdAt - a._createdAt);
      return items.map(({ _createdAt: _, ...rest }) => rest);
    }

    const q = query(
      collection(db, COLLECTIONS.testimonials),
      where("status", "==", "approved")
    );
    const snapshot = await getDocs(q);
    const items = snapshot.docs.map((d) => {
      const data = d.data();
      const createdAt = toDate(data.createdAt);
      return {
        name: (data.displayName as string)?.trim() || "Student",
        rating: typeof data.rating === "number" ? data.rating : 5,
        quote: (data.quote as string)?.trim() || "",
        _createdAt: createdAt ? createdAt.getTime() : 0,
      };
    });
    items.sort((a, b) => b._createdAt - a._createdAt);
    return items.map(({ _createdAt: _, ...rest }) => rest);
  } catch (err) {
    console.error("Error fetching testimonials for display:", err);
    return [];
  }
}

/** Returns all testimonials for admin (home management). Newest first. */
export async function getAllTestimonials(): Promise<
  (Testimonial & { id: string })[]
> {
  try {
    const adminDb = getAdminDb();
    if (adminDb) {
      const snapshot = await adminDb
        .collection(COLLECTIONS.testimonials)
        .get();
      const items = snapshot.docs.map((d) => {
        const data = d.data();
        const createdAt = toDate(data.createdAt);
        return {
          id: d.id,
          userId: data.userId as string,
          courseId: data.courseId as string,
          rating: (data.rating as number) ?? 5,
          quote: (data.quote as string) ?? "",
          displayName: data.displayName as string | undefined,
          status: (data.status as Testimonial["status"]) ?? "approved",
          createdAt,
          updatedAt: toDate(data.updatedAt),
        } as Testimonial & { id: string };
      });
      items.sort((a, b) => {
        const ta = a.createdAt?.getTime() ?? 0;
        const tb = b.createdAt?.getTime() ?? 0;
        return tb - ta;
      });
      return items;
    }
    const snapshot = await getDocs(
      collection(db, COLLECTIONS.testimonials)
    );
    const items = snapshot.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        userId: data.userId as string,
        courseId: data.courseId as string,
        rating: (data.rating as number) ?? 5,
        quote: (data.quote as string) ?? "",
        displayName: data.displayName as string | undefined,
        status: (data.status as Testimonial["status"]) ?? "approved",
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
      } as Testimonial & { id: string };
    });
    items.sort((a, b) => {
      const ta = a.createdAt?.getTime() ?? 0;
      const tb = b.createdAt?.getTime() ?? 0;
      return tb - ta;
    });
    return items;
  } catch (err) {
    console.error("Error fetching all testimonials:", err);
    return [];
  }
}

/** Returns all testimonials for a user (for portal: show which courses already have one). */
export async function getTestimonialsByUserId(
  uid: string
): Promise<(Testimonial & { id: string })[]> {
  try {
    const adminDb = getAdminDb();
    if (adminDb) {
      const snapshot = await adminDb
        .collection(COLLECTIONS.testimonials)
        .where("userId", "==", uid)
        .get();
      return snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          userId: data.userId as string,
          courseId: data.courseId as string,
          rating: (data.rating as number) ?? 5,
          quote: (data.quote as string) ?? "",
          displayName: data.displayName as string | undefined,
          status: (data.status as Testimonial["status"]) ?? "approved",
          createdAt: toDate(data.createdAt),
          updatedAt: toDate(data.updatedAt),
        } as Testimonial & { id: string };
      });
    }
    const q = query(
      collection(db, COLLECTIONS.testimonials),
      where("userId", "==", uid)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        userId: data.userId as string,
        courseId: data.courseId as string,
        rating: (data.rating as number) ?? 5,
        quote: (data.quote as string) ?? "",
        displayName: data.displayName as string | undefined,
        status: (data.status as Testimonial["status"]) ?? "approved",
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
      } as Testimonial & { id: string };
    });
  } catch (err) {
    console.error("Error fetching testimonials by user:", err);
    return [];
  }
}

/** Create or update a testimonial for the given user and course. One per (userId, courseId). */
export async function createOrUpdateTestimonial(
  uid: string,
  courseId: string,
  payload: { rating: number; quote: string; displayName?: string }
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const registrations = await getRegistrationsByUserId(uid);
    const eligible = registrations.filter(
      (r) =>
        r.courseId === courseId &&
        (r.status === "confirmed" || r.status === "completed")
    );
    if (eligible.length === 0) {
      return {
        success: false,
        error: "You can only leave a testimonial for a course you are enrolled in (confirmed or completed).",
      };
    }

    const rating = Math.min(5, Math.max(1, Math.round(payload.rating)));
    const quote = (payload.quote ?? "").trim();
    if (!quote) {
      return { success: false, error: "Please enter a short testimonial." };
    }
    const displayName = (payload.displayName ?? "").trim() || undefined;

    const adminDb = getAdminDb();

    if (adminDb) {
      const { FieldValue } = await import("firebase-admin/firestore");
      const snapshot = await adminDb
        .collection(COLLECTIONS.testimonials)
        .where("userId", "==", uid)
        .where("courseId", "==", courseId)
        .get();
      const existing = snapshot.docs[0];
      const now = FieldValue.serverTimestamp();
      if (existing) {
        await existing.ref.update({
          rating,
          quote,
          ...(displayName !== undefined && { displayName }),
          updatedAt: now,
        });
        return { success: true };
      }
      await adminDb.collection(COLLECTIONS.testimonials).add({
        userId: uid,
        courseId,
        rating,
        quote,
        ...(displayName && { displayName }),
        status: "approved",
        createdAt: now,
        updatedAt: now,
      });
      return { success: true };
    }

    const q = query(
      collection(db, COLLECTIONS.testimonials),
      where("userId", "==", uid),
      where("courseId", "==", courseId)
    );
    const snapshot = await getDocs(q);
    const existing = snapshot.docs[0];
    const now = serverTimestamp();

    if (existing) {
      await updateDoc(existing.ref, {
        rating,
        quote,
        ...(displayName !== undefined && { displayName }),
        updatedAt: now,
      });
      return { success: true };
    }
    await addDoc(collection(db, COLLECTIONS.testimonials), {
      userId: uid,
      courseId,
      rating,
      quote,
      ...(displayName && { displayName }),
      status: "approved",
      createdAt: now,
      updatedAt: now,
    });
    return { success: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to save testimonial";
    return { success: false, error: message };
  }
}

/** Admin: set testimonial status (approved = show on home, pending = hide). */
export async function updateTestimonialStatus(
  id: string,
  status: Testimonial["status"]
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const adminDb = getAdminDb();
    if (adminDb) {
      const { FieldValue } = await import("firebase-admin/firestore");
      const ref = adminDb.collection(COLLECTIONS.testimonials).doc(id);
      await ref.update({ status, updatedAt: FieldValue.serverTimestamp() });
      return { success: true };
    }
    const ref = doc(db, COLLECTIONS.testimonials, id);
    await updateDoc(ref, { status, updatedAt: serverTimestamp() });
    return { success: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update testimonial status";
    return { success: false, error: message };
  }
}

/** Admin: delete a testimonial. */
export async function deleteTestimonial(
  id: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const adminDb = getAdminDb();
    if (adminDb) {
      await adminDb.collection(COLLECTIONS.testimonials).doc(id).delete();
      return { success: true };
    }
    await deleteDoc(doc(db, COLLECTIONS.testimonials, id));
    return { success: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to delete testimonial";
    return { success: false, error: message };
  }
}

const ADMIN_USER_ID = "admin";

/** Admin: add a testimonial for a non-enrolled person (e.g. previous courses). No student in DB required. */
export async function createTestimonialAsAdmin(payload: {
  courseId: string;
  displayName: string;
  rating: number;
  quote: string;
}): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const displayName = (payload.displayName ?? "").trim();
    if (!displayName) {
      return { success: false, error: "Display name is required." };
    }
    const quote = (payload.quote ?? "").trim();
    if (!quote) {
      return { success: false, error: "Testimonial text is required." };
    }
    const courseId = (payload.courseId ?? "").trim();
    if (!courseId) {
      return { success: false, error: "Course is required." };
    }
    const rating = Math.min(5, Math.max(1, Math.round(payload.rating ?? 5)));

    const adminDb = getAdminDb();
    if (adminDb) {
      const { FieldValue } = await import("firebase-admin/firestore");
      const now = FieldValue.serverTimestamp();
      await adminDb.collection(COLLECTIONS.testimonials).add({
        userId: ADMIN_USER_ID,
        courseId,
        rating,
        quote,
        displayName,
        status: "approved",
        createdAt: now,
        updatedAt: now,
      });
      return { success: true };
    }
    const now = serverTimestamp();
    await addDoc(collection(db, COLLECTIONS.testimonials), {
      userId: ADMIN_USER_ID,
      courseId,
      rating,
      quote,
      displayName,
      status: "approved",
      createdAt: now,
      updatedAt: now,
    });
    return { success: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to add testimonial";
    return { success: false, error: message };
  }
}
