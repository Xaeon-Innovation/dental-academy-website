"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, LayoutDashboard, UserPlus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getRegistrationsByUserId, getStudentProfile } from "@/lib/actions/student";
import { submitMinimalEnrollment } from "@/lib/actions/registration";
import {
  readMinimalEnrollmentDraft,
  writeMinimalEnrollmentDraft,
  clearMinimalEnrollmentDraft,
} from "@/lib/course-enrollment-draft";

const inputClass =
  "w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-accentGold/50 focus:outline-none";

const PORTAL_FINISH_SIGNUP =
  "/portal?redirect=" +
  encodeURIComponent("/portal/dashboard") +
  "&finalizeEnroll=1";

interface SecureYourSpotCTAProps {
  courseSlug: string;
  courseId: string;
}

export function SecureYourSpotCTA({ courseSlug, courseId }: SecureYourSpotCTAProps) {
  const router = useRouter();
  const { user, loading, isAdmin } = useAuth();
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<string[]>([]);
  const [enrollmentCheckDone, setEnrollmentCheckDone] = useState(false);

  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileReady, setProfileReady] = useState(false);

  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestNote, setGuestNote] = useState("");
  const [guestConsent, setGuestConsent] = useState(false);
  const [guestTerms, setGuestTerms] = useState(false);

  const [loggedNote, setLoggedNote] = useState("");
  const [loggedName, setLoggedName] = useState("");
  const [loggedPhone, setLoggedPhone] = useState("");

  const [loggedConsent, setLoggedConsent] = useState(false);
  const [loggedTerms, setLoggedTerms] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!user?.uid) {
      setEnrolledCourseIds([]);
      setEnrollmentCheckDone(true);
      setProfileReady(true);
      setProfileName("");
      setProfilePhone("");
      return;
    }
    let cancelled = false;
    getRegistrationsByUserId(user.uid).then((regs) => {
      if (cancelled) return;
      const ids = regs.filter((r) => r.status !== "cancelled").map((r) => r.courseId);
      setEnrolledCourseIds(ids);
      setEnrollmentCheckDone(true);
    });
    getStudentProfile(user.uid).then((profile) => {
      if (cancelled) return;
      const name = profile?.displayName?.trim() || user.displayName?.trim() || "";
      const phone = profile?.phone?.trim() || "";
      setProfileName(name);
      setProfilePhone(phone);

      const draft = readMinimalEnrollmentDraft();
      const draftMatches = draft?.courseSlug === courseSlug;

      if (draftMatches && draft.finalizeOnPortal) {
        clearMinimalEnrollmentDraft();
      }

      if (draftMatches && draft.enrollmentNote?.trim() && !draft.finalizeOnPortal) {
        setLoggedNote((prev) => (prev.trim() ? prev : draft.enrollmentNote!.trim()));
      }

      let useName = name;
      let usePhone = phone;
      if (draftMatches && !draft.finalizeOnPortal && draft.name?.trim() && !name) {
        useName = draft.name.trim();
      }
      if (draftMatches && !draft.finalizeOnPortal && draft.phone?.trim() && !phone) {
        usePhone = draft.phone.trim();
      }
      setLoggedName(useName);
      setLoggedPhone(usePhone);

      setProfileReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [user?.uid, courseSlug]);

  const isEnrolled = enrollmentCheckDone && user && enrolledCourseIds.includes(courseId);

  const submitWithToken = useCallback(
    async (body: {
      name: string;
      phone: string;
      enrollmentNote?: string;
      consentContact: boolean;
      acceptedTerms: boolean;
    }) => {
      if (!user) return;
      setError(null);
      setSubmitting(true);
      try {
        const idToken = await user.getIdToken();
        const result = await submitMinimalEnrollment({
          courseId,
          courseSlug,
          name: body.name,
          phone: body.phone,
          enrollmentNote: body.enrollmentNote,
          consentContact: body.consentContact,
          acceptedTerms: body.acceptedTerms,
          idToken,
        });
        if (result.success) {
          clearMinimalEnrollmentDraft();
          setSuccess(true);
        } else {
          setError(result.error);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      } finally {
        setSubmitting(false);
      }
    },
    [user, courseId, courseSlug]
  );

  const handleFinishSignupEnroll = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!guestName.trim() || !guestEmail.trim() || !guestPhone.trim()) {
      setError("Please fill in name, email, and phone.");
      return;
    }
    if (!guestConsent || !guestTerms) {
      setError("Please accept contact consent and the Terms to continue.");
      return;
    }
    writeMinimalEnrollmentDraft({
      courseSlug,
      courseId,
      name: guestName.trim(),
      email: guestEmail.trim(),
      phone: guestPhone.trim(),
      enrollmentNote: guestNote.trim() || undefined,
      consentContact: true,
      acceptedTerms: true,
      finalizeOnPortal: true,
    });
    router.push(PORTAL_FINISH_SIGNUP);
  };

  const handleLoggedInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const name = (loggedName || profileName || user?.displayName || "").trim();
    const phone = (loggedPhone || profilePhone).trim();
    if (!name || !phone) {
      setError("Please add your name and phone below, or update them in your delegate portal.");
      return;
    }
    if (!loggedConsent || !loggedTerms) {
      setError("Please accept contact consent and the Terms to enroll.");
      return;
    }
    void submitWithToken({
      name,
      phone,
      enrollmentNote: loggedNote.trim() || undefined,
      consentContact: true,
      acceptedTerms: true,
    });
  };

  if (loading || !enrollmentCheckDone || (user && !profileReady)) {
    return (
      <div className="mt-6 py-4 text-center text-sm text-white/50" aria-busy="true">
        Loading…
      </div>
    );
  }

  if (isAdmin) {
    return (
      <div className="mt-6 space-y-3">
        <p className="text-center text-sm text-white/70">Admins enroll through the admin area.</p>
        <Link
          href="/admin"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-accentGold py-3.5 text-sm font-semibold uppercase tracking-wider text-background transition hover:bg-accentGold/90"
        >
          Go to admin
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="mt-6 space-y-4 rounded-xl border border-accentGold/30 bg-accentGold/5 p-4">
        <p className="text-center text-sm font-medium text-white">You&apos;re enrolled.</p>
        <p className="text-center text-xs text-white/60">
          Complete payment and manage your course from the delegate portal when you&apos;re ready.
        </p>
        <Link
          href="/portal/dashboard"
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-accentGold/60 bg-accentGold/10 py-3.5 text-sm font-semibold uppercase tracking-wider text-accentGold transition hover:bg-accentGold/20"
        >
          <LayoutDashboard className="h-4 w-4" aria-hidden />
          Go to delegate portal
        </Link>
      </div>
    );
  }

  if (user && isEnrolled) {
    return (
      <div className="mt-6 space-y-3">
        <p className="text-center text-sm text-white/80">You are already enrolled in this course.</p>
        <Link
          href="/portal/dashboard"
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-accentGold/60 bg-accentGold/10 py-3.5 text-sm font-semibold uppercase tracking-wider text-accentGold transition hover:bg-accentGold/20"
        >
          <LayoutDashboard className="h-4 w-4" aria-hidden />
          Go to Delegate portal to manage enrolled courses
        </Link>
      </div>
    );
  }

  if (user) {
    const needsNamePhone = !profileName && !loggedName.trim() && !(user.displayName || "").trim();
    const needsPhone = !profilePhone && !loggedPhone.trim();

    return (
      <form onSubmit={handleLoggedInSubmit} className="mt-6 space-y-4">
        <p className="text-xs text-white/60 leading-relaxed">
          Confirm enrollment for this course. Your account email is{" "}
          <span className="text-white">{user.email}</span>
          {profileName ? (
            <> — name and phone use your profile (editable below).</>
          ) : (
            <> — add any missing details below.</>
          )}
        </p>
        <Link
          href="/portal/dashboard#delegate-profile"
          className="inline-flex items-center gap-1 text-xs font-semibold text-accentGold underline hover:text-accentGold/80"
        >
          Edit name &amp; phone in delegate portal
        </Link>

        {(needsNamePhone || needsPhone) && (
          <div className="space-y-3 rounded-lg border border-white/10 bg-white/[0.02] p-3">
            <p className="text-xs text-white/50">Required for this enrollment:</p>
            {needsNamePhone && (
              <div>
                <label htmlFor="syspot-name" className="mb-1 block text-xs text-white/70">
                  Full name *
                </label>
                <input
                  id="syspot-name"
                  type="text"
                  value={loggedName}
                  onChange={(e) => setLoggedName(e.target.value)}
                  className={inputClass}
                  placeholder="Dr. Jane Smith"
                  required
                />
              </div>
            )}
            {needsPhone && (
              <div>
                <label htmlFor="syspot-phone" className="mb-1 block text-xs text-white/70">
                  Phone *
                </label>
                <input
                  id="syspot-phone"
                  type="tel"
                  value={loggedPhone}
                  onChange={(e) => setLoggedPhone(e.target.value)}
                  className={inputClass}
                  placeholder="+44 …"
                  required
                />
              </div>
            )}
          </div>
        )}

        <div>
          <label htmlFor="syspot-note-li" className="mb-1 block text-xs text-white/70">
            Message for the team (optional)
          </label>
          <textarea
            id="syspot-note-li"
            value={loggedNote}
            onChange={(e) => setLoggedNote(e.target.value)}
            rows={3}
            className={inputClass}
            placeholder="Anything we should know?"
          />
        </div>

        <label className="flex items-start gap-2 text-xs text-white/70">
          <input
            type="checkbox"
            checked={loggedConsent}
            onChange={(e) => setLoggedConsent(e.target.checked)}
            className="mt-0.5 rounded border-white/20"
          />
          <span>I agree to be contacted with further details about this course.</span>
        </label>
        <label className="flex items-start gap-2 text-xs text-white/70">
          <input
            type="checkbox"
            checked={loggedTerms}
            onChange={(e) => setLoggedTerms(e.target.checked)}
            className="mt-0.5 rounded border-white/20"
          />
          <span>
            I accept the{" "}
            <Link href="/terms" className="text-accentGold underline hover:text-accentGold/80">
              Terms and Conditions
            </Link>
            .
          </span>
        </label>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-accentGold py-3.5 text-sm font-semibold uppercase tracking-wider text-background transition hover:bg-accentGold/90 disabled:opacity-50"
        >
          {submitting ? "Submitting…" : "Enroll now"}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleFinishSignupEnroll} className="mt-6 space-y-4">
      <p className="text-xs text-white/60 leading-relaxed">
        Enter your details here, then choose a password on the next page. We&apos;ll create your account,
        enroll you in this course, and take you to your delegate dashboard.
      </p>

      <div>
        <label htmlFor="syspot-g-name" className="mb-1 block text-xs text-white/70">
          Full name *
        </label>
        <input
          id="syspot-g-name"
          type="text"
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
          className={inputClass}
          placeholder="Dr. Jane Smith"
          required
          autoComplete="name"
        />
      </div>
      <div>
        <label htmlFor="syspot-g-email" className="mb-1 block text-xs text-white/70">
          Email *
        </label>
        <input
          id="syspot-g-email"
          type="email"
          value={guestEmail}
          onChange={(e) => setGuestEmail(e.target.value)}
          className={inputClass}
          placeholder="jane@example.com"
          required
          autoComplete="email"
        />
      </div>
      <div>
        <label htmlFor="syspot-g-phone" className="mb-1 block text-xs text-white/70">
          Contact number *
        </label>
        <input
          id="syspot-g-phone"
          type="tel"
          value={guestPhone}
          onChange={(e) => setGuestPhone(e.target.value)}
          className={inputClass}
          placeholder="+44 …"
          required
          autoComplete="tel"
        />
      </div>
      <div>
        <label htmlFor="syspot-g-note" className="mb-1 block text-xs text-white/70">
          Message for the team (optional)
        </label>
        <textarea
          id="syspot-g-note"
          value={guestNote}
          onChange={(e) => setGuestNote(e.target.value)}
          rows={3}
          className={inputClass}
          placeholder="Optional — e.g. dietary needs or questions"
        />
      </div>

      <label className="flex items-start gap-2 text-xs text-white/70">
        <input
          type="checkbox"
          checked={guestConsent}
          onChange={(e) => setGuestConsent(e.target.checked)}
          className="mt-0.5 rounded border-white/20"
        />
        <span>I agree to be contacted with further details about this course.</span>
      </label>
      <label className="flex items-start gap-2 text-xs text-white/70">
        <input
          type="checkbox"
          checked={guestTerms}
          onChange={(e) => setGuestTerms(e.target.checked)}
          className="mt-0.5 rounded border-white/20"
        />
        <span>
          I accept the{" "}
          <Link href="/terms" className="text-accentGold underline hover:text-accentGold/80">
            Terms and Conditions
          </Link>
          .
        </span>
      </label>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-accentGold py-3.5 text-sm font-semibold uppercase tracking-wider text-background transition hover:bg-accentGold/90"
      >
        <UserPlus className="h-4 w-4 shrink-0" aria-hidden />
        Finish sign up and enroll
        <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
      </button>

      <p className="text-center text-[0.65rem] text-white/45">
        Already have an account?{" "}
        <Link
          href={`/portal?redirect=${encodeURIComponent(`/courses/${courseSlug}`)}`}
          className="text-accentGold/90 underline hover:text-accentGold"
        >
          Sign in
        </Link>
        , return to this course, and tap <span className="text-white/70">Enroll now</span>.
      </p>
    </form>
  );
}
