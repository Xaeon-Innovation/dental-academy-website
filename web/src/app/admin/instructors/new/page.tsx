import { createInstructor } from "@/lib/actions/instructor";
import InstructorForm from "@/components/admin/InstructorForm";
import type { InstructorFormData } from "@/lib/validations/instructor";

export default function NewInstructorPage() {
  async function handleSubmit(data: InstructorFormData) {
    "use server";
    return await createInstructor(data);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[var(--font-playfair)] text-2xl tracking-tight">
          Create New Instructor
        </h1>
        <p className="mt-2 text-sm text-white/70">
          Add a new instructor to your database
        </p>
      </div>
      <InstructorForm onSubmit={handleSubmit} />
    </div>
  );
}
