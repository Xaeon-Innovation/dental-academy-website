"use client";

import type { Case } from "@/types/case";

interface DeleteCaseDialogProps {
  open: boolean;
  caseItem: Case | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteCaseDialog({
  open,
  caseItem,
  onConfirm,
  onCancel,
}: DeleteCaseDialogProps) {
  if (!open || !caseItem) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-lg border border-white/10 bg-background p-6 shadow-xl">
        <h2 className="font-[var(--font-playfair)] text-xl font-semibold text-white">
          Delete Case
        </h2>
        <p className="mt-3 text-sm text-white/70">
          Are you sure you want to delete <strong className="text-white">{caseItem.title}</strong>?
          This action cannot be undone.
        </p>
        <div className="mt-6 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg border border-white/10 bg-black/40 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
