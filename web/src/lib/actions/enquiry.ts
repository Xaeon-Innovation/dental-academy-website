"use server";

import { randomUUID } from "crypto";
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
  where,
} from "firebase/firestore";
import { getAuth } from "firebase-admin/auth";
import { db, COLLECTIONS } from "@/lib/firebase/firestore";
import { getAdminApp, getAdminDb } from "@/lib/firebase/admin";
import {
  adminActivateEnquirySchema,
  enquirySubmitSchema,
  enquiryUpdateSchema,
  portalEmailPhoneLoginSchema,
} from "@/lib/validations/enquiry";
import type { Enquiry, EnquiryStatus } from "@/types/enquiry";
import { normalizeEmail, normalizePhone } from "@/lib/identity";
import { getCourseById } from "@/lib/actions/course";
import { getBaseAmountCents } from "@/lib/pricing";
import { isAdminEmail, getSettings } from "@/lib/actions/settings";

function toDate(val: unknown): Date | undefined {
  if (val && typeof (val as { toDate?: () => Date }).toDate === "function") {
    return (val as { toDate: () => Date }).toDate();
  }
  if (val instanceof Timestamp) {
    return val.toDate();
  }
  return undefined;
}

function normalizeEnquiry(id: string, data: Record<string, unknown>): Enquiry {
  const requiredString = (value: unknown) => (typeof value === "string" ? value : "");
  const optionalString = (value: unknown) => {
    const v = typeof value === "string" ? value.trim() : "";
    return v || undefined;
  };
  const status: EnquiryStatus =
    data.status === "new" ||
    data.status === "contacted" ||
    data.status === "qualified" ||
    data.status === "invited" ||
    data.status === "converted" ||
    data.status === "lost"
      ? data.status
      : "new";

  return {
    id,
    fullName: requiredString(data.fullName),
    email: requiredString(data.email),
    phone: requiredString(data.phone),
    status,
    normalizedEmail: optionalString(data.normalizedEmail),
    normalizedPhone: optionalString(data.normalizedPhone),
    countryCode: optionalString(data.countryCode),
    interestedCourseSlug: optionalString(data.interestedCourseSlug),
    interestedCourseId: optionalString(data.interestedCourseId),
    message: optionalString(data.message),
    assignedToAdminUid: optionalString(data.assignedToAdminUid),
    notes: optionalString(data.notes),
    linkedUserId: optionalString(data.linkedUserId),
    linkedRegistrationId: optionalString(data.linkedRegistrationId),
    utm: typeof data.utm === "object" && data.utm !== null ? (data.utm as Enquiry["utm"]) : undefined,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
    invitedAt: toDate(data.invitedAt),
    convertedAt: toDate(data.convertedAt),
  };
}

