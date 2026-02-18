import { createCourse } from "@/lib/actions/course";
import CourseForm from "@/components/admin/CourseForm";
import type { CourseFormData } from "@/lib/validations/course";

export default function NewCoursePage() {
  async function handleSubmit(data: CourseFormData) {
    "use server";
    return await createCourse(data);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[var(--font-playfair)] text-2xl tracking-tight">
          Create New Course
        </h1>
        <p className="mt-2 text-sm text-white/70">
          Add a new course to your catalog
        </p>
      </div>
      <CourseForm onSubmit={handleSubmit} />
    </div>
  );
}
