import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
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
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[stripe-webhook] STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  let event: Stripe.Event;
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");
    if (!signature) {
      return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
    }
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[stripe-webhook] Signature verification failed:", message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const registrationId = paymentIntent.metadata?.registrationId;
    if (!registrationId) {
      console.warn("[stripe-webhook] payment_intent.succeeded missing metadata.registrationId");
      return NextResponse.json({ received: true });
    }
    const adminDb = getAdminDb();
    if (!adminDb) {
      console.error("[stripe-webhook] Firebase Admin DB not configured; cannot update payment status");
      return NextResponse.json({ received: true });
    }
    const { FieldValue } = await import("firebase-admin/firestore");
    await adminDb.collection(COLLECTIONS.registrations).doc(registrationId).update({
      paymentStatus: "paid",
      status: "confirmed",
      paidAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ received: true });
  }

  if (event.type === "payment_intent.payment_failed") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const registrationId = paymentIntent.metadata?.registrationId;
    if (!registrationId) {
      console.warn("[stripe-webhook] payment_intent.payment_failed missing metadata.registrationId");
      return NextResponse.json({ received: true });
    }
    const adminDbFailed = getAdminDb();
    if (adminDbFailed) {
      const { FieldValue } = await import("firebase-admin/firestore");
      await adminDbFailed.collection(COLLECTIONS.registrations).doc(registrationId).update({
        paymentStatus: "failed",
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
    return NextResponse.json({ received: true });
  }

  return NextResponse.json({ received: true });
}
