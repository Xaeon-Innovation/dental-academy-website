"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithEmailAndPassword, auth } from "@/lib/firebase/auth";

export default function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check for error in URL params
    const errorParam = searchParams.get("error");
    if (errorParam === "unauthorized") {
      setError(
        "Your email is not authorized to access the admin dashboard. Please contact an administrator."
      );
    }
  }, [searchParams]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Redirect to admin dashboard on success
      router.push("/admin");
      router.refresh();
    } catch (err: any) {
      console.error("Login error:", err);

      // Handle Firebase auth errors
      let errorMessage = "Failed to sign in. Please try again.";

      if (err.code === "auth/user-not-found") {
        errorMessage = "No account found with this email.";
      } else if (err.code === "auth/wrong-password") {
        errorMessage = "Incorrect password.";
      } else if (err.code === "auth/invalid-email") {
        errorMessage = "Invalid email address.";
      } else if (err.code === "auth/user-disabled") {
        errorMessage = "This account has been disabled.";
      } else if (err.code === "auth/too-many-requests") {
        errorMessage = "Too many failed attempts. Please try again later.";
      } else if (err.code === "auth/invalid-credential") {
        errorMessage = "Invalid email or password.";
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      <div className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-white/80 mb-2"
          >
            Email / Username
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/40 focus:border-accentGold/50 focus:outline-none focus:ring-2 focus:ring-accentGold/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="admin@example.com"
            autoComplete="email"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-white/80 mb-2"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/40 focus:border-accentGold/50 focus:outline-none focus:ring-2 focus:ring-accentGold/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="Enter your password"
            autoComplete="current-password"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-full border-2 border-accentGold bg-accentGold px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-background transition hover:border-accentGold/90 hover:bg-accentGold/90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
}
