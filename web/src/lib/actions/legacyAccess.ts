"use server";

import { revalidatePath } from "next/cache";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { getAuth } from "firebase-admin/auth";
import { db, COLLECTIONS } from "@/lib/firebase/firestore";
import { getAdminApp, getAdminDb } from "@/lib/firebase/admin";
import { isAdminEmail, getSettings } from "@/lib/actions/settings";
import { normalizeEmail, normalizePhone } from "@/lib/identity";
import {
  legacyAccessRequestSchema,
  legacyAccessDecisionSchema,
  legacyAccessUpdateSchema,
} from "@/lib/validations/legacyAccess";
import type { LegacyAccessRequest, LegacyAccessRequestStatus } from "@/types/legacyAccess";
import { createOrUpdateStudentProfile } from "@/lib/actions/student";

function toDate(val: unknown): Date | undefined {
  if (val && typeof (val as { toDate?: () => Date }).toDate === "function") {
    return (val as { toDate: () => Date }).toDate();
  }
  if (val instanceof Timestamp) {
    return val.toDate();
  }
  return undefined;
}

function normalizeLegacyRequest(id: string, data: Record<string, unknown>): LegacyAccessRequest {
  const requiredString = (value: unknown) => (typeof value === "string" ? value : "");
  const optionalString = (value: unknown) => {
    const v = typeof value === "string" ? value.trim() : "";
    return v || undefined;
  };
  const status: LegacyAccessRequestStatus =
    data.status === "new" || data.status === "approved" || data.status === "rejected"
      ? data.status
      : "new";
  const requestedCourseIds = Array.isArray(data.requestedCourseIds)
    ? (data.requestedCourseIds.filter((x) => typeof x === "string" && x.trim()) as string[])
    : [];

  return {
    id,
    fullName: requiredString(data.fullName),
    email: requiredString(data.email),
    phone: requiredString(data.phone),
    normalizedEmail: optionalString(data.normalizedEmail),
    normalizedPhone: optionalString(data.normalizedPhone),
    requestedCourseIds,
    status,
    notes: optionalString(data.notes),
    approvedAt: toDate(data.approvedAt),
    approvedByAdminUid: optionalString(data.approvedByAdminUid),
    rejectedAt: toDate(data.rejectedAt),
    rejectedByAdminUid: optionalString(data.rejectedByAdminUid),
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

async function sendAdminLegacyAccessEmail(payload: {
  fullName: string;
  email: string;
  phone: string;
  requestedCourseLabels: string[];
}) {
  const settings = await getSettings();
  const admins = (settings.adminEmails ?? [])
    .map((email) => normalizeEmail(email))
    .filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
  if (!admins.length) return;

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.NOTIFICATION_FROM_EMAIL || "onboarding@resend.dev";
  if (!apiKey) {
    console.warn("RESEND_API_KEY not set: skipping admin legacy access notification");
    return;
  }

  const subject = `Legacy delegate access request: ${payload.fullName}`;
  const html = `
    <h2>Legacy delegate access request</h2>
    <p><strong>Name:</strong> ${payload.fullName}</p>
    <p><strong>Email:</strong> ${payload.email}</p>
    <p><strong>Phone:</strong> ${payload.phone}</p>
    <p><strong>Courses:</strong> ${payload.requestedCourseLabels.join(", ") || "—"}</p>
    <p>Review in the admin dashboard.</p>
  `;

  try {
    for (const adminEmail of admins) {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [adminEmail],
          subject,
          html,
        }),
      });
      if (!response.ok) {
        const body = await response.text();
        console.error(`Failed to send legacy access email to ${adminEmail}:`, response.status, body);
      }
    }
  } catch (err) {
    console.error("Failed to send legacy access email:", err);
  }
}

export async function submitLegacyAccessRequest(input: unknown): Promise<
  { success: true; id: string } | { success: false; error: string }
