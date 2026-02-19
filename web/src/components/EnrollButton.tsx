"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

interface EnrollButtonProps {
  courseSlug: string;
  variant?: "default" | "primary";
  className?: string;
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

export function EnrollButton({ courseSlug, variant = "default", className, children, onClick }: EnrollButtonProps) {
  const router = useRouter();
  const { user, loading, isAdmin } = useAuth();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onClick) {
      onClick(e);
    }
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

  const baseClasses = variant === "primary"
    ? "inline-block rounded-full border-2 border-accentGold bg-accentGold px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-background transition hover:border-accentGold/90 hover:bg-accentGold/90"
    : "inline-block rounded-full border-2 border-accentGold px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-accentGold transition hover:border-accentGold/80 hover:bg-accentGold/10";

  return (
    <Link
      href={`/courses/${courseSlug}/register`}
      onClick={handleClick}
      className={className || baseClasses}
    >
      {children}
    </Link>
  );
}
