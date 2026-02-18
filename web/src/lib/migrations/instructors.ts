"use server";

import { INSTRUCTORS } from "@/lib/constants/instructors";
import { getCourseDetail } from "@/lib/constants/courses";
import { COURSES } from "@/lib/constants/courses";
import { createInstructor } from "@/lib/actions/instructor";
import type { InstructorFormData } from "@/lib/validations/instructor";

export async function migrateInstructorsToFirestore(): Promise<{
  success: boolean;
  message: string;
  migrated: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let migrated = 0;

  // Build a map of instructor data from course details (more complete info)
  const instructorMap = new Map<string, { bio: string; badges: string[] }>();
  
  // Extract instructor data from all course details
  for (const course of COURSES) {
    const detail = getCourseDetail(course.slug);
    if (detail) {
      if (detail.instructors) {
        for (const instructor of detail.instructors) {
          if (!instructorMap.has(instructor.name)) {
            instructorMap.set(instructor.name, {
              bio: instructor.bio,
              badges: instructor.badges || [],
            });
          }
        }
      }
      if (detail.instructor) {
        if (!instructorMap.has(detail.instructor.name)) {
          instructorMap.set(detail.instructor.name, {
            bio: detail.instructor.bio,
            badges: detail.instructor.badges || [],
          });
        }
      }
    }
  }

  try {
    for (const instructor of INSTRUCTORS) {
      try {
        // Use detailed bio from course details if available, otherwise use tagline
        const detailedInfo = instructorMap.get(instructor.name);
        
        const instructorData: InstructorFormData = {
          name: instructor.name,
          credentials: instructor.credentials,
          bio:
            detailedInfo?.bio ||
            instructor.tagline ||
            `${instructor.name} - ${instructor.credentials}`,
          badges: detailedInfo?.badges || [],
          // imageUrl in constants is a relative path (e.g. "/images/..."),
          // but the Zod schema expects a full URL, so we leave it empty.
          imageUrl: "",
        };

        const result = await createInstructor(instructorData);
        
        if (result.success) {
          migrated++;
        } else {
          errors.push(`${instructor.name}: ${result.error}`);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        errors.push(`${instructor.name}: ${message}`);
      }
    }

    return {
      success: errors.length === 0,
      message: `Migrated ${migrated} of ${INSTRUCTORS.length} instructors`,
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