> {
  const parsed = legacyAccessRequestSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid request",
    };
  }
  const data = parsed.data;

  try {
    const payload = {
      fullName: data.fullName.trim(),
      email: data.email.trim(),
      normalizedEmail: normalizeEmail(data.email),
      phone: data.phone.trim(),
      normalizedPhone: normalizePhone(data.phone),
      requestedCourseIds: data.requestedCourseIds,
      status: "new" as const,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const ref = await addDoc(collection(db, COLLECTIONS.legacyAccessRequests), payload);

    // Best-effort email notification (do not fail request if email fails).
    await sendAdminLegacyAccessEmail({
      fullName: payload.fullName,
      email: payload.email,
      phone: payload.phone,
      requestedCourseLabels: payload.requestedCourseIds,
    });

    return { success: true, id: ref.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to submit request";
    return { success: false, error: message };
  }
}

export async function getAllLegacyAccessRequests(): Promise<LegacyAccessRequest[]> {
  try {
    const adminDb = getAdminDb();
    if (adminDb) {
      const snapshot = await adminDb
        .collection(COLLECTIONS.legacyAccessRequests)
        .orderBy("createdAt", "desc")
        .get();
      return snapshot.docs.map((d) =>
        normalizeLegacyRequest(d.id, d.data() as Record<string, unknown>)
      );
    }
    const q = query(
      collection(db, COLLECTIONS.legacyAccessRequests),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) =>
      normalizeLegacyRequest(d.id, d.data() as Record<string, unknown>)
    );
  } catch (err) {
    console.error("getAllLegacyAccessRequests error:", err);
    return [];
  }
}

export async function updateLegacyAccessRequestAsAdmin(input: unknown): Promise<
  { success: true } | { success: false; error: string }
> {
  const parsed = legacyAccessUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid update." };
  }
  const { id, status, notes, adminIdToken } = parsed.data;

  try {
    const adminApp = getAdminApp();
    const adminAuth = getAuth(adminApp);
    const decoded = await adminAuth.verifyIdToken(adminIdToken);
    if (!(await isAdminEmail(decoded.email))) {
      return { success: false, error: "Only admins can update requests." };
    }

    const ref = doc(db, COLLECTIONS.legacyAccessRequests, id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return { success: false, error: "Request not found." };

    const patch: Record<string, unknown> = {
      status,
      updatedAt: serverTimestamp(),
      ...(notes?.trim() ? { notes: notes.trim() } : {}),
    };
    if (status === "approved") {
      patch.approvedAt = serverTimestamp();
      patch.approvedByAdminUid = decoded.uid;
    }
    if (status === "rejected") {
      patch.rejectedAt = serverTimestamp();
      patch.rejectedByAdminUid = decoded.uid;
    }
    await updateDoc(ref, patch);
    revalidatePath("/admin/legacy-access");
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update request";
    return { success: false, error: message };
  }
}

async function ensureStudentUserFromLegacyRequest(req: LegacyAccessRequest) {
  const adminApp = getAdminApp();
  const adminAuth = getAuth(adminApp);
  const email = normalizeEmail(req.email);
  let userRecord;
  try {
    userRecord = await adminAuth.getUserByEmail(email);
  } catch {
    userRecord = await adminAuth.createUser({
      email,
      displayName: req.fullName,
      disabled: false,
    });
  }
  return userRecord.uid;
}

export async function decideLegacyAccessRequestAsAdmin(input: unknown): Promise<
  { success: true } | { success: false; error: string }
> {
  const parsed = legacyAccessDecisionSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid request." };
  }
  const { id, decision, notes, adminIdToken } = parsed.data;

  try {
    const adminApp = getAdminApp();
    const adminAuth = getAuth(adminApp);
    const decoded = await adminAuth.verifyIdToken(adminIdToken);
    if (!(await isAdminEmail(decoded.email))) {
      return { success: false, error: "Only admins can approve legacy access." };
    }

    const ref = doc(db, COLLECTIONS.legacyAccessRequests, id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return { success: false, error: "Request not found." };
    const req = normalizeLegacyRequest(snap.id, snap.data() as Record<string, unknown>);

    const patch: Record<string, unknown> = {
      status: decision === "approve" ? "approved" : "rejected",
      updatedAt: serverTimestamp(),
      ...(notes?.trim() ? { notes: notes.trim() } : {}),
    };

    if (decision === "approve") {
      patch.approvedAt = serverTimestamp();
      patch.approvedByAdminUid = decoded.uid;

      const uid = await ensureStudentUserFromLegacyRequest(req);
      const profileRes = await createOrUpdateStudentProfile(uid, {
        uid,
        email: normalizeEmail(req.email),
        phone: req.phone,
        displayName: req.fullName,
        loginEnabled: true,
        legacyDelegate: true,
        legacyCourses: req.requestedCourseIds,
        legacyApprovedByAdminUid: decoded.uid,
        legacyApprovedAt: new Date(),
      });
      if (!profileRes.success) {
        return { success: false, error: profileRes.error };
      }
    } else {
      patch.rejectedAt = serverTimestamp();
      patch.rejectedByAdminUid = decoded.uid;
    }

    await updateDoc(ref, patch);
    revalidatePath("/admin/legacy-access");
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update request";
    return { success: false, error: message };
  }
}

