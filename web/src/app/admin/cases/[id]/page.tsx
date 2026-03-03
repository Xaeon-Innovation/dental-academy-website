"use client";

import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { getCaseById, updateCase } from "@/lib/actions/case";
import CaseForm from "@/components/admin/CaseForm";
import type { CaseFormData } from "@/lib/validations/case";
import type { Case } from "@/types/case";

export default function EditCasePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [caseItem, setCaseItem] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadCase() {
      if (!id) return;
      const data = await getCaseById(id);
      setCaseItem(data);
      setLoading(false);
    }
    loadCase();
  }, [id]);

  async function handleSubmit(data: CaseFormData) {
    if (!id) return { success: false, error: "Case ID is required" };
    setSaving(true);
    const result = await updateCase(id, data);
    if (result.success) {
      router.push("/admin/cases");
    }
    setSaving(false);
    return result;
  }

  function handleCancel() {
    router.push("/admin/cases");
  }

  if (loading) {
    return (
      <div className="py-12 text-center text-white/70">Loading case...</div>
    );
  }

  if (!caseItem) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-[var(--font-playfair)] text-2xl tracking-tight">
            Case Not Found
          </h1>
          <p className="mt-2 text-sm text-white/70">
            The case you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[var(--font-playfair)] text-2xl tracking-tight">
          Edit Case
        </h1>
        <p className="mt-2 text-sm text-white/70">
          Update case information and manage images
        </p>
      </div>

      <div className="rounded-lg border border-white/10 bg-black/40 p-6">
        <CaseForm caseItem={caseItem} onSubmit={handleSubmit} onCancel={handleCancel} />
      </div>
    </div>
  );
}
