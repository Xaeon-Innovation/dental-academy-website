"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  activateEnquiryAndEnroll,
  getAllEnquiries,
  updateEnquiry,
} from "@/lib/actions/enquiry";
import { getCourses } from "@/lib/actions/course";
import type { Enquiry, EnquiryStatus } from "@/types/enquiry";
import type { Course } from "@/types/course";
import { safeContains } from "@/lib/identity";

const STATUS_ORDER: EnquiryStatus[] = [
  "new",
  "contacted",
  "qualified",
  "invited",
  "converted",
  "lost",
];

export default function AdminEnquiriesPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [search, setSearch] = useState("");
  const [activeStatus, setActiveStatus] = useState<EnquiryStatus | "all">("new");
  const [selected, setSelected] = useState<Enquiry | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [enq, c] = await Promise.all([getAllEnquiries(), getCourses()]);
      setEnquiries(enq);
      setCourses(c.filter((x) => x.status === "open"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    return enquiries.filter((e) => {
      if (activeStatus !== "all" && e.status !== activeStatus) return false;
      if (!search.trim()) return true;
      return (
        safeContains(e.fullName, search) ||
        safeContains(e.email, search) ||
        safeContains(e.phone, search) ||
        safeContains(e.interestedCourseSlug || "", search)
      );
    });
  }, [enquiries, activeStatus, search]);

  async function handleUpdateStatus(id: string, status: EnquiryStatus) {
    setError(null);
    setSaving(true);
    const result = await updateEnquiry({ id, status });
    setSaving(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    await load();
  }

  async function handleActivate() {
    if (!selected || !selectedCourseId || !user) return;
    setSaving(true);
    setError(null);
    const adminIdToken = await user.getIdToken();
    const result = await activateEnquiryAndEnroll({
      enquiryId: selected.id,
      courseId: selectedCourseId,
      adminIdToken,
    });
    setSaving(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setSelected(null);
    setSelectedCourseId("");
    await load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[var(--font-playfair)] text-2xl tracking-tight">Enquiries</h1>
        <p className="mt-2 text-sm text-white/70">
          Review enquiries, qualify leads, and activate approved delegates.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-2">
        <button
          onClick={() => setActiveStatus("all")}
          className={`rounded px-3 py-1.5 text-xs uppercase tracking-wider ${
            activeStatus === "all" ? "bg-accentGold/20 text-accentGold" : "text-white/70 hover:bg-white/5"
          }`}
        >
          All
        </button>
        {STATUS_ORDER.map((s) => (
          <button
            key={s}
            onClick={() => setActiveStatus(s)}
            className={`rounded px-3 py-1.5 text-xs uppercase tracking-wider ${
              activeStatus === s ? "bg-accentGold/20 text-accentGold" : "text-white/70 hover:bg-white/5"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, email, phone, course..."
          className="w-full rounded-lg border border-white/10 bg-black/40 px-10 py-2 text-white placeholder:text-white/40 focus:border-accentGold/50 focus:outline-none"
        />
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-white/70">Loading enquiries...</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-white/10 bg-black/40 px-6 py-10 text-center text-white/60">
          No enquiries found.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-white/10 bg-black/40">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-white/60">
                <th className="px-4 py-3">Lead</th>
                <th className="px-4 py-3">Interest</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filtered.map((e) => (
                <tr key={e.id} className="hover:bg-white/5">
                  <td className="px-4 py-3">
                    <p className="font-medium text-white">{e.fullName}</p>
                    <p className="text-xs text-white/60">{e.email}</p>
                    <p className="text-xs text-white/60">{e.phone}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-white/70">{e.interestedCourseSlug || "—"}</td>
                  <td className="px-4 py-3">
                    <select
                      value={e.status}
                      disabled={saving || e.status === "converted"}
                      onChange={(ev) => void handleUpdateStatus(e.id, ev.target.value as EnquiryStatus)}
                      aria-label={`Update status for ${e.fullName}`}
                      className="rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-xs capitalize text-white"
                    >
                      {STATUS_ORDER.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setSelected(e)}
                      disabled={e.status === "converted"}
                      className="inline-flex items-center gap-1 rounded border border-accentGold/40 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-accentGold hover:bg-accentGold/10 disabled:cursor-not-allowed disabled:border-white/15 disabled:text-white/40 disabled:hover:bg-transparent"
                    >
                      <Check className="h-3.5 w-3.5" />
                      {e.status === "converted" ? "Converted" : "Activate & Enroll"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-lg rounded-xl border border-white/10 bg-background p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-[var(--font-playfair)] text-xl text-white">Activate & Enroll</h2>
            <p className="mt-2 text-sm text-white/70">
              {selected.fullName} ({selected.email}) will be approved for portal access.
            </p>
            <label className="mt-4 block text-xs uppercase tracking-wider text-white/60">
              Select course
            </label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              aria-label="Select course for activation"
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
            >
              <option value="">Choose course...</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded border border-white/20 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedCourseId || saving}
                onClick={() => void handleActivate()}
                className="rounded bg-accentGold px-4 py-2 text-sm font-semibold text-background disabled:opacity-60"
              >
                {saving ? "Activating..." : "Approve & Create enrollment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
