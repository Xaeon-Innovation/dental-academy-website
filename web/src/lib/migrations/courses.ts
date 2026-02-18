"use server";

import { COURSES, courseDetails, getCourseDetail } from "@/lib/constants/courses";
import { createCourse } from "@/lib/actions/course";
import type { CourseFormData } from "@/lib/validations/course";

export async function migrateCoursesToFirestore(): Promise<{
  success: boolean;
  message: string;
  migrated: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let migrated = 0;

  try {
    for (const course of COURSES) {
      try {
        const detail = getCourseDetail(course.slug);
        
        // Combine basic course info with details
        const courseData: CourseFormData = {
          title: course.title,
          slug: course.slug,
          description: course.description,
          cpd: course.cpd,
          provider: course.provider,
          status: "open", // Default status
          order: COURSES.indexOf(course),
          ...(detail && {
            overview: detail.overview,
            learningPoints: detail.learningPoints,
            agenda: detail.agenda,
            requirements: detail.requirements,
            instructors: detail.instructors || (detail.instructor ? [detail.instructor] : undefined),
            registrationBadge: detail.registrationBadge,
            duration: detail.duration,
            location: detail.location,
            maxParticipants: detail.maxParticipants,
            dateRange: detail.dateRange,
            pricing: detail.pricing,
            packageIncludes: detail.packageIncludes,
          }),
        };

        const result = await createCourse(courseData);
        
        if (result.success) {
          migrated++;
        } else {
          errors.push(`${course.title}: ${result.error}`);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        errors.push(`${course.title}: ${message}`);
      }
    }

    return {
      success: errors.length === 0,
      message: `Migrated ${migrated} of ${COURSES.length} courses`,
      migrated,
      errors,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Migration failed";
    return {
      success: false,
      message,
      migrated,
      errors: [...errors, message],
    };
  }
}
