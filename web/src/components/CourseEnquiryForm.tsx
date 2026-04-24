"use client";

import { useEffect, useMemo, useState } from "react";
import { submitEnquiry } from "@/lib/actions/enquiry";
import type { CourseBatch } from "@/types/course";
import { EnquiryBatchPicker } from "@/components/EnquiryBatchPicker";

type CourseEnquiryFormProps = {
  courseId: string;
  courseSlug: string;
  className?: string;
  /** When set, batch choice is managed inside the form (preferred for all entry points). */
  batches?: CourseBatch[];
  courseDuration?: string;
  courseLocation?: string;
  /** @deprecated Use `batches` + internal picker; kept for callers that still pass a fixed batch. */
  batchId?: string;
  batchLabel?: string;
  batchDateRange?: string;
  batchDuration?: string;
  batchLocation?: string;
  /** Picker layout: matches course sidebar vs modal/card backgrounds. */
  batchPickerVariant?: "sidebar" | "inline";
  /** When both are set (with `batches`), batch choice is controlled by the parent (e.g. sidebar pricing sync). */
  syncSelectedBatchId?: string;
  onSyncSelectedBatchIdChange?: (id: string) => void;
};

export function CourseEnquiryForm({
  courseId,
  courseSlug,
  className,
  batches,
  courseDuration,
  courseLocation,
  batchId: fixedBatchId,
  batchLabel: fixedBatchLabel,
  batchDateRange: fixedBatchDateRange,
  batchDuration: fixedBatchDuration,
  batchLocation: fixedBatchLocation,
  batchPickerVariant = "inline",
  syncSelectedBatchId,
  onSyncSelectedBatchIdChange,
}: CourseEnquiryFormProps) {
  const hasBatches = Boolean(batches && batches.length > 0);
  const batchSig = batches?.map((b) => b.id).join("|") ?? "";
  const isBatchSynced =
    hasBatches && typeof syncSelectedBatchId === "string" && typeof onSyncSelectedBatchIdChange === "function";

  const [internalBatchId, setInternalBatchId] = useState(() => batches?.[0]?.id ?? "");
  useEffect(() => {
    if (isBatchSynced || !hasBatches || !batches?.length) return;
    setInternalBatchId((prev) => {
      const ids = new Set(batches.map((b) => b.id));
      if (prev && ids.has(prev)) return prev;
      return batches[0]?.id ?? "";
    });
  }, [courseId, batchSig, hasBatches, batches, isBatchSynced]);

  const selectedBatchId = isBatchSynced ? syncSelectedBatchId : internalBatchId;
  const setSelectedBatchId = isBatchSynced ? onSyncSelectedBatchIdChange : setInternalBatchId;

  const selectedFromList = useMemo(
    () => (hasBatches ? batches!.find((b) => b.id === selectedBatchId) ?? null : null),
    [batches, hasBatches, selectedBatchId]
  );

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (hasBatches && batches?.length && !selectedFromList) {
      setError("Please choose a batch.");
      return;
    }
    setBusy(true);

    let batchPayload: {
      batchId?: string;
      batchLabel?: string;
      batchDateRange?: string;
      batchDuration?: string;
      batchLocation?: string;
    } = {};

    if (hasBatches && selectedFromList) {
      const displayDuration = (selectedFromList.duration || courseDuration || "").trim();
      const displayLocation = (selectedFromList.location || courseLocation || "").trim();
      batchPayload = {
        batchId: selectedFromList.id,
        batchLabel: selectedFromList.label,
        batchDateRange: selectedFromList.dateRange,
        ...(displayDuration ? { batchDuration: displayDuration } : {}),
        ...(displayLocation ? { batchLocation: displayLocation } : {}),
      };
    } else {
      batchPayload = {
        ...(fixedBatchId ? { batchId: fixedBatchId } : {}),
        ...(fixedBatchLabel ? { batchLabel: fixedBatchLabel } : {}),
        ...(fixedBatchDateRange ? { batchDateRange: fixedBatchDateRange } : {}),
        ...(fixedBatchDuration ? { batchDuration: fixedBatchDuration } : {}),
        ...(fixedBatchLocation ? { batchLocation: fixedBatchLocation } : {}),
      };
    }

    const result = await submitEnquiry({
      fullName,
      email,
      phone,
      message,
      interestedCourseId: courseId,
      interestedCourseSlug: courseSlug,
      ...batchPayload,
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
  }

  return (
    <div className={className ?? "mt-5 rounded-xl border border-accentGold/20 bg-accentGold/5 p-4"}>
      {hasBatches && batches ? (
        <EnquiryBatchPicker
          batches={batches}
          selectedBatchId={selectedBatchId}
          onSelectBatchId={setSelectedBatchId}
          courseDuration={courseDuration}
          courseLocation={courseLocation}
          variant={batchPickerVariant}
        />
      ) : null}
      <p className={`text-xs text-white/70 ${hasBatches ? "mt-4" : "mt-1"}`}>
        Send your details and our team will contact you with course info.
      </p>
      {done ? (
        <div className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
          Thanks. Your enquiry was sent successfully.
        </div>
      ) : (
        <form className="mt-3 space-y-2.5" onSubmit={onSubmit}>
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
            disabled={busy}
            className="w-full rounded-full border border-accentGold bg-accentGold px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-background disabled:opacity-60"
          >
            {busy ? "Sending..." : "Submit enquiry"}
          </button>
        </form>
      )}
    </div>
  );
}
