import type { Metadata } from "next";
import { getCourses } from "@/lib/actions/course";
import CoursesClient from "./CoursesClient";

export const metadata: Metadata = {
  title: "Courses | Kaleidoscope Dental Academy",
  description:
    "iPlace, iRestore and Full Arch dental implant training. Structured education with hands-on and live surgical elements.",
  keywords: [
    "iPlace course",
    "iRestore course",
    "dental implant training",
    "implant course UK",
  ],
};

export default async function CoursesPage() {
  const courses = await getCourses();
  
  // Filter to only show open courses
  const openCourses = courses.filter((course) => course.status === "open");

  return <CoursesClient courses={openCourses} />;
}
