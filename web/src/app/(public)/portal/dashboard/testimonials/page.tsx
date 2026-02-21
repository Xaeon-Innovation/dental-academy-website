"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import {
  getRegistrationsByUserId,
  getStudentProfile,
} from "@/lib/actions/student";
import { getCourses } from "@/lib/actions/course";
import {
  getTestimonialsByUserId,
  createOrUpdateTestimonial,
} from "@/lib/actions/testimonial";
import type { Registration } from "@/types/registration";
import type { Course } from "@/types/course";
import type { Testimonial } from "@/types/testimonial";
import StudentDashboardGuard from "../StudentDashboardGuard";
import LoadingScreen from "@/components/LoadingScreen";
import { Star } from "lucide-react";

function formatSlug(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function PortalTestimonialsPage() {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState<
    (Registration & { id: string })[]
  >([]);
  const [testimonials, setTestimonials] = useState<(Testimonial & { id: string })[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [profile, setProfile] = useState<{ displayName?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingCourseId, setSavingCourseId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getRegistrationsByUserId(user.uid),
      getTestimonialsByUserId(user.uid),
      getCourses(),
      getStudentProfile(user.uid),
    ]).then(([regs, tests, coursesData, p]) => {
      setRegistrations(regs);
      setTestimonials(tests);
      setCourses(coursesData);
      setProfile(p ?? null);
      setLoading(false);
    });
  }, [user]);

  const courseById = new Map(courses.map((c) => [c.id, c]));
  const testimonialByCourseId = new Map(
    testimonials.map((t) => [t.courseId, t])
  );

  const eligibleRegistrations = registrations.filter(
    (r) => r.status === "confirmed" || r.status === "completed"
  );

  const defaultDisplayName =
    profile?.displayName?.trim() ||
    user?.email?.split("@")[0] ||
    "Student";

  return (
    <StudentDashboardGuard>
      <div className="min-h-screen bg-background px-4 py-16 text-white md:py-20">
        <div className="mx-auto max-w-3xl">
          <header className="mb-10">
            <h1 className="font-[var(--font-playfair)] text-3xl tracking-tight md:text-4xl">
              Testimonials
            </h1>
            <p className="mt-2 text-sm text-white/70">
              Leave a review for courses you’ve been confirmed or completed. One testimonial per course. It may be shown on the home page.
            </p>
            <div className="mt-4 flex flex-col gap-3">
              <Link
                href="/portal/dashboard"
                className="inline-block text-xs font-semibold uppercase tracking-[0.18em] text-white/60 transition hover:text-accentGold/80"
              >
                ← Dashboard
              </Link>
            </div>
          </header>

          {error && (
            <div className="mb-6 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          {loading ? (
            <LoadingScreen />
          ) : eligibleRegistrations.length === 0 ? (
            <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <p className="text-sm text-white/60">
                You can leave a testimonial once you have a confirmed or completed enrollment.{" "}
                <Link href="/portal/dashboard" className="text-accentGold hover:underline">
                  Back to dashboard
                </Link>
              </p>
            </section>
          ) : (
            <div className="space-y-8">
              {eligibleRegistrations.map((reg) => {
                const course = courseById.get(reg.courseId);
                const existing = testimonialByCourseId.get(reg.courseId);
                return (
                  <TestimonialForm
                    key={reg.id}
                    courseTitle={
                      course?.title ||
                      (reg.courseSlug ? formatSlug(reg.courseSlug) : reg.courseId)
                    }
                    courseId={reg.courseId}
                    existing={existing}
                    defaultDisplayName={defaultDisplayName}
                    saving={savingCourseId === reg.courseId}
                    onSave={async (payload) => {
                      if (!user) return;
                      setError(null);
                      setSavingCourseId(reg.courseId);
                      const result = await createOrUpdateTestimonial(
                        user.uid,
                        reg.courseId,
                        payload
                      );
                      setSavingCourseId(null);
                      if (result.success) {
                        const updated = await getTestimonialsByUserId(user.uid);
                        setTestimonials(updated);
                      } else {
                        setError(result.error);
                      }
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </StudentDashboardGuard>
  );
}

function TestimonialForm({
  courseTitle,
  courseId,
  existing,
  defaultDisplayName,
  saving,
  onSave,
}: {
  courseTitle: string;
  courseId: string;
  existing: (Testimonial & { id: string }) | undefined;
  defaultDisplayName: string;
  saving: boolean;
  onSave: (payload: {
    rating: number;
    quote: string;
    displayName?: string;
  }) => Promise<void>;
}) {
  const [rating, setRating] = useState(existing?.rating ?? 5);
  const [quote, setQuote] = useState(existing?.quote ?? "");
  const [displayName, setDisplayName] = useState(
    existing?.displayName?.trim() || defaultDisplayName
  );

  useEffect(() => {
    if (existing) {
      setRating(existing.rating);
      setQuote(existing.quote);
      setDisplayName(existing.displayName?.trim() || defaultDisplayName);
    } else {
      setDisplayName(defaultDisplayName);
    }
  }, [existing, defaultDisplayName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedQuote = quote.trim();
    if (!trimmedQuote) return;
    onSave({
      rating,
      quote: trimmedQuote,
      displayName: displayName.trim() || undefined,
    });
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
      <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-accentGold">
        {courseTitle}
      </h2>
      <p className="mt-1 text-xs text-white/60">
        {existing
          ? "Edit your testimonial below. It appears on the home page."
          : "Add a short review and star rating. It may be shown on the home page."}
      </p>
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <p className="mb-2 text-xs font-medium text-white/70">Rating</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                className="rounded p-1 transition hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-accentGold/50"
                aria-label={`${value} star${value === 1 ? "" : "s"}`}
              >
                <Star
                  className={`h-8 w-8 ${
                    value <= rating
                      ? "fill-accentGold text-accentGold"
                      : "text-white/30"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
        <div>
          <label
            htmlFor={`quote-${courseId}`}
            className="mb-1 block text-xs font-medium text-white/70"
          >
            Your testimonial
          </label>
          <textarea
            id={`quote-${courseId}`}
            rows={4}
            value={quote}
            onChange={(e) => setQuote(e.target.value)}
            required
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-accentGold/50 focus:outline-none"
            placeholder="A short paragraph about your experience..."
            disabled={saving}
          />
        </div>
        <div>
          <label
            htmlFor={`displayName-${courseId}`}
            className="mb-1 block text-xs font-medium text-white/70"
          >
            Display name (e.g. Dr. Smith)
          </label>
          <input
            id={`displayName-${courseId}`}
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-accentGold/50 focus:outline-none"
            placeholder="How you’d like to be shown"
            disabled={saving}
          />
        </div>
        <button
          type="submit"
          disabled={saving || !quote.trim()}
          className="rounded-lg bg-accentGold px-5 py-2.5 text-sm font-semibold text-background transition hover:bg-accentGold/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Saving…" : existing ? "Update testimonial" : "Submit testimonial"}
        </button>
      </form>
    </section>
  );
}
