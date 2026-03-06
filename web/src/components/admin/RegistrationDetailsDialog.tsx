"use client";

import { useState } from "react";
import { updateRegistrationStatus } from "@/lib/actions/registration";
import { computeRegistrationTotal } from "@/lib/pricing";
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
}

export default function RegistrationDetailsDialog({
  open,
  type,
  student,
  registration,
  course,
  onClose,
  onStatusUpdate,
}: RegistrationDetailsDialogProps) {
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

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

  function getStatusBadgeColor(status: RegistrationStatus): string {
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
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-white/70">Course</label>
                <p className="mt-1 text-white">{course?.title || registration.courseId}</p>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-white/70">Status</label>
                <select
                  value={registration.status}
                  onChange={(e) => handleStatusChange(e.target.value as RegistrationStatus)}
                  disabled={updatingStatus}
                  title="Update enrollment status"
                  className={`mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white capitalize transition ${
                    updatingStatus ? "opacity-50 cursor-not-allowed" : "hover:border-accentGold/50 focus:border-accentGold/50 focus:outline-none"
                  } ${getStatusBadgeColor(registration.status)}`}
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
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
              {course && (
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-white/70">Total</label>
                  <p className="mt-1 text-white">
                    {computeRegistrationTotal(registration, course)?.formattedTotal ?? "On request"}
                  </p>
                </div>
              )}
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
          </div>
        ) : null}

        <div className="mt-6 flex justify-end">
          <button
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
