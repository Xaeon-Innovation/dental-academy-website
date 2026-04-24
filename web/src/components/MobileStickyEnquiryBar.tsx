"use client";

import { useMemo, useState } from "react";
import type { Course } from "@/types/course";
import { EnquiryModal, type EnquiryCourseOption } from "@/components/EnquiryModal";

type Props = {
  courses?: Course[];
  fixedCourse?: Course;
  variant?: "home" | "courses" | "courseDetail";
};

function toOption(course: Course): EnquiryCourseOption {
  return {
    id: course.id,
    slug: course.slug,
    title: course.title,
    ...(course.batches?.length ? { batches: course.batches } : {}),
    ...(course.duration?.trim() ? { courseDuration: course.duration } : {}),
    ...(course.location?.trim() ? { courseLocation: course.location } : {}),
  };
}

export function MobileStickyEnquiryBar({ courses, fixedCourse, variant = "home" }: Props) {
  const [open, setOpen] = useState(false);

  const courseOptions = useMemo(() => {
    if (!courses?.length) return [];
    return courses
      .filter((c) => c.status === "open")
      .map(toOption);
  }, [courses]);

  const fixedOption = useMemo(() => (fixedCourse ? toOption(fixedCourse) : undefined), [fixedCourse]);

  const title =
    variant === "courseDetail"
      ? "Enquire about this course"
      : "Quick enquiry";

  const subtitle =
    variant === "courseDetail"
      ? "Share your details and our team will contact you shortly."
      : "Submit your details and select a course. Our team will contact you.";

  return (
    <>
      <div className="fixed bottom-0 left-0 z-[150] p-4 md:hidden [padding-bottom:calc(env(safe-area-inset-bottom,0px)+1rem)]">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center justify-center rounded-full border-2 border-accentGold bg-accentGold px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-background shadow-[0_18px_60px_rgba(0,0,0,0.35)] transition hover:border-accentGold/90 hover:bg-accentGold/90"
        >
          Enquire
        </button>
      </div>

      <EnquiryModal
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        subtitle={subtitle}
        courseOptions={fixedOption ? undefined : courseOptions}
        fixedCourse={fixedOption}
      />
    </>
  );
}

