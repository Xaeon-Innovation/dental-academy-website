"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createCase } from "@/lib/actions/case";
import CaseForm from "@/components/admin/CaseForm";
import type { CaseFormData } from "@/lib/validations/case";

export default function NewCasePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function handleSubmit(data: CaseFormData) {
    setSaving(true);
    const result = await createCase(data);
    if (result.success) {
      router.push("/admin/cases");
    }
    setSaving(false);
    return result;
  }

  function handleCancel() {
    router.push("/admin/cases");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[var(--font-playfair)] text-2xl tracking-tight">
          Create New Case
        </h1>
        <p className="mt-2 text-sm text-white/70">
          Add a new clinical case with multiple images
        </p>
      </div>

      <div className="rounded-lg border border-white/10 bg-black/40 p-6">
        <CaseForm onSubmit={handleSubmit} onCancel={handleCancel} />
      </div>
    </div>
  );
}
