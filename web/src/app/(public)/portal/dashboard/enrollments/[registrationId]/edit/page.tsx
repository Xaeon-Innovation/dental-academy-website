"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getRegistrationByIdForUser } from "@/lib/actions/registration";
import { getCourseById } from "@/lib/actions/course";
import type { Registration } from "@/types/registration";
import type { CoursePricing } from "@/types/course";
import type { RegistrationFormData } from "@/lib/validations/registration";
import EnrollmentForm from "@/app/(public)/courses/[slug]/register/EnrollmentForm";
import StudentDashboardGuard from "@/app/(public)/portal/dashboard/StudentDashboardGuard";

function registrationToInitialData(reg: Registration & { id: string }): Partial<RegistrationFormData> {
  return {
    courseId: reg.courseId,
    courseSlug: reg.courseSlug ?? "",
    name: reg.name,
    email: reg.email,
    phone: reg.phone ?? "",
    country: reg.country,
    instagramHandle: reg.instagramHandle,
    currentRole: reg.currentRole,
    yearsExperience: reg.yearsExperience,
    primaryWorkSetting: reg.primaryWorkSetting,
    gdcNumber: reg.gdcNumber,
    hasPlacedImplants: reg.hasPlacedImplants,
    implantsPlacedCount: reg.implantsPlacedCount,
    hasRestoredCases: reg.hasRestoredCases,
    aspectsToDevelop: reg.aspectsToDevelop ?? [],
    preferredFormat: reg.preferredFormat,
    howDidYouHear: reg.howDidYouHear,
    whatAttractedYou: reg.whatAttractedYou,
    contactByWhatsApp: reg.contactByWhatsApp,
    consentContact: reg.consentContact,
    acceptedTerms: true,
    singleOccupancyUpgrade: reg.singleOccupancyUpgrade ?? false,
  };
}

type CourseForForm = { id: string; slug: string; title: string; pricing?: CoursePricing };

export default function EditEnrollmentPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const registrationId = params?.registrationId as string | undefined;
  const [registration, setRegistration] = useState<(Registration & { id: string }) | null | undefined>(undefined);
  const [course, setCourse] = useState<CourseForForm | null>(null);

  useEffect(() => {
    if (!user?.uid || !registrationId) {
      setRegistration(null);
      return;
    }
    let cancelled = false;
    getRegistrationByIdForUser(registrationId, user.uid).then((reg) => {
      if (cancelled) return;
      setRegistration(reg ?? null);
      if (reg?.courseId) {
        getCourseById(reg.courseId).then((c) => {
          if (cancelled) return;
          if (c) {
            setCourse({
              id: c.id,
              slug: c.slug,
              title: c.title,
              pricing: c.pricing,
            });
          } else {
            setCourse({
              id: reg.courseId,
              slug: reg.courseSlug ?? reg.courseId,
              title: reg.courseSlug
                ? reg.courseSlug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
                : "Course",
            });
          }
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [user?.uid, registrationId]);

  if (!user) {
    router.push("/portal");
    return null;
  }

  if (registration === undefined) {
    return (
      <StudentDashboardGuard>
        <div className="min-h-screen bg-background px-4 py-16 text-white md:py-20">
          <div className="mx-auto max-w-2xl">
            <p className="text-white/60">Loading…</p>
          </div>
        </div>
      </StudentDashboardGuard>
    );
  }

  if (!registration || registration.status !== "pending") {
    return (
      <StudentDashboardGuard>
        <div className="min-h-screen bg-background px-4 py-16 text-white md:py-20">
          <div className="mx-auto max-w-2xl">
            <p className="text-white/80">
              You cannot edit this enrollment. Only pending enrollments can be updated. Once your enrollment is confirmed, details cannot be changed.
            </p>
            <Link
              href="/portal/dashboard"
              className="mt-4 inline-block text-sm font-semibold uppercase tracking-wider text-accentGold hover:underline"
            >
              ← Back to dashboard
            </Link>
          </div>
        </div>
      </StudentDashboardGuard>
    );
  }

  if (!course) {
    return (
      <StudentDashboardGuard>
        <div className="min-h-screen bg-background px-4 py-16 text-white md:py-20">
          <div className="mx-auto max-w-2xl">
            <p className="text-white/60">Loading…</p>
          </div>
        </div>
      </StudentDashboardGuard>
    );
  }

  return (
    <StudentDashboardGuard>
      <div className="min-h-screen bg-background px-4 py-16 text-white md:py-20">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/portal/dashboard"
            className="mb-6 inline-block text-xs font-semibold uppercase tracking-[0.18em] text-accentGold transition hover:text-accentGold/80"
          >
            ← Back to dashboard
          </Link>
          <header className="mb-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accentGold">
              Update enrollment
            </p>
            <h1 className="mt-2 font-[var(--font-playfair)] text-3xl tracking-tight md:text-4xl">
              Edit your enrollment — {course.title}
            </h1>
            <p className="mt-2 text-sm text-white/70">
              You can update your details while your enrollment is still pending. After confirmation, changes are no longer possible.
            </p>
          </header>
          <EnrollmentForm
            course={course}
            initialData={registrationToInitialData(registration)}
            userId={user.uid}
            registrationId={registration.id}
            onSuccessRedirect="/portal/dashboard"
          />
        </div>
      </div>
    </StudentDashboardGuard>
  );
}
