"use client";

import { useState, FormEvent, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  signInWithCustomToken,
  createUserWithEmailAndPassword,
  auth,
} from "@/lib/firebase/auth";
import { createOrUpdateStudentProfile } from "@/lib/actions/student";
import { submitMinimalEnrollment } from "@/lib/actions/registration";
import { authenticateWithEmailPhone } from "@/lib/actions/enquiry";
import { useAuth } from "@/contexts/AuthContext";
import LoadingScreen from "@/components/LoadingScreen";
import { z } from "zod";
import {
  readMinimalEnrollmentDraft,
  clearMinimalEnrollmentDraft,
  isFinalizeEnrollmentDraft,
} from "@/lib/course-enrollment-draft";

const signUpSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  phone: z.string().min(1, "Phone number is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

function getRedirectPath(searchParams: URLSearchParams): string {
  const redirect = searchParams.get("redirect");
  if (!redirect || typeof redirect !== "string") return "/portal/dashboard";
  if (!redirect.startsWith("/") || redirect.startsWith("//")) return "/portal/dashboard";
  return redirect;
}

const AUTH_TIMEOUT_MS = 25000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("AUTH_TIMEOUT")), ms)
    ),
  ]);
}

function authErrorMessage(code: string, fallback: string): string {
  const messages: Record<string, string> = {
    "auth/user-not-found": "No account found with this email.",
    "auth/wrong-password": "Incorrect password.",
    "auth/invalid-email": "Invalid email address.",
    "auth/email-already-in-use": "An account already exists with this email.",
    "auth/weak-password": "Password should be at least 6 characters.",
    "auth/user-disabled": "This account has been disabled.",
    "auth/too-many-requests": "Too many attempts. Please try again later.",
    "auth/invalid-credential": "Invalid email or password.",
  };
  return messages[code] || fallback;
}

async function completeEnrollmentFromDraft(
  idToken: string,
  d: NonNullable<ReturnType<typeof readMinimalEnrollmentDraft>> & {
    courseId: string;
    name: string;
    email: string;
    phone: string;
  }
) {
  return submitMinimalEnrollment({
    courseId: d.courseId,
    courseSlug: d.courseSlug,
    ...(d.batchId ? { batchId: d.batchId } : {}),
    ...(d.batchLabel ? { batchLabel: d.batchLabel } : {}),
    ...(d.batchDateRange ? { batchDateRange: d.batchDateRange } : {}),
    ...(d.batchDuration ? { batchDuration: d.batchDuration } : {}),
    ...(d.batchLocation ? { batchLocation: d.batchLocation } : {}),
    name: d.name.trim(),
    phone: d.phone.trim(),
    enrollmentNote: d.enrollmentNote?.trim(),
    consentContact: true,
    acceptedTerms: true,
    idToken,
  });
}

function PortalPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, isAdmin } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [compactSignup, setCompactSignup] = useState(false);
  const [finalizeDraftMissing, setFinalizeDraftMissing] = useState(false);
  const [signupPrefillDone, setSignupPrefillDone] = useState(false);

  const redirectTo = getRedirectPath(searchParams);
  const finalizeEnroll = searchParams.get("finalizeEnroll") === "1";
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (!finalizeEnroll) {
      setSignupPrefillDone(true);
      return;
    }
    const d = readMinimalEnrollmentDraft();
    if (isFinalizeEnrollmentDraft(d)) {
      setMode("signup");
      setEmail(d.email.trim());
      setPhone(d.phone.trim());
      setDisplayName(d.name.trim());
      setCompactSignup(true);
    } else {
      setFinalizeDraftMissing(true);
    }
    setSignupPrefillDone(true);
  }, [finalizeEnroll]);

  useEffect(() => {
    if (loading) return;
    if (!user || isAdmin) return;
    if (hasRedirected.current) return;

    if (finalizeEnroll) {
      const d = readMinimalEnrollmentDraft();
      if (isFinalizeEnrollmentDraft(d)) {
        hasRedirected.current = true;
        setIsLoading(true);
        void (async () => {
          try {
            const idToken = await user.getIdToken();
            const res = await completeEnrollmentFromDraft(idToken, d);
            clearMinimalEnrollmentDraft();
            if (res.success) {
              window.location.href = "/portal/dashboard?enrolled=1";
            } else {
              hasRedirected.current = false;
              setError(res.error);
              setIsLoading(false);
            }
          } catch (e) {
            hasRedirected.current = false;
            setError(e instanceof Error ? e.message : "Enrollment failed");
            setIsLoading(false);
          }
        })();
        return;
      }
    }

    hasRedirected.current = true;
    router.replace(redirectTo);
  }, [loading, user, isAdmin, finalizeEnroll, redirectTo, router]);

  const handleLogin = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setIsLoading(true);
    try {
      const authResult = await withTimeout(
        authenticateWithEmailPhone({ email, phone }),
        AUTH_TIMEOUT_MS
      );
      if (!authResult.success) {
        setError(authResult.error);
        setIsLoading(false);
        return;
      }
      await withTimeout(signInWithCustomToken(auth, authResult.customToken), AUTH_TIMEOUT_MS);
      const cred = auth.currentUser;
      if (!cred) throw new Error("Signed in but no user session.");

      if (finalizeEnroll) {
        const d = readMinimalEnrollmentDraft();
        if (isFinalizeEnrollmentDraft(d)) {
          const idToken = await cred.getIdToken();
          const res = await completeEnrollmentFromDraft(idToken, d);
          clearMinimalEnrollmentDraft();
          if (!res.success) {
            setError(res.error);
            setIsLoading(false);
            return;
          }
          window.location.href = "/portal/dashboard?enrolled=1";
          return;
        }
      }

      hasRedirected.current = true;
      router.replace(redirectTo);
    } catch (err: unknown) {
      if (err instanceof Error && err.message === "AUTH_TIMEOUT") {
        setError("Request timed out. Please check your connection and try again.");
      } else {
        const fallback = err instanceof Error ? err.message : "Failed to sign in. Please try again.";
        setError(fallback);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    const parsed = signUpSchema.safeParse({ email, phone, password });
    if (!parsed.success) {
      const issues: Record<string, string> = {};
      parsed.error.issues.forEach((i) => {
        const path = i.path[0]?.toString();
        if (path) issues[path] = i.message;
      });
      setFieldErrors(issues);
      setError("Please fix the errors below.");
      return;
    }
    setIsLoading(true);
    try {
      const signUpPromise = (async () => {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const result = await createOrUpdateStudentProfile(cred.user.uid, {
          uid: cred.user.uid,
          email,
          phone: parsed.data.phone,
          displayName: displayName.trim() || undefined,
        });
        if (!result.success) throw new Error(result.error);

        if (finalizeEnroll) {
          const d = readMinimalEnrollmentDraft();
          if (isFinalizeEnrollmentDraft(d)) {
            const idToken = await cred.user.getIdToken();
            const res = await completeEnrollmentFromDraft(idToken, d);
            clearMinimalEnrollmentDraft();
            if (!res.success) throw new Error(res.error);
            window.location.href = "/portal/dashboard?enrolled=1";
            return;
          }
        }

        hasRedirected.current = true;
        window.location.href = redirectTo;
      })();
      await withTimeout(signUpPromise, AUTH_TIMEOUT_MS);
    } catch (err: unknown) {
      if (err instanceof Error && err.message === "AUTH_TIMEOUT") {
        setError("Request timed out. Please check your connection and try again.");
      } else {
        const code = err && typeof err === "object" && "code" in err ? (err as { code: string }).code : "";
        const fallback = err instanceof Error ? err.message : "Failed to create account. Please try again.";
        setError(authErrorMessage(code, fallback));
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (finalizeEnroll && !signupPrefillDone) {
    return <LoadingScreen />;
  }

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-background px-4 py-16 text-white md:py-24">
      <div className="mx-auto max-w-md">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-black/90 p-8 shadow-[0_18px_60px_rgba(0,0,0,0.85)]">
          <h1 className="font-[var(--font-playfair)] text-2xl tracking-tight text-white">
            Delegate portal
          </h1>
          <p className="mt-2 text-sm text-white/70">
            {finalizeEnroll && compactSignup
              ? "Choose a password below. We'll create your account, enroll you in the course, and open your delegate dashboard."
              : finalizeEnroll && finalizeDraftMissing
                ? "We couldn't load your enrollment details. Go back to the course page and tap \"Finish sign up and enroll\" again."
                : "Log in with your approved email and phone number to access your delegate dashboard."}
          </p>
          {!finalizeEnroll && (
            <p className="mt-3 text-xs text-white/55">
              Past delegate?{" "}
              <Link href="/portal/legacy" className="text-accentGold/80 underline hover:text-accentGold">
                Request access
              </Link>
              .
            </p>
          )}

          {finalizeEnroll && finalizeDraftMissing && (
            <div className="mt-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200/90">
              <Link href="/courses" className="font-semibold text-accentGold underline hover:text-accentGold/90">
                Browse courses
              </Link>
            </div>
          )}

          <div className="mt-6 flex gap-2 border-b border-white/10">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError(null);
                setFieldErrors({});
              }}
              className={`pb-3 text-sm font-medium transition ${
                mode === "login"
                  ? "border-b-2 border-accentGold text-accentGold"
                  : "text-white/60 hover:text-white/80"
              }`}
            >
              Log in
            </button>
            {finalizeEnroll && (
              <button
                type="button"
                onClick={() => {
                  if (finalizeEnroll && finalizeDraftMissing) return;
                  setMode("signup");
                  setError(null);
                  setFieldErrors({});
                }}
                disabled={finalizeEnroll && finalizeDraftMissing}
                className={`pb-3 text-sm font-medium transition ${
                  mode === "signup"
                    ? "border-b-2 border-accentGold text-accentGold"
                    : "text-white/60 hover:text-white/80"
                } ${finalizeEnroll && finalizeDraftMissing ? "cursor-not-allowed opacity-40" : ""}`}
              >
                Sign up
              </button>
            )}
          </div>

          {mode === "login" ? (
            <form onSubmit={handleLogin} className="mt-6 space-y-4">
              {finalizeEnroll && compactSignup && !finalizeDraftMissing && (
                <p className="text-xs text-white/55">
                  Use the email you entered on the course page. After sign-in we'll finish your enrollment and
                  open your dashboard.
                </p>
              )}
              <div>
                <label htmlFor="login-email" className="mb-1 block text-xs text-white/70">
                  Email
                </label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white placeholder:text-white/40 focus:border-accentGold/50 focus:outline-none"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>
              <div>
                <label htmlFor="login-phone" className="mb-1 block text-xs text-white/70">
                  Phone number
                </label>
                <input
                  id="login-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  disabled={isLoading}
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white placeholder:text-white/40 focus:border-accentGold/50 focus:outline-none"
                  placeholder="+44 7XXX XXXXXX"
                  autoComplete="tel"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-full border-2 border-accentGold bg-accentGold px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-background transition hover:bg-accentGold/90 disabled:opacity-50"
              >
                {isLoading ? "Signing in…" : finalizeEnroll && compactSignup ? "Sign in & enroll" : "Log in"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="mt-6 space-y-4">
              {compactSignup && (
                <div className="space-y-2 rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm text-white/85">
                  <p className="text-xs font-semibold uppercase tracking-wider text-accentGold">
                    Your enrollment details
                  </p>
                  <p>
                    <span className="text-white/45">Name</span> — {displayName}
                  </p>
                  <p>
                    <span className="text-white/45">Email</span> — {email}
                  </p>
                  <p>
                    <span className="text-white/45">Phone</span> — {phone}
                  </p>
                </div>
              )}

              {!compactSignup && (
                <>
                  <div>
                    <label htmlFor="signup-email" className="mb-1 block text-xs text-white/70">
                      Email *
                    </label>
                    <input
                      id="signup-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                      className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white placeholder:text-white/40 focus:border-accentGold/50 focus:outline-none"
                      placeholder="you@example.com"
                      autoComplete="email"
                    />
                    {fieldErrors.email && (
                      <p className="mt-1 text-xs text-red-400">{fieldErrors.email}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="signup-phone" className="mb-1 block text-xs text-white/70">
                      Phone number *
                    </label>
                    <input
                      id="signup-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      disabled={isLoading}
                      className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white placeholder:text-white/40 focus:border-accentGold/50 focus:outline-none"
                      placeholder="+44 7XXX XXXXXX"
                      autoComplete="tel"
                    />
                    {fieldErrors.phone && (
                      <p className="mt-1 text-xs text-red-400">{fieldErrors.phone}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="signup-displayName" className="mb-1 block text-xs text-white/70">
                      Full name (optional)
                    </label>
                    <input
                      id="signup-displayName"
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      disabled={isLoading}
                      className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white placeholder:text-white/40 focus:border-accentGold/50 focus:outline-none"
                      placeholder="Dr. Jane Smith"
                      autoComplete="name"
                    />
                  </div>
                </>
              )}

              <div>
                <label htmlFor="signup-password" className="mb-1 block text-xs text-white/70">
                  Password *
                </label>
                <input
                  id="signup-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={isLoading}
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white placeholder:text-white/40 focus:border-accentGold/50 focus:outline-none"
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                />
                {fieldErrors.password && (
                  <p className="mt-1 text-xs text-red-400">{fieldErrors.password}</p>
                )}
              </div>
              <button
                type="submit"
                disabled={isLoading || (finalizeEnroll && finalizeDraftMissing)}
                className="w-full rounded-full border-2 border-accentGold bg-accentGold px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-background transition hover:bg-accentGold/90 disabled:opacity-50"
              >
                {isLoading
                  ? "Working…"
                  : compactSignup && finalizeEnroll
                    ? "Create account & enroll"
                    : "Sign up"}
              </button>
            </form>
          )}

          {error && (
            <div className="mt-4 rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <p className="mt-6 text-center text-xs text-white/50">
            <Link href="/" className="text-accentGold/80 hover:text-accentGold">
              ← Back to home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function PortalFallback() {
  return <LoadingScreen />;
}

export default function PortalPage() {
  return (
    <Suspense fallback={<PortalFallback />}>
      <PortalPageContent />
    </Suspense>
  );
}