async function sendAdminNewEnquiryEmail(payload: {
  fullName: string;
  email: string;
  phone: string;
  interestedCourseSlug?: string;
  message?: string;
}) {
  const settings = await getSettings();
  const admins = (settings.adminEmails ?? [])
    .map((email) => normalizeEmail(email))
    .filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
  if (!admins.length) return;

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.NOTIFICATION_FROM_EMAIL || "onboarding@resend.dev";
  if (!apiKey) {
    console.warn("RESEND_API_KEY not set: skipping admin enquiry email notification");
    return;
  }
  const subject = `New course enquiry: ${payload.fullName}`;
  const html = `
    <h2>New enquiry submitted</h2>
    <p><strong>Name:</strong> ${payload.fullName}</p>
    <p><strong>Email:</strong> ${payload.email}</p>
    <p><strong>Phone:</strong> ${payload.phone}</p>
    <p><strong>Course interest:</strong> ${payload.interestedCourseSlug || "Not specified"}</p>
    <p><strong>Message:</strong></p>
    <p>${(payload.message || "—").replace(/\n/g, "<br/>")}</p>
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
        console.error(`Failed to send admin enquiry email to ${adminEmail}:`, response.status, body);
      }
    }
  } catch (err) {
    console.error("Failed to send admin enquiry email:", err);
  }
}

async function writeAuthAuditLog(input: {
  action: "login_success" | "login_failed";
  email: string;
  normalizedEmail: string;
  reason?: string;
  ip?: string;
}) {
  try {
    await addDoc(collection(db, COLLECTIONS.authAuditLogs), {
      ...input,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("writeAuthAuditLog error:", err);
  }
}

async function consumeLoginRateLimit(
  normalizedEmail: string,
  ip: string
): Promise<{ allowed: boolean; retryAfterSec?: number }> {
  const key = `${normalizedEmail}::${ip}`;
  const ref = doc(db, COLLECTIONS.loginRateLimits, key);
  const snap = await getDoc(ref);
  const now = Date.now();
  const maxAttempts = 8;
  const lockMs = 10 * 60 * 1000;
  const windowMs = 15 * 60 * 1000;

  if (!snap.exists()) {
    await updateDoc(ref, {}).catch(async () => {
      const { setDoc } = await import("firebase/firestore");
      await setDoc(ref, {
        key,
        attempts: 1,
        firstAttemptAtMs: now,
        lockedUntilMs: 0,
        updatedAt: serverTimestamp(),
      });
    });
    return { allowed: true };
  }
  const data = snap.data() as {
    attempts?: number;
    firstAttemptAtMs?: number;
    lockedUntilMs?: number;
  };
  const lockedUntilMs = data.lockedUntilMs ?? 0;
  if (lockedUntilMs > now) {
    return {
      allowed: false,
      retryAfterSec: Math.ceil((lockedUntilMs - now) / 1000),
    };
  }
  const firstAttemptAtMs = data.firstAttemptAtMs ?? now;
  const inWindow = now - firstAttemptAtMs <= windowMs;
  const attempts = inWindow ? (data.attempts ?? 0) + 1 : 1;
  const nextLocked = attempts >= maxAttempts ? now + lockMs : 0;
  await updateDoc(ref, {
    attempts,
    firstAttemptAtMs: inWindow ? firstAttemptAtMs : now,
    lockedUntilMs: nextLocked,
    updatedAt: serverTimestamp(),
  });
  if (nextLocked > now) {
    return { allowed: false, retryAfterSec: Math.ceil(lockMs / 1000) };
  }
  return { allowed: true };
}

export async function submitEnquiry(input: unknown): Promise<
  { success: true; id: string } | { success: false; error: string }
> {
  const parsed = enquirySubmitSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid enquiry data" };
  }
  const data = parsed.data;

  try {
    const payload = {
      fullName: data.fullName.trim(),
      email: data.email.trim(),
      normalizedEmail: normalizeEmail(data.email),
      phone: data.phone.trim(),
      normalizedPhone: normalizePhone(data.phone),
      status: "new" as EnquiryStatus,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      ...(data.countryCode?.trim() ? { countryCode: data.countryCode.trim() } : {}),
      ...(data.interestedCourseSlug?.trim()
        ? { interestedCourseSlug: data.interestedCourseSlug.trim() }
        : {}),
      ...(data.interestedCourseId?.trim()
        ? { interestedCourseId: data.interestedCourseId.trim() }
        : {}),
      ...(data.message?.trim() ? { message: data.message.trim() } : {}),
      ...(data.utm ? { utm: data.utm } : {}),
    };
    const ref = await addDoc(collection(db, COLLECTIONS.enquiries), payload);
    await sendAdminNewEnquiryEmail({
      fullName: payload.fullName,
      email: payload.email,
      phone: payload.phone,
      interestedCourseSlug: payload.interestedCourseSlug,
      message: payload.message,
    });
    return { success: true, id: ref.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to submit enquiry";
    return { success: false, error: message };
  }
}

export async function getAllEnquiries(): Promise<Enquiry[]> {
  try {
    const adminDb = getAdminDb();
    if (adminDb) {
      const snapshot = await adminDb
        .collection(COLLECTIONS.enquiries)
        .orderBy("createdAt", "desc")
        .get();
      return snapshot.docs.map((d) => normalizeEnquiry(d.id, d.data() as Record<string, unknown>));
    }
    const q = query(collection(db, COLLECTIONS.enquiries), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => normalizeEnquiry(d.id, d.data() as Record<string, unknown>));
  } catch (err) {
    console.error("getAllEnquiries error:", err);
    return [];
  }
}

export async function updateEnquiry(
  input: unknown
): Promise<{ success: true } | { success: false; error: string }> {
  const parsed = enquiryUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid enquiry update" };
  }
  const { id, ...rest } = parsed.data;
  try {
    const enquiryRef = doc(db, COLLECTIONS.enquiries, id);
    const currentSnap = await getDoc(enquiryRef);
    if (!currentSnap.exists()) {
      return { success: false, error: "Enquiry not found." };
    }
    const current = normalizeEnquiry(
      currentSnap.id,
      currentSnap.data() as Record<string, unknown>
    );
    if (current.status === "converted") {
      return {
        success: false,
        error: "Converted enquiries are locked after successful payment.",
      };
    }

    await updateDoc(doc(db, COLLECTIONS.enquiries, id), {
      ...rest,
      updatedAt: serverTimestamp(),
    });
    revalidatePath("/admin/enquiries");
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update enquiry";
    return { success: false, error: message };
  }
}

async function ensureStudentUserFromEnquiry(enquiry: Enquiry) {
  const adminApp = getAdminApp();
  const adminAuth = getAuth(adminApp);
  const email = normalizeEmail(enquiry.email);
  let userRecord;
  try {
    userRecord = await adminAuth.getUserByEmail(email);
  } catch {
    userRecord = await adminAuth.createUser({
      email,
      displayName: enquiry.fullName,
      disabled: false,
    });
  }

  const uid = userRecord.uid;
  await updateDoc(doc(db, COLLECTIONS.students, uid), {}).catch(async () => {
    const { setDoc } = await import("firebase/firestore");
    await setDoc(doc(db, COLLECTIONS.students, uid), {
      uid,
      email,
      phone: enquiry.phone,
      normalizedEmail: email,
      normalizedPhone: normalizePhone(enquiry.phone),
      displayName: enquiry.fullName,
      loginEnabled: true,
      approvedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
  await updateDoc(doc(db, COLLECTIONS.students, uid), {
    email,
    phone: enquiry.phone,
    normalizedEmail: email,
    normalizedPhone: normalizePhone(enquiry.phone),
    displayName: enquiry.fullName,
    loginEnabled: true,
    approvedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return uid;
}

export async function activateEnquiryAndEnroll(input: unknown): Promise<
  { success: true; registrationId: string; userId: string } | { success: false; error: string }
> {
  const parsed = adminActivateEnquirySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid activation input" };
  }
  const { enquiryId, courseId, adminIdToken } = parsed.data;
  try {
    const adminApp = getAdminApp();
    const adminAuth = getAuth(adminApp);
    const decoded = await adminAuth.verifyIdToken(adminIdToken);
    const adminUid = decoded.uid;
    const adminEmail = decoded.email;
    if (!(await isAdminEmail(adminEmail))) {
      return { success: false, error: "Only admins can approve enquiries." };
    }

    const enquirySnap = await getDoc(doc(db, COLLECTIONS.enquiries, enquiryId));
    if (!enquirySnap.exists()) return { success: false, error: "Enquiry not found." };
    const enquiry = normalizeEnquiry(enquirySnap.id, enquirySnap.data() as Record<string, unknown>);
    const course = await getCourseById(courseId);
    if (!course) return { success: false, error: "Course not found." };

    const userId = await ensureStudentUserFromEnquiry(enquiry);
    const baseCents = getBaseAmountCents(
      { createdAt: new Date(), singleOccupancyUpgrade: false },
      course
    );
    const payload = {
      userId,
      courseId: course.id,
      courseSlug: course.slug,
      name: enquiry.fullName,
      email: normalizeEmail(enquiry.email),
      phone: enquiry.phone,
      status: "pending_confirmation",
      origin: "enquiry_conversion",
      enquiryId: enquiry.id,
      createdByAdminUid: adminUid,
      country: "—",
      currentRole: "From enquiry",
      hasPlacedImplants: false,
      hasRestoredCases: false,
      aspectsToDevelop: [],
      contactByWhatsApp: false,
      consentContact: true,
      amountDueCents: baseCents,
      paymentStatus: baseCents > 0 ? "unpaid" : undefined,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const regRef = await addDoc(collection(db, COLLECTIONS.registrations), payload);
    await updateDoc(doc(db, COLLECTIONS.enquiries, enquiry.id), {
      status: "invited",
      linkedUserId: userId,
      linkedRegistrationId: regRef.id,
      assignedToAdminUid: adminUid,
      invitedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    revalidatePath("/admin/enquiries");
    revalidatePath("/admin/registrations");
    return { success: true, registrationId: regRef.id, userId };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to activate enquiry";
    return { success: false, error: message };
  }
}

export async function authenticateWithEmailPhone(input: unknown): Promise<
  | { success: true; customToken: string }
  | { success: false; error: string; retryAfterSec?: number }
> {
  const parsed = portalEmailPhoneLoginSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Please enter valid credentials." };
  }
  const email = normalizeEmail(parsed.data.email);
  const phone = normalizePhone(parsed.data.phone);
  const ip = "unknown";
  try {
    const limiter = await consumeLoginRateLimit(email, ip);
    if (!limiter.allowed) {
      return {
        success: false,
        error: "Too many attempts. Please try again later.",
        retryAfterSec: limiter.retryAfterSec,
      };
    }
    const q = query(
      collection(db, COLLECTIONS.students),
      where("normalizedEmail", "==", email)
    );
    const snap = await getDocs(q);
    if (snap.empty) {
      await writeAuthAuditLog({
        action: "login_failed",
        email: parsed.data.email,
        normalizedEmail: email,
        reason: "email_not_found",
        ip,
      });
      return { success: false, error: "Invalid email or phone." };
    }
    const student = snap.docs[0].data() as {
      uid: string;
      normalizedPhone?: string;
      loginEnabled?: boolean;
    };
    if (!student.loginEnabled) {
      await writeAuthAuditLog({
        action: "login_failed",
        email: parsed.data.email,
        normalizedEmail: email,
        reason: "not_approved",
        ip,
      });
      return { success: false, error: "Your access is not approved yet." };
    }
    if ((student.normalizedPhone ?? "") !== phone) {
      await writeAuthAuditLog({
        action: "login_failed",
        email: parsed.data.email,
        normalizedEmail: email,
        reason: "phone_mismatch",
        ip,
      });
      return { success: false, error: "Invalid email or phone." };
    }
    const adminApp = getAdminApp();
    const adminAuth = getAuth(adminApp);
    const customToken = await adminAuth.createCustomToken(student.uid, {
      method: "email_phone",
    });
    await writeAuthAuditLog({
      action: "login_success",
      email: parsed.data.email,
      normalizedEmail: email,
      ip,
    });
    return { success: true, customToken };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Login failed";
    return { success: false, error: message };
  }
}
