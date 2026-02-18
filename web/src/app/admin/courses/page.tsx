"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, Edit, Trash2, Eye } from "lucide-react";
import { getCourses, deleteCourse } from "@/lib/actions/course";
import type { Course } from "@/types/course";
import DeleteCourseDialog from "@/components/admin/DeleteCourseDialog";

export default function AdminCoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; course: Course | null }>({
    open: false,
    course: null,
  });

  useEffect(() => {
    loadCourses();
  }, []);

  async function loadCourses() {
    setLoading(true);
    try {
      const data = await getCourses();
      setCourses(data);
    } catch (err) {
      console.error("Failed to load courses:", err);
    } finally {
      setLoading(false);
    }
  }

  function handleDeleteClick(course: Course) {
    setDeleteDialog({ open: true, course });
  }

  async function handleDeleteConfirm() {
    if (!deleteDialog.course) return;

    const result = await deleteCourse(deleteDialog.course.id);
    if (result.success) {
      setDeleteDialog({ open: false, course: null });
      loadCourses();
    } else {
      alert("Failed to delete course: " + result.error);
    }
  }

  const filteredCourses = courses.filter((course) =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[var(--font-playfair)] text-2xl tracking-tight">
            Manage Courses
          </h1>
          <p className="mt-2 text-sm text-white/70">
            Create, edit, and manage your courses
          </p>
        </div>
        <Link
          href="/admin/courses/new"
          className="flex items-center gap-2 rounded-lg bg-accentGold px-4 py-2 text-sm font-semibold text-background transition hover:bg-accentGold/90"
        >
          <Plus className="h-4 w-4" />
          Add New Course
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
        <input
          type="text"
          placeholder="Search courses..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-black/40 px-10 py-2 text-white placeholder:text-white/40 focus:border-accentGold/50 focus:outline-none"
        />
      </div>

      {/* Courses List */}
      {loading ? (
        <div className="py-12 text-center text-white/70">Loading courses...</div>
      ) : filteredCourses.length === 0 ? (
        <div className="rounded-lg border border-white/10 bg-black/40 px-6 py-12 text-center">
          <p className="text-white/70">
            {searchQuery ? "No courses found matching your search." : "No courses yet. Create your first course!"}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-white/10 bg-black/40">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/70">
                  Title
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/70">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/70">
                  Date Range
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/70">
                  Location
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-white/70">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredCourses.map((course) => (
                <tr key={course.id} className="transition hover:bg-white/5">
                  <td className="px-4 py-4">
                    <div>
                      <p className="font-medium text-white">{course.title}</p>
                      <p className="mt-1 text-xs text-white/50">{course.slug}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${
                        course.status === "open"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {course.status === "open" ? "Open" : "Closed"}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-white/70">
                    {course.dateRange || "—"}
                  </td>
                  <td className="px-4 py-4 text-sm text-white/70">
                    {course.location ? (
                      <span className="line-clamp-1 max-w-xs">{course.location}</span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/courses/${course.slug}`}
                        target="_blank"
                        className="rounded p-1.5 text-white/70 transition hover:bg-white/10 hover:text-white"
                        title="View course"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <Link
                        href={`/admin/courses/${course.id}`}
                        className="rounded p-1.5 text-white/70 transition hover:bg-white/10 hover:text-white"
                        title="Edit course"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDeleteClick(course)}
                        className="rounded p-1.5 text-white/70 transition hover:bg-red-500/20 hover:text-red-400"
                        title="Delete course"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <DeleteCourseDialog
        open={deleteDialog.open}
        course={deleteDialog.course}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteDialog({ open: false, course: null })}
      />
    </div>
  );
}
