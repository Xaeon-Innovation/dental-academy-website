"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminAuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    // If authenticated and on login page, redirect to dashboard
    if (!loading && user && isAdmin && isLoginPage) {
      router.push("/admin");
      return;
    }

    // If not authenticated and trying to access admin routes (except login), redirect to login
    if (!loading && !user && !isLoginPage && pathname?.startsWith("/admin")) {
      router.push("/admin/login");
      return;
    }

    // If authenticated but not an admin, redirect to login with error
    if (!loading && user && !isAdmin && !isLoginPage && pathname?.startsWith("/admin")) {
      router.push("/admin/login?error=unauthorized");
      return;
    }
  }, [user, loading, isAdmin, router, pathname, isLoginPage]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-white/70">Loading...</p>
      </div>
    );
  }

  // Allow login page even if not authenticated
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Redirect if not authenticated or not admin
  if (!user || !isAdmin) {
    return null;
  }

  return <>{children}</>;
}
