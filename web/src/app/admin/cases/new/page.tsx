import { createCase } from "@/lib/actions/case";
import CaseForm from "@/components/admin/CaseForm";
import type { CaseFormData } from "@/lib/validations/case";

export default function NewCasePage() {
  async function handleSubmit(data: CaseFormData) {
    "use server";
    try {
      return await createCase(data);
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
          Add New Case
        </h1>
        <p className="mt-2 text-sm text-white/70">
          Upload a photo and add details for a new case study
        </p>
      </div>
      <CaseForm onSubmit={handleSubmit} />
    </div>
  );
}
