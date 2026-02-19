"use client";

import { useAuth } from "@/contexts/AuthContext";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";

export function HomeCtaButtons() {
  const { user, loading, isAdmin } = useAuth();
  const isStudent = !loading && user && !isAdmin;

  return (
    <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
      <InteractiveHoverButton href="/courses" variant="primary">
        View courses
      </InteractiveHoverButton>
      <InteractiveHoverButton
        href={isStudent ? "/portal/dashboard" : "/portal"}
        variant="secondary"
      >
        {isStudent ? "Dashboard" : "Student portal"}
      </InteractiveHoverButton>
    </div>
  );
}
