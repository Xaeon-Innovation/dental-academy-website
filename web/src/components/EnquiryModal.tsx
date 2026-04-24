"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { submitEnquiry } from "@/lib/actions/enquiry";
import type { CourseBatch } from "@/types/course";
import { EnquiryBatchPicker } from "@/components/EnquiryBatchPicker";

export type EnquiryCourseOption = {
  id: string;
  slug: string;
  title: string;
  batches?: CourseBatch[];
  courseDuration?: string;
  courseLocation?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  courseOptions?: EnquiryCourseOption[];
  fixedCourse?: EnquiryCourseOption;
};

export function EnquiryModal({
  open,
  onClose,
  title,
  subtitle,
  courseOptions,
  fixedCourse,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  const resolvedCourse: EnquiryCourseOption | null = useMemo(() => {
    if (fixedCourse) return fixedCourse;
    if (!courseOptions?.length) return null;
    return courseOptions.find((c) => c.id === selectedCourseId) ?? null;
  }, [courseOptions, fixedCourse, selectedCourseId]);

  const batchSig = resolvedCourse?.batches?.map((b) => b.id).join("|") ?? "";
  const [selectedBatchId, setSelectedBatchId] = useState("");

  useEffect(() => {
    if (!resolvedCourse?.batches?.length) {
      setSelectedBatchId("");
      return;
    }
    const first = resolvedCourse.batches[0]?.id ?? "";
    setSelectedBatchId((prev) => {
      const ids = new Set(resolvedCourse.batches!.map((b) => b.id));
      return prev && ids.has(prev) ? prev : first;
    });
  }, [resolvedCourse?.id, batchSig]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    setDone(false);
    setError(null);
    if (!fixedCourse) setSelectedCourseId("");
  }, [open, fixedCourse]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!resolvedCourse) {
      setError("Please select a course.");
      return;
    }
    if (resolvedCourse.batches?.length && !selectedBatchId) {
      setError("Please choose a batch.");
      return;
    }
    setBusy(true);
    const batches = resolvedCourse.batches;
    const selectedBatch =
      batches?.length && selectedBatchId ? (batches.find((b) => b.id === selectedBatchId) ?? null) : null;
    if (batches?.length && !selectedBatch) {
      setBusy(false);
      setError("Please choose a batch.");
      return;
    }
    const displayDuration = (
      selectedBatch?.duration ||
      resolvedCourse.courseDuration ||
      ""
    ).trim();
    const displayLocation = (
      selectedBatch?.location ||
      resolvedCourse.courseLocation ||
      ""
    ).trim();

    const result = await submitEnquiry({
      fullName,
      email,
      phone,
      message,
      interestedCourseId: resolvedCourse.id,
      interestedCourseSlug: resolvedCourse.slug,
      ...(selectedBatch
        ? {
            batchId: selectedBatch.id,
            batchLabel: selectedBatch.label,
            batchDateRange: selectedBatch.dateRange,
            ...(displayDuration ? { batchDuration: displayDuration } : {}),
            ...(displayLocation ? { batchLocation: displayLocation } : {}),
          }
        : {}),
    });
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setDone(true);
    setFullName("");
    setEmail("");
    setPhone("");
    setMessage("");
    if (!fixedCourse) setSelectedCourseId("");
  }

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="enquiry-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0B0B0D] p-5 text-left shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 id="enquiry-modal-title" className="text-lg font-semibold text-white">
              {title}
            </h3>
            {subtitle ? (
              <p className="mt-1 text-xs text-white/60">{subtitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
            aria-label="Close enquiry modal"
          >
            x
          </button>
        </div>

        {done ? (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-3 text-sm text-emerald-200">
            Thanks. Your enquiry was sent successfully.
          </div>
        ) : (
          <form className="space-y-2.5" onSubmit={onSubmit}>
            {!fixedCourse ? (
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                required
                aria-label="Select a course"
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
              >
                <option value="">Select course</option>
                {(courseOptions ?? []).map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            ) : (
              <div className="rounded-lg border border-accentGold/20 bg-accentGold/5 px-3 py-2 text-sm text-white/90">
                Enquiring about <span className="font-medium text-white">{fixedCourse.title}</span>
              </div>
            )}
            {resolvedCourse?.batches && resolvedCourse.batches.length > 0 ? (
              <EnquiryBatchPicker
                batches={resolvedCourse.batches}
                selectedBatchId={selectedBatchId}
                onSelectBatchId={setSelectedBatchId}
                courseDuration={resolvedCourse.courseDuration}
                courseLocation={resolvedCourse.courseLocation}
                variant="inline"
              />
            ) : null}
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Full name"
              required
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
            />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone"
              required
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
            />
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={2}
              placeholder="Question (optional)"
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
            />
            {error && <p className="text-xs text-red-300">{error}</p>}
            <button
              type="submit"
              disabled={busy || (!fixedCourse && !(courseOptions?.length))}
              className="w-full rounded-full border border-accentGold bg-accentGold px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-background disabled:opacity-60"
            >
              {busy ? "Sending..." : "Submit enquiry"}
            </button>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}

