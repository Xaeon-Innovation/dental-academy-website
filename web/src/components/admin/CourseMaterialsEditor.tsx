"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { getSettings, updateSettings } from "@/lib/actions/settings";
import { getCourses } from "@/lib/actions/course";
import type { Course } from "@/types/course";

type MaterialLink = { title: string; url: string };

export default function CourseMaterialsEditor() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [materials, setMaterials] = useState<Record<string, MaterialLink[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    Promise.all([getCourses(), getSettings()])
      .then(([c, s]) => {
        if (!mounted) return;
        setCourses(c);
        setMaterials((s.courseMaterials as Record<string, MaterialLink[]>) ?? {});
        const first = c[0]?.id ?? "";
        setSelectedCourseId((prev) => prev || first);
      })
      .catch((e) => {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : "Failed to load materials.");
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const selectedList = useMemo(() => materials[selectedCourseId] ?? [], [materials, selectedCourseId]);

  function setSelectedList(next: MaterialLink[]) {
    setMaterials((prev) => ({ ...prev, [selectedCourseId]: next }));
  }

  function addLink() {
    setSelectedList([...selectedList, { title: "", url: "" }]);
  }

  function removeLink(index: number) {
    setSelectedList(selectedList.filter((_, i) => i !== index));
  }

  async function save() {
    setError(null);
    setSuccess(null);

    const cleaned: Record<string, MaterialLink[]> = {};
    for (const [courseId, list] of Object.entries(materials)) {
      const next = (list ?? [])
        .map((x) => ({ title: x.title?.trim() ?? "", url: x.url?.trim() ?? "" }))
        .filter((x) => x.title && x.url);
      if (next.length) cleaned[courseId] = next;
    }

    startSaving(async () => {
      const res = await updateSettings({ courseMaterials: cleaned });
      if (!res.success) {
        setError(res.error);
        return;
      }
      setMaterials(cleaned);
      setSuccess("Course materials saved.");
    });
  }

  return (
    <section className="rounded-lg border border-white/10 bg-black/40 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-accentGold">
            Course materials
          </h2>
          <p className="mt-1 text-xs text-white/60">
            Links shown to approved past delegates in the portal. Add external PDF/Drive links.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void save()}
          disabled={loading || saving}
          className="inline-flex items-center gap-2 rounded-lg bg-accentGold px-4 py-2 text-sm font-semibold text-background transition hover:bg-accentGold/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving…" : "Save"}
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}
      {success && (
        <div className="mt-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {success}
        </div>
      )}

      <div className="mt-5 grid gap-4 md:grid-cols-[260px_minmax(0,1fr)]">
        <div>
          <label className="mb-1 block text-xs font-semibold text-white/70">Course</label>
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-accentGold/50 focus:outline-none"
            aria-label="Select course to edit materials"
            disabled={loading}
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
            {courses.length === 0 && <option value="">No courses</option>}
          </select>
          <p className="mt-2 text-[11px] text-white/50">
            Materials are keyed by course ID.
          </p>
        </div>

        <div className="min-w-0">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
              Links
            </p>
            <button
              type="button"
              onClick={addLink}
              disabled={loading || !selectedCourseId}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs font-semibold text-white/80 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus className="h-4 w-4" />
              Add link
            </button>
          </div>

          {selectedCourseId ? (
            selectedList.length === 0 ? (
              <p className="mt-3 text-sm text-white/60">No links yet for this course.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {selectedList.map((item, idx) => (
                  <div
                    key={idx}
                    className="grid gap-2 rounded-lg border border-white/10 bg-black/20 p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_auto]"
                  >
                    <input
                      value={item.title}
                      onChange={(e) => {
                        const next = [...selectedList];
                        next[idx] = { ...next[idx], title: e.target.value };
                        setSelectedList(next);
                      }}
                      placeholder="Title (e.g. Workbook PDF)"
                      className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-accentGold/50 focus:outline-none"
                    />
                    <input
                      value={item.url}
                      onChange={(e) => {
                        const next = [...selectedList];
                        next[idx] = { ...next[idx], url: e.target.value };
                        setSelectedList(next);
                      }}
                      placeholder="https://…"
                      className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-accentGold/50 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => removeLink(idx)}
                      className="inline-flex items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-red-300 transition hover:bg-red-500/20"
                      aria-label="Remove link"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )
          ) : (
            <p className="mt-3 text-sm text-white/60">Select a course to edit its materials.</p>
          )}
        </div>
      </div>
    </section>
  );
}

