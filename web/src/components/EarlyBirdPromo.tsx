"use client";

import { useMemo, useState } from "react";
import type { Course } from "@/types/course";
import { EarlyBirdBanner, pickLowestEarlyBirdCourse } from "@/components/EarlyBirdBanner";
import { EnquiryModal, type EnquiryCourseOption } from "@/components/EnquiryModal";

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

export function EarlyBirdPromo({ courses, className }: { courses: Course[]; className?: string }) {
  const pick = useMemo(() => pickLowestEarlyBirdCourse(courses), [courses]);
  const [open, setOpen] = useState(false);

  const fixedCourse = pick?.course ? toOption(pick.course) : undefined;

  if (!pick) return null;

  return (
    <>
      <EarlyBirdBanner
        courses={courses}
        className={className}
        onEnquire={() => setOpen(true)}
      />
      {fixedCourse ? (
        <EnquiryModal
          open={open}
          onClose={() => setOpen(false)}
          title={`Enquire about ${fixedCourse.title}`}
          subtitle="Share your details and our team will contact you shortly."
          fixedCourse={fixedCourse}
        />
      ) : null}
    </>
  );
}

