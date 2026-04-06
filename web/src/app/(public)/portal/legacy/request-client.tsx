"use client";

import { useMemo, useState } from "react";
import { submitLegacyAccessRequest } from "@/lib/actions/legacyAccess";

type CourseOption = { id: string; title: string };

export default function LegacyAccessRequestClient({ courses }: { courses: CourseOption[] }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return (
      fullName.trim().length >= 2 &&
      email.trim().length > 3 &&
      phone.trim().length >= 6 &&
      selectedCourseIds.length > 0 &&
      !busy
    );
  }, [fullName, email, phone, selectedCourseIds.length, busy]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const res = await submitLegacyAccessRequest({
      fullName,
      email,
      phone,
      requestedCourseIds: selectedCourseIds,
    });
    setBusy(false);
    if (!res.success) {
      setError(res.error);
      return;
    }
    setDone(true);
    setFullName("");
    setEmail("");
    setPhone("");
    setSelectedCourseIds([]);
  }

  function toggleCourse(courseId: string) {
    setSelectedCourseIds((prev) =>
      prev.includes(courseId) ? prev.filter((id) => id !== courseId) : [...prev, courseId]
    );
  }

  if (done) {
    return (
      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
        Thanks — your request was submitted. We’ll verify your attendance and email you when access is
        approved.
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs text-white/70">Full name</label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white placeholder:text-white/40 focus:border-accentGold/50 focus:outline-none"
            placeholder="Dr. Jane Smith"
            autoComplete="name"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-white/70">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white placeholder:text-white/40 focus:border-accentGold/50 focus:outline-none"
            placeholder="you@example.com"
            autoComplete="email"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-white/70">Phone</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white placeholder:text-white/40 focus:border-accentGold/50 focus:outline-none"
            placeholder="+44 …"
            autoComplete="tel"
          />
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
          Courses attended
        </p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {courses.map((c) => {
            const checked = selectedCourseIds.includes(c.id);
            return (
              <label
                key={c.id}
                className="flex cursor-pointer items-start gap-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/80 hover:bg-white/5"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleCourse(c.id)}
                  className="mt-0.5 rounded border-white/20"
                />
                <span className="leading-snug">{c.title}</span>
              </label>
            );
          })}
          {courses.length === 0 && (
            <p className="text-sm text-white/60 sm:col-span-2">
              No open courses are configured yet. Please contact support.
            </p>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-red-300">{error}</p>}

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full rounded-full border-2 border-accentGold bg-accentGold px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-background transition hover:bg-accentGold/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? "Submitting…" : "Request access"}
      </button>
    </form>
  );
}

