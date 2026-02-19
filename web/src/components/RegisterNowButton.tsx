"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getRegistrationsByUserId } from "@/lib/actions/student";

interface RegisterNowButtonProps {
  courseSlug: string;
  courseId: string;
}

export function RegisterNowButton({ courseSlug, courseId }: RegisterNowButtonProps) {
  const router = useRouter();
  const { user, loading, isAdmin } = useAuth();
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<string[]>([]);
  const [enrollmentCheckDone, setEnrollmentCheckDone] = useState(false);

  useEffect(() => {
    if (!user?.uid) {
      setEnrolledCourseIds([]);
      setEnrollmentCheckDone(true);
      return;
    }
    let cancelled = false;
    getRegistrationsByUserId(user.uid).then((regs) => {
      if (cancelled) return;
      const ids = regs.filter((r) => r.status !== "cancelled").map((r) => r.courseId);
      setEnrolledCourseIds(ids);
      setEnrollmentCheckDone(true);
    });
    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  const isEnrolled = enrollmentCheckDone && user && enrolledCourseIds.includes(courseId);

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

  if (user && isEnrolled) {
    return (
      <div className="mt-6 space-y-3">
        <p className="text-center text-sm text-white/80">You are already enrolled in this course.</p>
        <Link
          href="/portal/dashboard"
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-accentGold/60 bg-accentGold/10 py-3.5 text-sm font-semibold uppercase tracking-wider text-accentGold transition hover:bg-accentGold/20"
        >
          <LayoutDashboard className="h-4 w-4" aria-hidden />
          Go to student portal to manage enrolled courses
        </Link>
      </div>
    );
  }

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
