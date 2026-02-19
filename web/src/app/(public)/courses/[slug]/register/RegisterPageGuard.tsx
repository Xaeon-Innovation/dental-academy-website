"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

interface RegisterPageGuardProps {
  slug: string;
  children: React.ReactNode;
}

export default function RegisterPageGuard({ slug, children }: RegisterPageGuardProps) {
  const router = useRouter();
  const { user, loading, isAdmin } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user || isAdmin) {
      if (isAdmin) {
        // Admins should not enroll as students
        router.replace("/admin");
      } else {
        const redirect = `/courses/${slug}/register`;
        router.replace(`/portal?redirect=${encodeURIComponent(redirect)}`);
      }
    }
  }, [loading, user, isAdmin, slug, router]);

  if (loading) {
    return (
      <div className="bg-background px-4 py-16 text-white md:py-20">
        <div className="mx-auto max-w-2xl text-center text-white/60">
          Checking access…
        </div>
      </div>
    );
  }

  if (!user || isAdmin) {
    return null;
  }

  return <>{children}</>;
}
