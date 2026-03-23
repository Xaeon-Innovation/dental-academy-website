"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getStudentProfile, getRegistrationsByUserId, createOrUpdateStudentProfile } from "@/lib/actions/student";
import { getCourses } from "@/lib/actions/course";
import { computeRegistrationTotal, formatPrice, getBaseAmountCents, getRegistrationTotalBreakdown } from "@/lib/pricing";
import { submitSpecialRequest } from "@/lib/actions/registration";
import type { StudentProfile } from "@/types/student";
import type { Registration } from "@/types/registration";
import type { Course } from "@/types/course";
import StudentDashboardGuard from "./StudentDashboardGuard";
import DashboardProfileForm from "./DashboardProfileForm";
import LoadingScreen from "@/components/LoadingScreen";
import StripePaymentForm from "@/components/portal/StripePaymentForm";

function formatSlug(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatAmountDue(amountDueCents: number | undefined): string {
  if (amountDueCents == null || amountDueCents === 0) return "On request";
  return formatPrice((amountDueCents ?? 0) / 100);
}

export default function PortalDashboardPage() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [registrations, setRegistrations] = useState<(Registration & { id: string })[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentRegistrationId, setPaymentRegistrationId] = useState<string | null>(null);
  const [specialRequestRegId, setSpecialRequestRegId] = useState<string | null>(null);
  const [specialRequestText, setSpecialRequestText] = useState("");
  const [specialRequestSubmitting, setSpecialRequestSubmitting] = useState(false);
  const [specialRequestError, setSpecialRequestError] = useState<string | null>(null);

  const refetchRegistrations = useCallback(() => {
    if (!user) return;
    getRegistrationsByUserId(user.uid).then(setRegistrations);
  }, [user]);

  /** Stripe webhooks can lag or be misconfigured; sync PaymentIntent → Firestore after pay. */
  const syncPaymentStatus = useCallback(
    async (registrationId: string) => {
      if (!user) return;
      const token = await user.getIdToken();
      for (let attempt = 0; attempt < 6; attempt++) {
        try {
          const res = await fetch("/api/payments/sync-status", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ registrationId }),
          });
          const data = (await res.json()) as {
            success?: boolean;
            status?: string;
          };
          if (data.success && data.status === "succeeded") break;
          if (data.success && data.status === "failed") break;
        } catch {
          /* retry */
        }
        await new Promise((r) => setTimeout(r, 1000));
      }
      refetchRegistrations();
    },
    [user, refetchRegistrations]
  );

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getStudentProfile(user.uid),
      getRegistrationsByUserId(user.uid),
      getCourses(),
    ]).then(([p, regs, coursesData]) => {
      setProfile(p ?? null);
      setRegistrations(regs);
      setCourses(coursesData);
      setLoading(false);
    });
  }, [user]);

  // After Stripe redirect (?paid=), sync PI status to Firestore (webhook may not have run yet)
  useEffect(() => {
    if (typeof window === "undefined" || !user) return;
    const params = new URLSearchParams(window.location.search);
    const paidId = params.get("paid");
    if (!paidId) return;
    void (async () => {
      await syncPaymentStatus(paidId);
      window.history.replaceState({}, "", "/portal/dashboard");
    })();
  }, [user, syncPaymentStatus]);

  /** If webhook never ran, a succeeded PI can leave Firestore stuck as unpaid — sync once per such enrollment. */
  const lastPendingPiSyncKey = useRef("");
  const pendingPiSyncKey =
    !loading && user
      ? registrations
          .filter(
            (r) =>
              Boolean(r.stripePaymentIntentId) &&
              r.paymentStatus !== "paid" &&
              r.paymentStatus !== "failed" &&
              r.paymentStatus !== "refunded"
          )
          .map((r) => r.id)
          .sort()
          .join(",")
      : "";

  useEffect(() => {
    if (!pendingPiSyncKey || pendingPiSyncKey === lastPendingPiSyncKey.current) return;
    lastPendingPiSyncKey.current = pendingPiSyncKey;
    const ids = pendingPiSyncKey.split(",").filter(Boolean);
    void (async () => {
      for (const id of ids) {
        await syncPaymentStatus(id);
      }
    })();
  }, [pendingPiSyncKey, syncPaymentStatus]);

  const courseById = new Map(courses.map((c) => [c.id, c]));

  const handleProfileSave = async (data: { phone: string; displayName?: string }) => {
    if (!user) return { success: false as const, error: "Not signed in" };
    const result = await createOrUpdateStudentProfile(user.uid, data);
    if (result.success) {
      setProfile((prev) => (prev ? { ...prev, ...data } : null));
    }
    return result;
  };

  return (
    <StudentDashboardGuard>
      <div className="min-h-screen bg-background px-4 py-16 text-white md:py-20">
        <div className="mx-auto max-w-3xl">
          <header className="mb-10">
            <h1 className="font-[var(--font-playfair)] text-3xl tracking-tight md:text-4xl">
              Delegate dashboard
            </h1>
            <p className="mt-2 text-sm text-white/70">
              Your enrolled courses and account profile.
            </p>
            <div className="mt-4 flex flex-col gap-3">
              <Link
                href="/"
                className="inline-block text-xs font-semibold uppercase tracking-[0.18em] text-white/60 transition hover:text-accentGold/80"
              >
                ← Home
              </Link>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/portal/dashboard/testimonials"
                  className="w-fit rounded-full border border-accentGold px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-accentGold transition hover:bg-accentGold/10"
                >
                  Testimonials
                </Link>
                <Link
                  href="/courses"
                  className="w-fit rounded-full border border-accentGold px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-accentGold transition hover:bg-accentGold/10"
                >
                  View courses
                </Link>
                <button
                  type="button"
                  onClick={signOut}
                  className="flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/80 transition hover:border-accentGold/30 hover:bg-accentGold/10 hover:text-accentGold"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign out
                </button>
              </div>
            </div>
          </header>

          {loading ? (
            <LoadingScreen />
          ) : (
            <div className="space-y-10">
              <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-accentGold">
                  Enrolled courses
                </h2>
                {registrations.length > 0 && (
                  <p className="mt-2 text-xs text-white/60">
                    Please wait for confirmation from the admin. You will be contacted once your enrollment is confirmed.
                  </p>
                )}
                {registrations.length === 0 ? (
                  <p className="mt-4 text-sm text-white/60">
                    You have not enrolled in any courses yet.{" "}
                    <Link href="/courses" className="text-accentGold hover:underline">
                      Browse courses
                    </Link>
                  </p>
                ) : (
                  <ul className="mt-4 space-y-3">
                    {registrations.map((reg) => {
                      const course = courseById.get(reg.courseId);
                      const totalResult = computeRegistrationTotal(reg, course);
                      const effectiveAmountCents = reg.amountDueCents ?? (course ? getBaseAmountCents(reg, course) : 0);
                      const totalDisplay = reg.amountDueCents != null ? formatAmountDue(reg.amountDueCents) : (totalResult?.formattedTotal ?? (course ? "On request" : "—"));
                      const breakdown = getRegistrationTotalBreakdown(reg, course ?? undefined);
                      const sr = reg.specialRequest;
                      const canPay =
                        effectiveAmountCents > 0 &&
                        reg.paymentStatus !== "paid" &&
                        sr?.status !== "pending";
                      const showSpecialRequestForm = !sr || sr.status === "declined";
                      const isSpecialRequestOpen = specialRequestRegId === reg.id;
                      return (
                        <li
                          key={reg.id}
                          className="flex flex-col gap-2 rounded-lg border border-white/5 bg-black/20 px-4 py-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                            <div>
                              <span className="font-medium text-white">
                                {reg.courseSlug ? formatSlug(reg.courseSlug) : reg.courseId}
                              </span>
                              <span className="ml-2 text-xs text-white/50">
                                ({reg.status === "confirmed" && reg.paymentStatus !== "paid" ? "Pending payment" : reg.status})
                              </span>
                              <span className="ml-2 text-xs text-white/60">
                                Total: {totalDisplay}
                              </span>
                              {reg.paymentStatus === "paid" && (
                                <span className="ml-2 text-xs text-green-400">Paid</span>
                              )}
                              {reg.paymentStatus === "failed" && (
                                <span className="ml-2 text-xs text-red-400">Payment failed</span>
                              )}
                              {sr?.status === "pending" && (
                                <span className="ml-2 text-xs text-amber-400">Special request pending</span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                              {reg.courseSlug && (
                                <Link
                                  href={`/courses/${reg.courseSlug}`}
                                  className="text-xs font-semibold uppercase tracking-wider text-accentGold hover:underline"
                                >
                                  View course
                                </Link>
                              )}
                            </div>
                          </div>
                          {breakdown && (
                            <div className="rounded border border-white/5 bg-black/10 px-3 py-2 text-xs text-white/80">
                              {breakdown.earlyBird ? (
                                <p>Early bird = {breakdown.earlyBird}</p>
                              ) : null}
                              {breakdown.standard ? (
                                <p>Standard = {breakdown.standard}</p>
                              ) : null}
                              {breakdown.singleOccupancy ? (
                                <p>Single occupancy = {breakdown.singleOccupancy}</p>
                              ) : null}
                              {breakdown.specialRequest ? (
                                <p>Special request = {breakdown.specialRequest}</p>
                              ) : null}
                              <p className="mt-1 font-medium text-white">Total = {breakdown.total}</p>
                            </div>
                          )}
                          {showSpecialRequestForm && reg.status !== "cancelled" && (
                            <div className="mt-2 border-t border-white/5 pt-2">
                              {!isSpecialRequestOpen ? (
                                <button
                                  type="button"
                                  onClick={() => setSpecialRequestRegId(reg.id)}
                                  className="text-xs font-semibold uppercase tracking-wider text-accentGold hover:underline"
                                >
                                  Add special request
                                </button>
                              ) : (
                                <div>
                                  <textarea
                                    value={specialRequestText}
                                    onChange={(e) => setSpecialRequestText(e.target.value)}
                                    placeholder="Describe your request (e.g. dietary, accessibility). Admin will set any extra fees."
                                    className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/50"
                                    rows={2}
                                  />
                                  <div className="mt-2 flex items-center gap-2">
                                    <button
                                      type="button"
                                      disabled={specialRequestSubmitting}
                                      onClick={async () => {
                                        if (!user) return;
                                        setSpecialRequestError(null);
                                        setSpecialRequestSubmitting(true);
                                        const result = await submitSpecialRequest(reg.id, specialRequestText, user.uid);
                                        setSpecialRequestSubmitting(false);
                                        if (result.success) {
                                          setSpecialRequestRegId(null);
                                          setSpecialRequestText("");
                                          refetchRegistrations();
                                        } else {
                                          setSpecialRequestError(result.error ?? "Failed to submit");
                                        }
                                      }}
                                      className="rounded-lg bg-accentGold px-3 py-1.5 text-xs font-semibold text-background hover:bg-accentGold/90 disabled:opacity-50"
                                    >
                                      {specialRequestSubmitting ? "Submitting…" : "Submit request"}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSpecialRequestRegId(null);
                                        setSpecialRequestText("");
                                        setSpecialRequestError(null);
                                      }}
                                      className="text-xs text-white/70 hover:text-white"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                  {specialRequestError && (
                                    <p className="mt-1 text-xs text-red-400">{specialRequestError}</p>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                          {sr && sr.status !== "pending" && sr.description && (
                            <p className="text-xs text-white/60">
                              Special request: {sr.description}
                              {sr.status === "priced" && " (extra fees set — see total above)"}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                            {sr?.status === "pending" && (
                              <span className="text-xs text-white/50">
                                Confirm and pay available after admin sets your request total
                              </span>
                            )}
                            {canPay && (
                              <button
                                type="button"
                                onClick={() => setPaymentRegistrationId(reg.id)}
                                className="w-fit rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-green-400 transition hover:border-green-400/50 hover:bg-green-500/10 hover:text-green-300"
                              >
                                Confirm and pay
                              </button>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>

              <section
                id="delegate-profile"
                className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 scroll-mt-24"
              >
                <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-accentGold">
                  Profile
                </h2>
                <DashboardProfileForm
                  profile={profile}
                  email={user?.email ?? ""}
                  onSave={handleProfileSave}
                />
              </section>
            </div>
          )}

          {paymentRegistrationId && user && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setPaymentRegistrationId(null)}>
              <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md">
                <StripePaymentForm
                  registrationId={paymentRegistrationId}
                  getToken={async () => (await user.getIdToken()) ?? ""}
                  onSuccess={async () => {
                    const id = paymentRegistrationId;
                    setPaymentRegistrationId(null);
                    if (id) await syncPaymentStatus(id);
                  }}
                  onClose={() => setPaymentRegistrationId(null)}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </StudentDashboardGuard>
  );
}
