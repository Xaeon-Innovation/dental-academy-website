"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { getInstructors, deleteInstructor } from "@/lib/actions/instructor";
import type { Instructor } from "@/types/instructor";

export default function AdminInstructorsPage() {
  const router = useRouter();
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; instructor: Instructor | null }>({
    open: false,
    instructor: null,
  });

  useEffect(() => {
    loadInstructors();
  }, []);

  async function loadInstructors() {
    setLoading(true);
    try {
      const data = await getInstructors();
      setInstructors(data);
    } catch (err) {
      console.error("Failed to load instructors:", err);
    } finally {
      setLoading(false);
    }
  }

  function handleDeleteClick(instructor: Instructor) {
    setDeleteDialog({ open: true, instructor });
  }

  async function handleDeleteConfirm() {
    if (!deleteDialog.instructor) return;

    const result = await deleteInstructor(deleteDialog.instructor.id);
    if (result.success) {
      setDeleteDialog({ open: false, instructor: null });
      loadInstructors();
    } else {
      alert("Failed to delete instructor: " + result.error);
    }
  }

  const filteredInstructors = instructors.filter((instructor) =>
    instructor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    instructor.credentials.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[var(--font-playfair)] text-2xl tracking-tight">
            Manage Instructors
          </h1>
          <p className="mt-2 text-sm text-white/70">
            Create and manage course instructors
          </p>
        </div>
        <Link
          href="/admin/instructors/new"
          className="flex items-center gap-2 rounded-lg bg-accentGold px-4 py-2 text-sm font-semibold text-background transition hover:bg-accentGold/90"
        >
          <Plus className="h-4 w-4" />
          Add New Instructor
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
        <input
          type="text"
          placeholder="Search instructors..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-black/40 px-10 py-2 text-white placeholder:text-white/40 focus:border-accentGold/50 focus:outline-none"
        />
      </div>

      {/* Instructors List */}
      {loading ? (
        <div className="py-12 text-center text-white/70">Loading instructors...</div>
      ) : filteredInstructors.length === 0 ? (
        <div className="rounded-lg border border-white/10 bg-black/40 px-6 py-12 text-center">
          <p className="text-white/70">
            {searchQuery ? "No instructors found matching your search." : "No instructors yet. Create your first instructor!"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredInstructors.map((instructor) => (
            <div
              key={instructor.id}
              className="rounded-lg border border-white/10 bg-black/40 p-4 transition hover:border-accentGold/30"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-white">{instructor.name}</h3>
                  <p className="mt-1 text-xs text-accentGold/90">{instructor.credentials}</p>
                  <p className="mt-2 line-clamp-2 text-xs text-white/70">{instructor.bio}</p>
                  {instructor.badges && instructor.badges.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {instructor.badges.slice(0, 2).map((badge) => (
                        <span
                          key={badge}
                          className="rounded-full border border-white/10 px-2 py-0.5 text-xs text-white/70"
                        >
                          {badge}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="ml-2 flex gap-1">
                  <Link
                    href={`/admin/instructors/${instructor.id}`}
                    className="rounded p-1.5 text-white/70 transition hover:bg-white/10 hover:text-white"
                    title="Edit instructor"
                  >
                    <Edit className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => handleDeleteClick(instructor)}
                    className="rounded p-1.5 text-white/70 transition hover:bg-red-500/20 hover:text-red-400"
                    title="Delete instructor"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Dialog */}
      {deleteDialog.open && deleteDialog.instructor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-lg border border-white/10 bg-background p-6 shadow-xl">
            <h2 className="font-[var(--font-playfair)] text-xl font-semibold text-white">
              Delete Instructor
            </h2>
            <p className="mt-3 text-sm text-white/70">
              Are you sure you want to delete <strong className="text-white">{deleteDialog.instructor.name}</strong>?
              This action cannot be undone.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setDeleteDialog({ open: false, instructor: null })}
                className="flex-1 rounded-lg border border-white/10 bg-black/40 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
