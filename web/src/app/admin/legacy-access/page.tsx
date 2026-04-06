"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Search, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getCourses } from "@/lib/actions/course";
import { safeContains } from "@/lib/identity";
import type { Course } from "@/types/course";
import type { LegacyAccessRequest, LegacyAccessRequestStatus } from "@/types/legacyAccess";
import {
  getAllLegacyAccessRequests,
  decideLegacyAccessRequestAsAdmin,
} from "@/lib/actions/legacyAccess";

const STATUS_ORDER: LegacyAccessRequestStatus[] = ["new", "approved", "rejected"];

export default function AdminLegacyAccessPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<LegacyAccessRequest[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [search, setSearch] = useState("");
  const [activeStatus, setActiveStatus] = useState<LegacyAccessRequestStatus | "all">("new");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<LegacyAccessRequest | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [req, c] = await Promise.all([getAllLegacyAccessRequests(), getCourses()]);
      setRequests(req);
      setCourses(c);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const courseById = useMemo(() => new Map(courses.map((c) => [c.id, c])), [courses]);

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      if (activeStatus !== "all" && r.status !== activeStatus) return false;
      if (!search.trim()) return true;
      return (
        safeContains(r.fullName, search) ||
        safeContains(r.email, search) ||
        safeContains(r.phone, search)
      );
    });
  }, [requests, activeStatus, search]);

  async function handleApprove(req: LegacyAccessRequest) {
    if (!user) return;
    setError(null);
    setSavingId(req.id);
    try {
      const token = await user.getIdToken();
      const upd = await decideLegacyAccessRequestAsAdmin({
        id: req.id,
        decision: "approve",
        adminIdToken: token,
      });
      if (!upd.success) setError(upd.error);

      await load();
      setSelected(null);
    } finally {
      setSavingId(null);
    }
  }

  async function handleReject(req: LegacyAccessRequest) {
    if (!user) return;
    setError(null);
    setSavingId(req.id);
    try {
      const token = await user.getIdToken();
      const upd = await decideLegacyAccessRequestAsAdmin({
        id: req.id,
        decision: "reject",
        adminIdToken: token,
      });
      if (!upd.success) setError(upd.error);
      await load();
      setSelected(null);
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[var(--font-playfair)] text-2xl tracking-tight">Legacy access</h1>
        <p className="mt-2 text-sm text-white/70">
          Approve past delegates so they can access course materials in the portal.
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
          placeholder="Search name, email, phone..."
          className="w-full rounded-lg border border-white/10 bg-black/40 px-10 py-2 text-white placeholder:text-white/40 focus:border-accentGold/50 focus:outline-none"
        />
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-white/70">Loading requests…</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-white/10 bg-black/40 px-6 py-10 text-center text-white/60">
          No requests found.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-white/10 bg-black/40">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-white/60">
                <th className="px-4 py-3">Delegate</th>
                <th className="px-4 py-3">Courses</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-white/5">
                  <td className="px-4 py-3">
                    <p className="font-medium text-white">{r.fullName}</p>
                    <p className="text-xs text-white/60">{r.email}</p>
                    <p className="text-xs text-white/60">{r.phone}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-white/70">
                    {r.requestedCourseIds.length
                      ? r.requestedCourseIds
                          .map((id) => courseById.get(id)?.title ?? id)
                          .join(", ")
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-sm capitalize text-white/70">{r.status}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setSelected(r)}
                      className="inline-flex items-center gap-1 rounded border border-accentGold/40 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-accentGold hover:bg-accentGold/10"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Review
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
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-[var(--font-playfair)] text-xl text-white">Review request</h2>
                <p className="mt-1 text-sm text-white/70">
                  {selected.fullName} ({selected.email})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-md p-2 text-white/70 hover:bg-white/10 hover:text-white"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-4 text-xs uppercase tracking-wider text-white/60">Courses requested</p>
            <p className="mt-1 text-sm text-white/80">
              {selected.requestedCourseIds.length
                ? selected.requestedCourseIds.map((id) => courseById.get(id)?.title ?? id).join(", ")
                : "—"}
            </p>
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
                disabled={savingId === selected.id || selected.status === "approved"}
                onClick={() => void handleReject(selected)}
                className="rounded border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-300 disabled:opacity-50"
              >
                {savingId === selected.id ? "Working…" : "Reject"}
              </button>
              <button
                type="button"
                disabled={savingId === selected.id || selected.status === "approved"}
                onClick={() => void handleApprove(selected)}
                className="rounded bg-accentGold px-4 py-2 text-sm font-semibold text-background disabled:opacity-60"
              >
                {savingId === selected.id ? "Approving…" : "Approve"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

