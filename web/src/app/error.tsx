"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-white">
      <h1 className="font-[var(--font-playfair)] text-3xl tracking-tight">
        Something went wrong
      </h1>
      <p className="mt-2 text-sm text-white/70">
        An error occurred. Please try again.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-full border border-accentGold px-6 py-2 text-sm font-semibold uppercase tracking-[0.16em] text-accentGold transition hover:bg-accentGold hover:text-background"
      >
        Try again
      </button>
    </div>
  );
}
