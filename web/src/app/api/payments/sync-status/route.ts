import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getAdminApp } from "@/lib/firebase/admin";
import { getAuth } from "firebase-admin/auth";
import { getRegistrationByIdForUser } from "@/lib/actions/registration";
import { getAdminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/firestore";

function getStripe(): Stripe {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  return new Stripe(secret, { apiVersion: "2025-02-24.acacia" });
}

/**
 * After a successful payment, Stripe may redirect before the webhook updates Firestore.
 * This route re-checks the PaymentIntent with Stripe and applies the same DB updates as the webhook.
 */
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
        { success: false, error: "Authorization required" },
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
        { success: false, error: "Enrollment not found" },
        { status: 404 }
      );
    }

    const piId = registration.stripePaymentIntentId;
    if (!piId) {
      return NextResponse.json(
        { success: false, error: "No payment session for this enrollment" },
        { status: 400 }
      );
    }

    const stripe = getStripe();
    const paymentIntent = await stripe.paymentIntents.retrieve(piId);

    const metaRegId = paymentIntent.metadata?.registrationId;
    if (metaRegId != null && metaRegId !== "" && metaRegId !== registrationId) {
      return NextResponse.json(
        { success: false, error: "Payment does not match this enrollment" },
        { status: 400 }
      );
    }

    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json(
        { success: false, error: "Server cannot update enrollment" },
        { status: 503 }
      );
    }

    const { FieldValue } = await import("firebase-admin/firestore");

    if (paymentIntent.status === "succeeded") {
      await adminDb.collection(COLLECTIONS.registrations).doc(registrationId).update({
        paymentStatus: "paid",
        status: "confirmed",
        paidAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      return NextResponse.json({ success: true, status: "succeeded" });
    }

    if (paymentIntent.status === "processing" || paymentIntent.status === "requires_action") {
      return NextResponse.json({
        success: true,
        status: paymentIntent.status,
        message: "Payment still processing; refresh in a moment.",
      });
    }

    if (paymentIntent.last_payment_error) {
      await adminDb.collection(COLLECTIONS.registrations).doc(registrationId).update({
        paymentStatus: "failed",
        updatedAt: FieldValue.serverTimestamp(),
      });
      return NextResponse.json({
        success: true,
        status: "failed",
        message: paymentIntent.last_payment_error.message ?? "Payment failed",
      });
    }

    return NextResponse.json({
      success: true,
      status: paymentIntent.status,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sync failed";
    console.error("[sync-status]", err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
