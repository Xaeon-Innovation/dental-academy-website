"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface RegisterNowButtonProps {
  courseSlug: string;
}

export function RegisterNowButton({ courseSlug }: RegisterNowButtonProps) {
  const router = useRouter();
  const { user, loading, isAdmin } = useAuth();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (loading) {
      e.preventDefault();
      return;
    }
    if (isAdmin) {
      e.preventDefault();
      router.push("/admin");
      return;
    }
    if (!user) {
      e.preventDefault();
      const redirect = `/courses/${courseSlug}/register`;
      router.push(`/portal?redirect=${encodeURIComponent(redirect)}`);
    }
  };

  return (
    <Link
      href={`/courses/${courseSlug}/register`}
      onClick={handleClick}
      className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-accentGold py-3.5 text-sm font-semibold uppercase tracking-wider text-background transition hover:bg-accentGold/90"
    >
      Register now
      <ArrowRight className="h-4 w-4" aria-hidden />
    </Link>
  );
}
