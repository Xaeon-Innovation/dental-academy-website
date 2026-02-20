"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function HomeCtaButtons() {
  const { user, loading, isAdmin } = useAuth();
  const isStudent = !loading && user && !isAdmin;

  return (
    <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
      <Link
        href="/courses"
        className="btn-liquid inline-flex items-center gap-2 px-8 py-3 text-sm font-semibold uppercase tracking-[0.16em]"
      >
        View courses
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
      <Link
        href={isStudent ? "/portal/dashboard" : "/portal"}
        className="btn-liquid inline-flex items-center gap-2 px-8 py-3 text-sm font-semibold uppercase tracking-[0.16em]"
      >
        {isStudent ? "Dashboard" : "Student portal"}
      </Link>
    </div>
  );
}
