"use client";

import { useState, useEffect } from "react";
import {
  updateRegistrationStatus,
  setSpecialRequestExtraFees,
  adminSetRegistrationAmountDue,
} from "@/lib/actions/registration";
import { computeRegistrationTotal, formatPrice, getRegistrationTotalBreakdown } from "@/lib/pricing";
import type { StudentProfile } from "@/types/student";
import type { Registration, RegistrationStatus } from "@/types/registration";
import type { Course } from "@/types/course";

interface RegistrationDetailsDialogProps {
  open: boolean;
  type: "student" | "enrollment";
  student?: StudentProfile & { id: string };
  registration?: Registration & { id: string };
  course?: Course;
  onClose: () => void;
  onStatusUpdate?: () => void;
  /** Called after extra fees are set successfully (e.g. close dialog and switch to enrollments tab). */
  onFeesSet?: () => void;
  /** Required for admin to set extra fees on special requests. */
  getToken?: () => Promise<string>;
  /** Admin: delete delegate after confirmation in dialog. */
  onDeleteStudent?: (
    student: StudentProfile & { id: string }
  ) => Promise<{ success: true } | { success: false; error: string }>;
}

export default function RegistrationDetailsDialog({
  open,
  type,
  student,
  registration,
  course,
  onClose,
  onStatusUpdate,
  onFeesSet,
  getToken,
  onDeleteStudent,
}: RegistrationDetailsDialogProps) {
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [extraFeesPounds, setExtraFeesPounds] = useState("");
  const [settingFees, setSettingFees] = useState(false);
  const [feesError, setFeesError] = useState<string | null>(null);
  const [manualTotalPounds, setManualTotalPounds] = useState("");
  const [settingManualTotal, setSettingManualTotal] = useState(false);
  const [manualTotalError, setManualTotalError] = useState<string | null>(null);
  const [deletingDelegate, setDeletingDelegate] = useState(false);
  const [delegateDeleteError, setDelegateDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setDelegateDeleteError(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open || type !== "enrollment" || !registration) return;
    setManualTotalError(null);
    if (registration.amountDueCents != null && registration.amountDueCents > 0) {
      setManualTotalPounds((registration.amountDueCents / 100).toFixed(2));
    } else {
      const comp = course ? computeRegistrationTotal(registration, course) : null;
      setManualTotalPounds(comp && comp.total > 0 ? comp.total.toFixed(2) : "");
    }
  }, [open, type, registration?.id, registration?.amountDueCents, course?.id]);

  if (!open) return null;

  async function handleStatusChange(newStatus: RegistrationStatus) {
    if (!registration) return;

    setUpdatingStatus(true);
    setStatusError(null);

    try {
      const result = await updateRegistrationStatus(registration.id, newStatus);
      if (result.success) {
        if (onStatusUpdate) {
          onStatusUpdate();
        }
      } else {
        setStatusError(result.error || "Failed to update status");
      }
    } catch (err) {
      setStatusError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  }

  /** Admin sees "Confirmed" only when payment is paid. */
  function effectiveStatusForAdmin(reg: Registration): RegistrationStatus | "pending" {
    if (reg.paymentStatus === "paid") return reg.status;
    if (reg.status === "confirmed") return "pending";
    return reg.status;
  }

  function getStatusBadgeColor(status: RegistrationStatus | "pending"): string {
    switch (status) {
      case "pending":
        return "bg-yellow-500/20 text-yellow-400";
      case "confirmed":
        return "bg-green-500/20 text-green-400";
      case "cancelled":
        return "bg-red-500/20 text-red-400";
      case "completed":
        return "bg-blue-500/20 text-blue-400";
      default:
        return "bg-white/10 text-white/70";
    }
  }

  function formatDate(date: Date | undefined): string {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg border border-white/10 bg-background p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-[var(--font-playfair)] text-xl font-semibold text-white">
            {type === "student" ? "Delegate Details" : "Enrollment Details"}
          </h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-white/70 transition hover:bg-white/10 hover:text-white"
            title="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {type === "student" && student ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-white/70">Name</label>
                <p className="mt-1 text-white">{student.displayName || student.email.split("@")[0] || "—"}</p>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-white/70">Email</label>
                <p className="mt-1 text-white">{student.email || "—"}</p>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-white/70">Phone</label>
                <p className="mt-1 text-white">{student.phone || "—"}</p>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-white/70">User ID</label>
                <p className="mt-1 text-sm text-white/70 font-mono">{student.uid || student.id}</p>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-white/70">Sign-up Date</label>
                <p className="mt-1 text-white">{formatDate(student.createdAt)}</p>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-white/70">Last Updated</label>
                <p className="mt-1 text-white">{formatDate(student.updatedAt)}</p>
              </div>
            </div>
          </div>
        ) : type === "enrollment" && registration ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-white/70">Delegate Name</label>
                <p className="mt-1 text-white">{registration.name}</p>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-white/70">Email</label>
                <p className="mt-1 text-white">{registration.email}</p>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-white/70">Phone</label>
                <p className="mt-1 text-white">{registration.phone || "—"}</p>
              </div>
              {registration.enrollmentNote ? (
                <div className="col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-white/70">
                    Delegate message
                  </label>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-white/90">{registration.enrollmentNote}</p>
                </div>
              ) : null}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-white/70">Course</label>
                <p className="mt-1 text-white">{course?.title || registration.courseId}</p>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-white/70">Status</label>
                <select
                  value={effectiveStatusForAdmin(registration)}
                  onChange={(e) => handleStatusChange(e.target.value as RegistrationStatus)}
                  disabled={updatingStatus}
                  title={registration.paymentStatus !== "paid" ? "Confirmed only after payment" : "Update enrollment status"}
                  className={`mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white capitalize transition ${
                    updatingStatus ? "opacity-50 cursor-not-allowed" : "hover:border-accentGold/50 focus:border-accentGold/50 focus:outline-none"
                  } ${getStatusBadgeColor(effectiveStatusForAdmin(registration))}`}
                >
                  <option value="pending">
                    {registration.status === "confirmed" && registration.paymentStatus !== "paid"
                      ? "Pending payment"
                      : "Pending"}
                  </option>
                  <option value="confirmed" disabled={registration.paymentStatus !== "paid"}>
                    Confirmed
                  </option>
                  <option value="cancelled">Cancelled</option>
                  <option value="completed">Completed</option>
                </select>
                {statusError && (
                  <p className="mt-1 text-xs text-red-400">{statusError}</p>
                )}
                {updatingStatus && (
                  <p className="mt-1 text-xs text-white/50">Updating status...</p>
                )}
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-white/70">Enrollment Date</label>
                <p className="mt-1 text-white">{formatDate(registration.createdAt)}</p>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-white/70">Amount due</label>
                <p className="mt-1 text-white">
                  {registration.amountDueCents != null
                    ? formatPrice((registration.amountDueCents ?? 0) / 100)
                    : (course ? (computeRegistrationTotal(registration, course)?.formattedTotal ?? "On request") : "On request")}
                </p>
              </div>
              {(() => {
                const breakdown = getRegistrationTotalBreakdown(registration, course);
                return breakdown ? (
                  <div className="col-span-2 rounded border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/80">
                    {breakdown.earlyBird ? <p>Early bird = {breakdown.earlyBird}</p> : null}
                    {breakdown.standard ? <p>Standard = {breakdown.standard}</p> : null}
                    {breakdown.singleOccupancy ? <p>Single occupancy = {breakdown.singleOccupancy}</p> : null}
                    {breakdown.specialRequest ? <p>Special request = {breakdown.specialRequest}</p> : null}
                    <p className="mt-1 font-medium text-white">Total = {breakdown.total}</p>
                  </div>
                ) : null;
              })()}
              {getToken && registration.paymentStatus !== "paid" && (
                <div className="col-span-2 rounded-lg border border-white/15 bg-white/5 p-4">
                  <label className="text-xs font-semibold uppercase tracking-wider text-white/70">
                    Total due (manual)
                  </label>
                  <p className="mt-1 text-xs text-white/50">
                    Override the amount the delegate pays. New Stripe checkouts use this value. Not available after
                    payment is recorded.
                  </p>
                  <div className="mt-3 flex flex-wrap items-end gap-3">
                    <div>
                      <label htmlFor="admin-manual-total-gbp" className="block text-xs text-white/60">
                        Amount (£)
                      </label>
                      <input
                        id="admin-manual-total-gbp"
                        type="number"
                        min="0"
                        step="0.01"
                        value={manualTotalPounds}
                        onChange={(e) => {
                          setManualTotalPounds(e.target.value);
                          setManualTotalError(null);
                        }}
                        className="mt-1 w-36 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                        placeholder="0.00"
                        title="Total amount due in GBP"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={settingManualTotal}
                      onClick={async () => {
                        const pounds = parseFloat(manualTotalPounds);
                        if (Number.isNaN(pounds) || pounds < 0) {
                          setManualTotalError("Enter a valid amount (0 or more).");
                          return;
                        }
                        setSettingManualTotal(true);
                        setManualTotalError(null);
                        try {
                          const token = await getToken();
                          const result = await adminSetRegistrationAmountDue(
                            registration.id,
                            Math.round(pounds * 100),
                            token
                          );
                          if (result.success) {
                            await onStatusUpdate?.();
                          } else {
                            setManualTotalError(result.error ?? "Failed to update total");
                          }
                        } catch {
                          setManualTotalError("Failed to update total");
                        } finally {
                          setSettingManualTotal(false);
                        }
                      }}
                      className="rounded-lg bg-accentGold px-4 py-2 text-sm font-semibold text-background hover:bg-accentGold/90 disabled:opacity-50"
                    >
                      {settingManualTotal ? "Saving…" : "Save total"}
                    </button>
                  </div>
                  {manualTotalError && (
                    <p className="mt-2 text-xs text-red-400">{manualTotalError}</p>
                  )}
                </div>
              )}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-white/70">Payment status</label>
                <p className="mt-1 text-white">
                  {registration.paymentStatus === "paid" && "Paid"}
                  {registration.paymentStatus === "unpaid" && "Unpaid"}
                  {registration.paymentStatus === "failed" && "Failed"}
                  {registration.paymentStatus === "refunded" && "Refunded"}
                  {!registration.paymentStatus && "—"}
                </p>
                {registration.paymentStatus === "paid" && registration.paidAt && (
                  <p className="mt-0.5 text-xs text-white/60">Paid at {formatDate(registration.paidAt)}</p>
                )}
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-white/70">Country</label>
                <p className="mt-1 text-white">{registration.country || "—"}</p>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-white/70">Current Role</label>
                <p className="mt-1 text-white">{registration.currentRole || "—"}</p>
              </div>
              {registration.yearsExperience !== undefined && (
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-white/70">
                    Years Experience
                  </label>
                  <p className="mt-1 text-white">{registration.yearsExperience}</p>
                </div>
              )}
              {registration.gdcNumber && (
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-white/70">GDC Number</label>
                  <p className="mt-1 text-white">{registration.gdcNumber}</p>
                </div>
              )}
            </div>
            {registration.aspectsToDevelop && registration.aspectsToDevelop.length > 0 && (
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-white/70">
                  Aspects to Develop
                </label>
                <ul className="mt-1 list-inside list-disc text-white">
                  {registration.aspectsToDevelop.map((aspect, idx) => (
                    <li key={idx}>{aspect}</li>
                  ))}
                </ul>
              </div>
            )}
            {(registration.specialRequest || ((registration.amountDueCents == null || registration.amountDueCents === 0) && getToken)) && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
                {registration.specialRequest && (
                  <>
                    <label className="text-xs font-semibold uppercase tracking-wider text-amber-400/90">
                      Delegate special request
                    </label>
                    <p className="mt-2 text-sm text-white">{registration.specialRequest.description}</p>
                    <p className="mt-1 text-xs text-white/50">Status: {registration.specialRequest.status}</p>
                  </>
                )}
                {((registration.specialRequest?.status === "pending") || ((registration.amountDueCents == null || registration.amountDueCents === 0) && !registration.specialRequest)) && getToken && (
                  <>
                    <p className="mt-3 text-xs text-white/70">
                      {registration.specialRequest?.status === "pending"
                        ? "Set the extra fee amount below. The delegate&apos;s total will update in their dashboard and they can then confirm and pay."
                        : "Set the total amount the delegate should pay."}
                    </p>
                    <div className="mt-3 flex flex-wrap items-end gap-3">
                      <div>
                        <label className="block text-xs text-white/60">
                          {registration.specialRequest?.status === "pending" ? "Extra fees (£)" : "Set total due (£)"}
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={extraFeesPounds}
                          onChange={(e) => {
                            setExtraFeesPounds(e.target.value);
                            setFeesError(null);
                          }}
                          className="mt-1 w-28 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                          placeholder="0"
                        />
                      </div>
                      <button
                        type="button"
                        disabled={settingFees}
                        onClick={async () => {
                          const pounds = parseFloat(extraFeesPounds);
                          if (Number.isNaN(pounds) || pounds < 0) {
                            setFeesError("Enter a valid amount (e.g. 50 or 0)");
                            return;
                          }
                          setSettingFees(true);
                          setFeesError(null);
                          try {
                            const token = await getToken();
                            const result = await setSpecialRequestExtraFees(
                              registration.id,
                              Math.round(pounds * 100),
                              token
                            );
                            if (result.success) {
                              setExtraFeesPounds("");
                              await onStatusUpdate?.();
                              onFeesSet?.();
                            } else {
                              setFeesError(result.error ?? "Failed to set extra fees");
                            }
                          } catch {
                            setFeesError("Failed to set extra fees");
                          } finally {
                            setSettingFees(false);
                          }
                        }}
                        className="rounded-lg bg-accentGold px-4 py-2 text-sm font-semibold text-background hover:bg-accentGold/90 disabled:opacity-50"
                      >
                        {settingFees ? "Setting…" : "Set extra fees"}
                      </button>
                    </div>
                  </>
                )}
                {feesError && <p className="mt-2 text-xs text-red-400">{feesError}</p>}
                {!registration.specialRequest && (registration.amountDueCents == null || registration.amountDueCents === 0) && (
                  <p className="mt-2 text-xs text-white/50">For &quot;On request&quot; courses, set the total amount the delegate should pay.</p>
                )}
              </div>
            )}
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            {type === "student" && student && onDeleteStudent && getToken && (
              <button
                type="button"
                disabled={deletingDelegate}
                onClick={async () => {
                  const label = student.email || student.displayName || "this delegate";
                  if (
                    !confirm(
                      `Delete ${label} permanently?\n\nThis will remove their login, profile, and all course enrollments. This cannot be undone.`
                    )
                  ) {
                    return;
                  }
                  setDeletingDelegate(true);
                  setDelegateDeleteError(null);
                  try {
                    const result = await onDeleteStudent(student);
                    if (!result.success) {
                      setDelegateDeleteError(result.error);
                    }
                  } catch {
                    setDelegateDeleteError("Something went wrong.");
                  } finally {
                    setDeletingDelegate(false);
                  }
                }}
                className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
              >
                {deletingDelegate ? "Deleting…" : "Delete delegate"}
              </button>
            )}
            {delegateDeleteError && (
              <p className="mt-2 max-w-md text-xs text-red-400">{delegateDeleteError}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-accentGold px-4 py-2 text-sm font-semibold text-background transition hover:bg-accentGold/90"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
