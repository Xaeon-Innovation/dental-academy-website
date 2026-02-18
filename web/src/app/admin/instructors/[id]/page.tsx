import { notFound } from "next/navigation";
import { getInstructorById, updateInstructor } from "@/lib/actions/instructor";
import InstructorForm from "@/components/admin/InstructorForm";
import type { InstructorFormData } from "@/lib/validations/instructor";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditInstructorPage({ params }: Props) {
  const { id } = await params;
  const instructor = await getInstructorById(id);

  if (!instructor) {
    notFound();
  }

  async function handleSubmit(data: InstructorFormData) {
    "use server";
    return await updateInstructor(id, data);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[var(--font-playfair)] text-2xl tracking-tight">
          Edit Instructor
        </h1>
        <p className="mt-2 text-sm text-white/70">
          Update instructor information
        </p>
      </div>
      <InstructorForm instructor={instructor} onSubmit={handleSubmit} />
    </div>
  );
}
