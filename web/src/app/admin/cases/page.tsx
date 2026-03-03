"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, Edit, Trash2, Image as ImageIcon } from "lucide-react";
import { getCases, deleteCase } from "@/lib/actions/case";
import type { Case } from "@/types/case";
import DeleteCaseDialog from "@/components/admin/DeleteCaseDialog";

export default function AdminCasesPage() {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
    setError(null);
    try {
      const data = await getCases();
      // Ensure data is valid
      if (Array.isArray(data)) {
        setCases(data);
      } else {
        console.error("Invalid data received:", data);
        setError("Invalid data received from server");
        setCases([]);
      }
    } catch (err: any) {
      console.error("Failed to load cases:", err);
      
      // Handle different error types
      let errorMessage = "Failed to load cases. Please try again.";
      
      // Check for "Failed to fetch" error specifically
      if (err?.message?.includes("Failed to fetch") || err?.message?.includes("NetworkError")) {
        errorMessage = "Network error. Please check your connection and try again.";
      } else if (err?.message) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      } else if (err?.error) {
        errorMessage = err.error;
      }
      
      setError(errorMessage);
      setCases([]);
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

  const filteredCases = cases.filter((caseItem) =>
    caseItem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (caseItem.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[var(--font-playfair)] text-2xl tracking-tight">
            Manage Cases
          </h1>
          <p className="mt-2 text-sm text-white/70">
            Add, edit, and manage case study photos
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

      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3">
          <p className="text-sm text-red-400">{error}</p>
          <button
            onClick={loadCases}
            className="mt-2 text-xs text-red-300 underline hover:text-red-200"
          >
            Try again
          </button>
        </div>
      )}

      {/* Cases List */}
      {loading ? (
        <div className="py-12 text-center text-white/70">Loading cases...</div>
      ) : error ? (
        <div className="rounded-lg border border-white/10 bg-black/40 px-6 py-12 text-center">
          <p className="text-white/70 mb-4">{error}</p>
          <button
            onClick={loadCases}
            className="rounded-lg bg-accentGold px-4 py-2 text-sm font-semibold text-background transition hover:bg-accentGold/90"
          >
            Retry
          </button>
        </div>
      ) : filteredCases.length === 0 ? (
        <div className="rounded-lg border border-white/10 bg-black/40 px-6 py-12 text-center">
          <p className="text-white/70">
            {searchQuery ? "No cases found matching your search." : "No cases yet. Add your first case!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCases.map((caseItem) => (
            <div
              key={caseItem.id}
              className="group relative overflow-hidden rounded-lg border border-white/10 bg-black/40 transition hover:border-white/20"
            >
              {/* Image */}
              <div className="relative aspect-video w-full overflow-hidden bg-black/20">
                {(() => {
                  const images = caseItem.imageUrls?.length 
                    ? caseItem.imageUrls 
                    : caseItem.imageUrl 
                    ? [caseItem.imageUrl] 
                    : [];
                  
                  if (images.length === 0) {
                    return (
                      <div className="flex h-full items-center justify-center">
                        <ImageIcon className="h-12 w-12 text-white/20" />
                      </div>
                    );
                  }
                  
                  return (
                    <>
                      <img
                        src={images[0]}
                        alt={caseItem.title}
                        className="h-full w-full object-cover transition group-hover:scale-105"
                      />
                      {images.length > 1 && (
                        <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-xs text-white">
                          {images.length} images
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-semibold text-white line-clamp-1">{caseItem.title}</h3>
                {caseItem.description && (
                  <p className="mt-1 text-sm text-white/70 line-clamp-2">
                    {caseItem.description}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="absolute top-2 right-2 flex gap-2 opacity-0 transition group-hover:opacity-100">
                <Link
                  href={`/admin/cases/${caseItem.id}`}
                  className="rounded bg-black/60 p-1.5 text-white/70 backdrop-blur-sm transition hover:bg-black/80 hover:text-white"
                  title="Edit case"
                >
                  <Edit className="h-4 w-4" />
                </Link>
                <button
                  onClick={() => handleDeleteClick(caseItem)}
                  className="rounded bg-black/60 p-1.5 text-white/70 backdrop-blur-sm transition hover:bg-red-500/20 hover:text-red-400"
                  title="Delete case"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
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
