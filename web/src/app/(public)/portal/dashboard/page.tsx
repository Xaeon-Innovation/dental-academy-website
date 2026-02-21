"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getStudentProfile, getRegistrationsByUserId, createOrUpdateStudentProfile, updateStudentSavedForm } from "@/lib/actions/student";
import { getCourses } from "@/lib/actions/course";
import { computeRegistrationTotal } from "@/lib/pricing";
import type { StudentProfile } from "@/types/student";
import type { Registration } from "@/types/registration";
import type { Course } from "@/types/course";
import StudentDashboardGuard from "./StudentDashboardGuard";
import DashboardProfileForm from "./DashboardProfileForm";
import DashboardSavedFormEditor from "./DashboardSavedFormEditor";

function formatSlug(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function PortalDashboardPage() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [registrations, setRegistrations] = useState<(Registration & { id: string })[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getStudentProfile(user.uid),
      getRegistrationsByUserId(user.uid),
      getCourses(),
    ]).then(([p, regs, coursesData]) => {
      setProfile(p ?? null);
      setRegistrations(regs);
      setCourses(coursesData);
      setLoading(false);
    });
  }, [user]);

  const courseById = new Map(courses.map((c) => [c.id, c]));

  const handleProfileSave = async (data: { phone: string; displayName?: string }) => {
    if (!user) return { success: false as const, error: "Not signed in" };
    const result = await createOrUpdateStudentProfile(user.uid, data);
    if (result.success) {
      setProfile((prev) => (prev ? { ...prev, ...data } : null));
    }
    return result;
  };

  const handleSavedFormSave = async (snapshot: Parameters<typeof updateStudentSavedForm>[1]) => {
    if (!user) return { success: false as const, error: "Not signed in" };
    const result = await updateStudentSavedForm(user.uid, snapshot);
    if (result.success) {
      setProfile((prev) => (prev ? { ...prev, savedFormSnapshot: snapshot } : null));
    }
    return result;
  };

  return (
    <StudentDashboardGuard>
      <div className="min-h-screen bg-background px-4 py-16 text-white md:py-20">
        <div className="mx-auto max-w-3xl">
          <header className="mb-10">
            <h1 className="font-[var(--font-playfair)] text-3xl tracking-tight md:text-4xl">
              Student dashboard
            </h1>
            <p className="mt-2 text-sm text-white/70">
              Your enrolled courses, profile, and saved enrollment info.
            </p>
            <div className="mt-4 flex flex-col gap-3">
              <Link
                href="/"
                className="inline-block text-xs font-semibold uppercase tracking-[0.18em] text-white/60 transition hover:text-accentGold/80"
              >
                ← Home
              </Link>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/portal/dashboard/testimonials"
                  className="w-fit rounded-full border border-accentGold px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-accentGold transition hover:bg-accentGold/10"
                >
                  Testimonials
                </Link>
                <Link
                  href="/courses"
                  className="w-fit rounded-full border border-accentGold px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-accentGold transition hover:bg-accentGold/10"
                >
                  View courses
                </Link>
                <button
                  type="button"
                  onClick={signOut}
                  className="flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/80 transition hover:border-accentGold/30 hover:bg-accentGold/10 hover:text-accentGold"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign out
                </button>
              </div>
            </div>
          </header>

          {loading ? (
            <p className="text-white/60">Loading…</p>
          ) : (
            <div className="space-y-10">
              <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-accentGold">
                  Enrolled courses
                </h2>
                {registrations.length > 0 && (
                  <p className="mt-2 text-xs text-white/60">
                    Please wait for confirmation from the admin. You will be contacted once your enrollment is confirmed.
                  </p>
                )}
                {registrations.length === 0 ? (
                  <p className="mt-4 text-sm text-white/60">
                    You have not enrolled in any courses yet.{" "}
                    <Link href="/courses" className="text-accentGold hover:underline">
                      Browse courses
                    </Link>
                  </p>
                ) : (
                  <ul className="mt-4 space-y-3">
                    {registrations.map((reg) => {
                      const course = courseById.get(reg.courseId);
                      const totalResult = computeRegistrationTotal(reg, course);
                      return (
                        <li
                          key={reg.id}
                          className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-lg border border-white/5 bg-black/20 px-4 py-3"
                        >
                          <div>
                            <span className="font-medium text-white">
                              {reg.courseSlug ? formatSlug(reg.courseSlug) : reg.courseId}
                            </span>
                            <span className="ml-2 text-xs text-white/50">({reg.status})</span>
                            {totalResult && (
                              <span className="ml-2 text-xs text-white/60">
                                Total: {totalResult.formattedTotal}
                              </span>
                            )}
                            {totalResult === null && course && (
                              <span className="ml-2 text-xs text-white/50">On request</span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-3">
                            {reg.status === "pending" && (
                              <Link
                                href={`/portal/dashboard/enrollments/${reg.id}/edit`}
                                className="text-xs font-semibold uppercase tracking-wider text-accentGold hover:underline"
                              >
                                Update enrollment
                              </Link>
                            )}
                            {reg.courseSlug && (
                              <Link
                                href={`/courses/${reg.courseSlug}`}
                                className="text-xs font-semibold uppercase tracking-wider text-accentGold hover:underline"
                              >
                                View course
                              </Link>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>

              <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-accentGold">
                  Profile
                </h2>
                <DashboardProfileForm
                  profile={profile}
                  email={user?.email ?? ""}
                  onSave={handleProfileSave}
                />
              </section>

              <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-accentGold">
                  Saved enrollment info
                </h2>
                <p className="mt-1 text-xs text-white/60">
                  This info will prefill when you enroll in another course. Edit and save to update.
                </p>
                <DashboardSavedFormEditor
                  savedFormSnapshot={profile?.savedFormSnapshot}
                  profileFallback={{
                    name: profile?.displayName,
                    email: user?.email ?? undefined,
                    phone: profile?.phone,
                  }}
                  onSave={handleSavedFormSave}
                />
              </section>
            </div>
          )}
        </div>
      </div>
    </StudentDashboardGuard>
  );
}
