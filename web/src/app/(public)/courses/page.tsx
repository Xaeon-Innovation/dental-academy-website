import { getCourses } from "@/lib/actions/course";
import CoursesClient from "./CoursesClient";

export default async function CoursesPage() {
  const courses = await getCourses();
  
  // Filter to only show open courses
  const openCourses = courses.filter((course) => course.status === "open");

  return <CoursesClient courses={openCourses} />;
}
