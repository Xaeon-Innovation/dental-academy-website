import { notFound } from "next/navigation";
import { getCourseById, updateCourse } from "@/lib/actions/course";
import CourseForm from "@/components/admin/CourseForm";
import type { CourseFormData } from "@/lib/validations/course";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditCoursePage({ params }: Props) {
  const { id } = await params;
  const course = await getCourseById(id);

  if (!course) {
    notFound();
  }

  async function handleSubmit(data: CourseFormData) {
    "use server";
    return await updateCourse(id, data);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[var(--font-playfair)] text-2xl tracking-tight">
          Edit Course
        </h1>
        <p className="mt-2 text-sm text-white/70">
          Update course information
        </p>
      </div>
      <CourseForm course={course} onSubmit={handleSubmit} />
    </div>
  );
}
