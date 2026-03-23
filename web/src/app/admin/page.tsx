"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Users, BookOpen, Clock, Banknote, TrendingUp, ArrowRight, Plus } from "lucide-react";
import { getAllStudents } from "@/lib/actions/student";
import { getAllRegistrations } from "@/lib/actions/registration";
import { getCourses } from "@/lib/actions/course";
import { formatPrice } from "@/lib/pricing";
import type { StudentProfile } from "@/types/student";
import type { Registration } from "@/types/registration";
import type { Course } from "@/types/course";

interface DashboardStats {
  totalStudents: number;
  totalEnrollments: number;
  /** Enrollments with payment recorded */
  enrollmentsPaidCount: number;
  /** Enrollments with amount due & not yet paid (excl. cancelled/refunded) */
  enrollmentsPendingPaymentCount: number;
  /** Sum of amountDueCents for paid enrollments */
  totalPaidCents: number;
  /** Sum of amountDueCents for enrollments not yet paid (excl. cancelled & refunded) */
  totalPendingCents: number;
  recentActivity: number;
}

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [students, setStudents] = useState<(StudentProfile & { id: string })[]>([]);
  const [registrations, setRegistrations] = useState<(Registration & { id: string })[]>([]);
  const [coursesMap, setCoursesMap] = useState<Map<string, Course>>(new Map());

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [studentsData, registrationsData, coursesData] = await Promise.all([
        getAllStudents(),
        getAllRegistrations(),
        getCourses(),
      ]);

      setStudents(studentsData);
      setRegistrations(registrationsData);

      // Create course map for quick lookup
      const map = new Map<string, Course>();
      coursesData.forEach((course) => {
        map.set(course.id, course);
      });
      setCoursesMap(map);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const stats: DashboardStats = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    let totalPaidCents = 0;
    let totalPendingCents = 0;
    let enrollmentsPaidCount = 0;
    let enrollmentsPendingPaymentCount = 0;
    for (const r of registrations) {
      const cents = r.amountDueCents ?? 0;
      if (r.paymentStatus === "paid") {
        totalPaidCents += cents;
        enrollmentsPaidCount++;
      } else if (r.status !== "cancelled" && r.paymentStatus !== "refunded") {
        totalPendingCents += cents;
        if (cents > 0) {
          enrollmentsPendingPaymentCount++;
        }
      }
    }

    return {
      totalStudents: students.length,
      totalEnrollments: registrations.length,
      enrollmentsPaidCount,
      enrollmentsPendingPaymentCount,
      totalPaidCents,
      totalPendingCents,
      recentActivity: registrations.filter((r) => {
        if (!r.createdAt) return false;
        const createdDate = new Date(r.createdAt);
        return createdDate >= sevenDaysAgo;
      }).length,
    };
  }, [students, registrations]);

  const recentStudents = useMemo(() => {
    return [...students]
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 5);
  }, [students]);

  const recentEnrollments = useMemo(() => {
    return registrations.slice(0, 5);
  }, [registrations]);

  /** Count enrollments per course; sorted by count descending. Percentages share of all enrollments. */
  const enrollmentByCourse = useMemo(() => {
    const total = registrations.length;
    if (total === 0) return { items: [] as { courseId: string; title: string; count: number; pct: number }[], total: 0 };

    const counts = new Map<string, number>();
    for (const r of registrations) {
      const id = r.courseId?.trim() || "unknown";
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }

    const items = [...counts.entries()]
      .map(([courseId, count]) => ({
        courseId,
        title:
          courseId === "unknown"
            ? "Unknown course"
            : (coursesMap.get(courseId)?.title ?? courseId),
        count,
        pct: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count);

    return { items, total };
  }, [registrations, coursesMap]);

  function formatDate(date: Date | undefined): string {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function getStatusBadgeColor(status: Registration["status"]): string {
    switch (status) {
      case "pending":
        return "bg-yellow-500/20 text-yellow-400";
      case "confirmed":
        return "bg-green-500/20 text-green-400";
      case "cancelled":
        return "bg-red-500/20 text-red-400";
      case "completed":
        return "bg-blue-500/20 text-blue-400";
      default:
        return "bg-white/10 text-white/70";
    }
  }

  if (loading) {
    return (
      <div>
        <h1 className="font-[var(--font-playfair)] text-2xl tracking-tight">Dashboard</h1>
        <p className="mt-2 text-sm text-white/70">Loading dashboard data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1 className="font-[var(--font-playfair)] text-2xl tracking-tight">Dashboard</h1>
        <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[var(--font-playfair)] text-2xl tracking-tight">Dashboard</h1>
        <p className="mt-2 text-sm text-white/70">Overview of your academy's activity and statistics</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-lg border border-white/10 bg-black/40 p-4 transition hover:border-accentGold/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-white/70">Total Delegates</p>
              <p className="mt-2 text-2xl font-bold text-white">{stats.totalStudents}</p>
            </div>
            <div className="rounded-full bg-accentGold/20 p-3">
              <Users className="h-5 w-5 text-accentGold" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-black/40 p-4 transition hover:border-accentGold/30">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/70">Total Enrollments</p>
              <p className="mt-2 text-2xl font-bold text-white">{stats.totalEnrollments}</p>
              {enrollmentByCourse.items.length > 0 ? (
                <>
                  <p className="mt-3 border-t border-white/10 pt-3 text-[10px] font-semibold uppercase tracking-wider text-white/45">
                    By course
                  </p>
                  <ul className="mt-2 max-h-40 space-y-2.5 overflow-y-auto pr-0.5">
                    {enrollmentByCourse.items.map((row) => (
                      <li key={row.courseId}>
                        <div className="flex items-baseline justify-between gap-2 text-[11px] leading-tight">
                          <span className="min-w-0 truncate text-white/85" title={row.title}>
                            {row.title}
                          </span>
                          <span className="shrink-0 tabular-nums text-white/55">
                            {row.count}{" "}
                            <span className="text-white/40">({row.pct}%)</span>
                          </span>
                        </div>
                        <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full bg-accentGold/75"
                            style={{ width: `${row.pct}%` }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/admin/registrations?tab=enrollments"
                    className="mt-2 inline-block text-[11px] text-accentGold transition hover:text-accentGold/80"
                  >
                    View all →
                  </Link>
                </>
              ) : (
                <p className="mt-2 text-xs text-white/50">No enrollments yet.</p>
              )}
            </div>
            <div className="shrink-0 rounded-full bg-accentGold/20 p-3">
              <BookOpen className="h-5 w-5 text-accentGold" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-black/40 p-4 transition hover:border-accentGold/30">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/70">
                Delegate payments
              </p>
              <div>
                <p className="text-xs text-white/50">Paid</p>
                <p className="mt-0.5 text-lg font-bold tabular-nums text-green-400">
                  {stats.enrollmentsPaidCount}
                </p>
              </div>
              <div>
                <p className="text-xs text-white/50">Pending payment</p>
                <p className="mt-0.5 text-lg font-bold tabular-nums text-amber-400">
                  {stats.enrollmentsPendingPaymentCount}
                </p>
              </div>
            </div>
            <div className="shrink-0 rounded-full bg-yellow-500/20 p-3">
              <Clock className="h-5 w-5 text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-black/40 p-4 transition hover:border-accentGold/30">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/70">Payments</p>
              <div>
                <p className="text-xs text-white/50">Total paid</p>
                <p className="mt-0.5 text-lg font-bold tabular-nums text-green-400">
                  {formatPrice(stats.totalPaidCents / 100)}
                </p>
              </div>
              <div>
                <p className="text-xs text-white/50">Total pending</p>
                <p className="mt-0.5 text-lg font-bold tabular-nums text-amber-400">
                  {formatPrice(stats.totalPendingCents / 100)}
                </p>
              </div>
            </div>
            <div className="shrink-0 rounded-full bg-green-500/20 p-3">
              <Banknote className="h-5 w-5 text-green-400" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-black/40 p-4 transition hover:border-accentGold/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-white/70">Recent Activity</p>
              <p className="mt-2 text-2xl font-bold text-white">{stats.recentActivity}</p>
              <p className="mt-1 text-xs text-white/50">Last 7 days</p>
            </div>
            <div className="rounded-full bg-blue-500/20 p-3">
              <TrendingUp className="h-5 w-5 text-blue-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-4 font-[var(--font-playfair)] text-xl tracking-tight">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/admin/registrations"
            className="flex items-center justify-between rounded-lg border border-white/10 bg-black/40 p-4 transition hover:border-accentGold/30 hover:bg-black/60"
          >
            <span className="text-sm font-medium text-white">View All Registrations</span>
            <ArrowRight className="h-4 w-4 text-white/70" />
          </Link>

          <Link
            href="/admin/courses/new"
            className="flex items-center justify-between rounded-lg border border-white/10 bg-black/40 p-4 transition hover:border-accentGold/30 hover:bg-black/60"
          >
            <span className="text-sm font-medium text-white">Create New Course</span>
            <Plus className="h-4 w-4 text-white/70" />
          </Link>

          <Link
            href="/admin/registrations?tab=users"
            className="flex items-center justify-between rounded-lg border border-white/10 bg-black/40 p-4 transition hover:border-accentGold/30 hover:bg-black/60"
          >
            <span className="text-sm font-medium text-white">Manage Delegates</span>
            <Users className="h-4 w-4 text-white/70" />
          </Link>

          <Link
            href="/admin/registrations?filter=pending"
            className="flex items-center justify-between rounded-lg border border-white/10 bg-black/40 p-4 transition hover:border-accentGold/30 hover:bg-black/60"
          >
            <span className="text-sm font-medium text-white">View Pending Approvals</span>
            <Clock className="h-4 w-4 text-white/70" />
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="mb-4 font-[var(--font-playfair)] text-xl tracking-tight">Recent Activity</h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Latest Delegate Registrations */}
          <div className="rounded-lg border border-white/10 bg-black/40">
            <div className="border-b border-white/10 p-4">
              <h3 className="font-semibold text-white">Latest Delegate Registrations</h3>
            </div>
            <div className="divide-y divide-white/10">
              {recentStudents.length === 0 ? (
                <div className="p-4 text-center text-sm text-white/70">No delegate registrations yet</div>
              ) : (
                recentStudents.map((student) => (
                  <div key={student.id} className="p-4 transition hover:bg-white/5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-white">
                          {student.displayName || (student.email ? student.email.split("@")[0] : "Account")}
                        </p>
                        <p className="mt-1 text-xs text-white/70">{student.email || "—"}</p>
                      </div>
                      <p className="text-xs text-white/50">{formatDate(student.createdAt)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="border-t border-white/10 p-4">
              <Link
                href="/admin/registrations?tab=users"
                className="flex items-center justify-center gap-2 text-sm text-accentGold transition hover:text-accentGold/80"
              >
                View All Delegates
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Recent Course Enrollments */}
          <div className="rounded-lg border border-white/10 bg-black/40">
            <div className="border-b border-white/10 p-4">
              <h3 className="font-semibold text-white">Recent Course Enrollments</h3>
            </div>
            <div className="divide-y divide-white/10">
              {recentEnrollments.length === 0 ? (
                <div className="p-4 text-center text-sm text-white/70">No course enrollments yet</div>
              ) : (
                recentEnrollments.map((registration) => {
                  const course = coursesMap.get(registration.courseId);
                  return (
                    <div key={registration.id} className="p-4 transition hover:bg-white/5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="font-medium text-white">{registration.name}</p>
                          <p className="mt-1 text-xs text-white/70">{course?.title || registration.courseId}</p>
                          <p className="mt-1 text-xs text-white/50">{formatDate(registration.createdAt)}</p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2 py-1 text-xs font-semibold capitalize ${getStatusBadgeColor(
                            registration.status
                          )}`}
                        >
                          {registration.status}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div className="border-t border-white/10 p-4">
              <Link
                href="/admin/registrations?tab=enrollments"
                className="flex items-center justify-center gap-2 text-sm text-accentGold transition hover:text-accentGold/80"
              >
                View All Enrollments
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
