"use client";

import type { CourseBatch } from "@/types/course";
import { CourseEnquiryForm } from "@/components/CourseEnquiryForm";

/** Course detail sidebar: same behaviour as `CourseEnquiryForm` with `batches` (kept for a stable import path). */
export function CourseBatchEnquiry({
  courseId,
  courseSlug,
  batches,
  courseDuration,
  courseLocation,
}: {
  courseId: string;
  courseSlug: string;
  batches: CourseBatch[];
  courseDuration?: string;
  courseLocation?: string;
}) {
  return (
    <CourseEnquiryForm
      courseId={courseId}
      courseSlug={courseSlug}
      batches={batches}
      courseDuration={courseDuration}
      courseLocation={courseLocation}
      batchPickerVariant="sidebar"
    />
  );
}
