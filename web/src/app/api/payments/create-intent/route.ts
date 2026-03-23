import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getAdminApp } from "@/lib/firebase/admin";
import { getAuth } from "firebase-admin/auth";
import { getRegistrationByIdForUser } from "@/lib/actions/registration";
import { getCourseById } from "@/lib/actions/course";
import { getBaseAmountCents } from "@/lib/pricing";
import { getAdminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/firestore";

function getStripe(): Stripe {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  return new Stripe(secret, { apiVersion: "2025-02-24.acacia" });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const registrationId = body.registrationId as string | undefined;
    const idToken =
      (request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") as string | undefined) ??
      (body.idToken as string | undefined);

    if (!registrationId) {
      return NextResponse.json(
        { success: false, error: "registrationId is required" },
        { status: 400 }
      );
    }

    if (!idToken) {
      return NextResponse.json(
        { success: false, error: "Authorization required. Send Bearer token or idToken in body." },
        { status: 401 }
      );
    }

    let uid: string;
    try {
      const adminApp = getAdminApp();
      const adminAuth = getAuth(adminApp);
      const decoded = await adminAuth.verifyIdToken(idToken);
      uid = decoded.uid;
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    const registration = await getRegistrationByIdForUser(registrationId, uid);
    if (!registration) {
      return NextResponse.json(
        { success: false, error: "Enrollment not found or you do not have access" },
        { status: 404 }
      );
    }

    if (registration.paymentStatus === "paid") {
      return NextResponse.json(
        { success: false, error: "This enrollment has already been paid" },
        { status: 400 }
      );
    }

    const course = await getCourseById(registration.courseId);
    const amountDueCents =
      registration.amountDueCents ??
      (course ? getBaseAmountCents(registration, course) : 0);
    if (amountDueCents <= 0) {
      return NextResponse.json(
        { success: false, error: "No amount due for this enrollment" },
        { status: 400 }
      );
    }

    const currency = (course?.pricing?.currency ?? "GBP").toLowerCase() as "gbp" | "eur" | "usd";

    const stripe = getStripe();

    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: amountDueCents,
        currency,
        automatic_payment_methods: { enabled: true },
        metadata: {
          registrationId,
          userId: uid,
          courseId: registration.courseId,
        },
      },
      { idempotencyKey: `reg-${registrationId}-${amountDueCents}` }
    );

    const adminDb = getAdminDb();
    if (adminDb) {
      const { FieldValue } = await import("firebase-admin/firestore");
      await adminDb.collection(COLLECTIONS.registrations).doc(registrationId).update({
        stripePaymentIntentId: paymentIntent.id,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create payment intent";
    console.error("[create-intent]", err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
