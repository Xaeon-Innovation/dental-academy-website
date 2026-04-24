"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { EnquiryModal, type EnquiryCourseOption } from "@/components/EnquiryModal";

export function HomeCtaButtons({ availableCourses = [] }: { availableCourses?: EnquiryCourseOption[] }) {
  const { user, loading, isAdmin } = useAuth();
  const isStudent = !loading && user && !isAdmin;
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/courses"
          className="btn-liquid inline-flex items-center gap-2 px-8 py-3 text-sm font-semibold uppercase tracking-[0.16em]"
        >
          View courses
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
        {isStudent ? (
          <Link
            href="/portal/dashboard"
            className="btn-liquid inline-flex items-center gap-2 px-8 py-3 text-sm font-semibold uppercase tracking-[0.16em]"
          >
            Dashboard
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => {
              setOpen(true);
            }}
            className="btn-liquid inline-flex items-center gap-2 px-8 py-3 text-sm font-semibold uppercase tracking-[0.16em]"
          >
            Enquire now
          </button>
        )}
      </div>

      <EnquiryModal
        open={open}
        onClose={() => setOpen(false)}
        title="Quick enquiry"
        subtitle="Submit your details and select a course. Our team will contact you."
        courseOptions={availableCourses}
      />
    </>
  );
}
