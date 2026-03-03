"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, Edit, Trash2, Eye } from "lucide-react";
import { getCases, deleteCase } from "@/lib/actions/case";
import type { Case } from "@/types/case";
import DeleteCaseDialog from "@/components/admin/DeleteCaseDialog";

export default function AdminCasesPage() {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; caseItem: Case | null }>({
    open: false,
    caseItem: null,
  });

  useEffect(() => {
    loadCases();
  }, []);

  async function loadCases() {
    setLoading(true);
    try {
      const data = await getCases();
      setCases(data);
    } catch (err) {
      console.error("Failed to load cases:", err);
    } finally {
      setLoading(false);
    }
  }

  function handleDeleteClick(caseItem: Case) {
    setDeleteDialog({ open: true, caseItem });
  }

  async function handleDeleteConfirm() {
    if (!deleteDialog.caseItem) return;

    const result = await deleteCase(deleteDialog.caseItem.id);
    if (result.success) {
      setDeleteDialog({ open: false, caseItem: null });
      loadCases();
    } else {
      alert("Failed to delete case: " + result.error);
    }
  }

  function getPrimaryImage(caseItem: Case): string | null {
    if (!caseItem.images || caseItem.images.length === 0) return null;
    const index = caseItem.primaryImageIndex ?? 0;
    return caseItem.images[index] || caseItem.images[0] || null;
  }

  const filteredCases = cases.filter((caseItem) =>
    caseItem.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[var(--font-playfair)] text-2xl tracking-tight">
            Manage Cases
          </h1>
          <p className="mt-2 text-sm text-white/70">
            Create, edit, and manage clinical cases with multiple images
          </p>
        </div>
        <Link
          href="/admin/cases/new"
          className="flex items-center gap-2 rounded-lg bg-accentGold px-4 py-2 text-sm font-semibold text-background transition hover:bg-accentGold/90"
        >
          <Plus className="h-4 w-4" />
          Add New Case
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
        <input
          type="text"
          placeholder="Search cases..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-black/40 px-10 py-2 text-white placeholder:text-white/40 focus:border-accentGold/50 focus:outline-none"
        />
      </div>

      {/* Cases List */}
      {loading ? (
        <div className="py-12 text-center text-white/70">Loading cases...</div>
      ) : filteredCases.length === 0 ? (
        <div className="rounded-lg border border-white/10 bg-black/40 px-6 py-12 text-center">
          <p className="text-white/70">
            {searchQuery ? "No cases found matching your search." : "No cases yet. Create your first case!"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCases.map((caseItem) => {
            const primaryImage = getPrimaryImage(caseItem);
            const imageCount = caseItem.images?.length || 0;
            
            return (
              <div
                key={caseItem.id}
                className="group relative overflow-hidden rounded-lg border border-white/10 bg-black/40 transition hover:border-accentGold/50"
              >
                {primaryImage ? (
                  <div className="aspect-video overflow-hidden bg-white/5">
                    <img
                      src={primaryImage}
                      alt={caseItem.title}
                      className="h-full w-full object-cover transition group-hover:scale-105"
                    />
                  </div>
                ) : (
                  <div className="aspect-video bg-white/5 flex items-center justify-center">
                    <p className="text-white/50 text-sm">No image</p>
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-white line-clamp-2 flex-1">{caseItem.title}</h3>
                    {imageCount > 1 && (
                      <span className="text-xs text-white/50 bg-white/10 px-2 py-1 rounded">
                        {imageCount} images
                      </span>
                    )}
                  </div>
                  {caseItem.description && (
                    <p className="mt-2 text-sm text-white/70 line-clamp-2">{caseItem.description}</p>
                  )}
                  <div className="mt-4 flex items-center justify-end gap-2">
                    {primaryImage && (
                      <a
                        href={primaryImage}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded p-1.5 text-white/70 transition hover:bg-white/10 hover:text-white"
                        title="View primary image"
                      >
                        <Eye className="h-4 w-4" />
                      </a>
                    )}
                    <Link
                      href={`/admin/cases/${caseItem.id}`}
                      className="rounded p-1.5 text-white/70 transition hover:bg-white/10 hover:text-white"
                      title="Edit case"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => handleDeleteClick(caseItem)}
                      className="rounded p-1.5 text-white/70 transition hover:bg-red-500/20 hover:text-red-400"
                      title="Delete case"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <DeleteCaseDialog
        open={deleteDialog.open}
        caseItem={deleteDialog.caseItem}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteDialog({ open: false, caseItem: null })}
      />
    </div>
  );
}
