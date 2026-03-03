import { notFound } from "next/navigation";
import { getCaseById, updateCase } from "@/lib/actions/case";
import CaseForm from "@/components/admin/CaseForm";
import type { CaseFormData } from "@/lib/validations/case";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditCasePage({ params }: Props) {
  const { id } = await params;
  const caseItem = await getCaseById(id);

  if (!caseItem) {
    notFound();
  }

  async function handleSubmit(data: CaseFormData) {
    "use server";
    try {
      return await updateCase(id, data);
    } catch (err) {
      console.error("Error in handleSubmit:", err);
      return {
        success: false as const,
        error: err instanceof Error ? err.message : "An unexpected error occurred",
      };
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[var(--font-playfair)] text-2xl tracking-tight">
          Edit Case
        </h1>
        <p className="mt-2 text-sm text-white/70">
          Update case information and photo
        </p>
      </div>
      <CaseForm caseItem={caseItem} onSubmit={handleSubmit} />
    </div>
  );
}
