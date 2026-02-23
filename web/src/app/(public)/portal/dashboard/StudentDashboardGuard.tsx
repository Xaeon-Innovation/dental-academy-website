"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import LoadingScreen from "@/components/LoadingScreen";

export default function StudentDashboardGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading, isAdmin } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user || isAdmin) {
      router.replace("/portal");
    }
  }, [loading, user, isAdmin, router]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user || isAdmin) {
    return null;
  }

  return <>{children}</>;
}
