"use client";

import { useState, FormEvent, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  auth,
} from "@/lib/firebase/auth";
import { createOrUpdateStudentProfile } from "@/lib/actions/student";
import { useAuth } from "@/contexts/AuthContext";
import LoadingScreen from "@/components/LoadingScreen";
import { z } from "zod";

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

  const redirectTo = getRedirectPath(searchParams);
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (loading) return;
    if (user && !isAdmin && !hasRedirected.current) {
      hasRedirected.current = true;
      router.replace(redirectTo);
    }
  }, [loading, user, isAdmin, redirectTo, router]);

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      hasRedirected.current = true;
      router.replace(redirectTo);
    } catch (err: unknown) {
      const code = err && typeof err === "object" && "code" in err ? (err as { code: string }).code : "";
      setError(authErrorMessage(code, "Failed to sign in. Please try again."));
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
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const result = await createOrUpdateStudentProfile(cred.user.uid, {
        uid: cred.user.uid,
        email,
        phone: parsed.data.phone,
        displayName: displayName.trim() || undefined,
      });
      if (!result.success) {
        setError(result.error);
        setIsLoading(false);
        return;
      }
      hasRedirected.current = true;
      // Full page navigation so the next page loads with auth from persistence (avoids frozen UI)
      window.location.href = redirectTo;
      return;
    } catch (err: unknown) {
      const code = err && typeof err === "object" && "code" in err ? (err as { code: string }).code : "";
      setError(authErrorMessage(code, "Failed to create account. Please try again."));
    } finally {
      setIsLoading(false);
    }
  };

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
            Sign in or create an account to enroll in courses and access your dashboard.
          </p>

          <div className="mt-6 flex gap-2 border-b border-white/10">
            <button
              type="button"
              onClick={() => { setMode("login"); setError(null); setFieldErrors({}); }}
              className={`pb-3 text-sm font-medium transition ${
                mode === "login"
                  ? "border-b-2 border-accentGold text-accentGold"
                  : "text-white/60 hover:text-white/80"
              }`}
            >
              Log in
            </button>
            <button
              type="button"
              onClick={() => { setMode("signup"); setError(null); setFieldErrors({}); }}
              className={`pb-3 text-sm font-medium transition ${
                mode === "signup"
                  ? "border-b-2 border-accentGold text-accentGold"
                  : "text-white/60 hover:text-white/80"
              }`}
            >
              Sign up
            </button>
          </div>

          {mode === "login" ? (
            <form onSubmit={handleLogin} className="mt-6 space-y-4">
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
                <label htmlFor="login-password" className="mb-1 block text-xs text-white/70">
                  Password
                </label>
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white placeholder:text-white/40 focus:border-accentGold/50 focus:outline-none"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-full border-2 border-accentGold bg-accentGold px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-background transition hover:bg-accentGold/90 disabled:opacity-50"
              >
                {isLoading ? "Signing in…" : "Log in"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="mt-6 space-y-4">
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
                disabled={isLoading}
                className="w-full rounded-full border-2 border-accentGold bg-accentGold px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-background transition hover:bg-accentGold/90 disabled:opacity-50"
              >
                {isLoading ? "Creating account…" : "Sign up"}
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
