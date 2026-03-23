"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Eye, Trash2, Download } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getAllStudents, deleteDelegateUser } from "@/lib/actions/student";
import { getAllRegistrations, updateRegistrationStatus, deleteRegistration } from "@/lib/actions/registration";
import { getCourses } from "@/lib/actions/course";
import { computeRegistrationTotal, formatPrice } from "@/lib/pricing";
import type { StudentProfile } from "@/types/student";
import type { Registration, RegistrationStatus } from "@/types/registration";
import type { Course } from "@/types/course";
import RegistrationDetailsDialog from "@/components/admin/RegistrationDetailsDialog";

type Tab = "users" | "enrollments";

function formatAmountDue(amountDueCents: number | undefined, reg: Registration, course: Course | undefined): string {
  if (amountDueCents != null && amountDueCents > 0) return formatPrice(amountDueCents / 100);
  const total = computeRegistrationTotal(reg, course ?? undefined);
  return total ? total.formattedTotal : "On request";
}

/** Admin sees "Confirmed" only when payment is paid; otherwise "Pending" (or "Pending payment") until then. */
function effectiveStatusForAdmin(reg: Registration): RegistrationStatus | "pending" {
  if (reg.paymentStatus === "paid") return reg.status;
  if (reg.status === "confirmed") return "pending";
  return reg.status;
}

export default function AdminRegistrationsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("users");
  const [students, setStudents] = useState<(StudentProfile & { id: string })[]>([]);
  const [registrations, setRegistrations] = useState<(Registration & { id: string })[]>([]);
  const [courses, setCourses] = useState<Map<string, Course>>(new Map());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingStudentId, setDeletingStudentId] = useState<string | null>(null);
  const [detailsDialog, setDetailsDialog] = useState<{
    open: boolean;
    type: "student" | "enrollment";
    student?: StudentProfile & { id: string };
    registration?: Registration & { id: string };
    course?: Course;
  }>({
    open: false,
    type: "student",
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData(): Promise<(Registration & { id: string })[] | undefined> {
    setLoading(true);
    try {
      const [studentsData, registrationsData, coursesData] = await Promise.all([
        getAllStudents(),
        getAllRegistrations(),
        getCourses(),
      ]);

      setStudents(studentsData);
      setRegistrations(registrationsData);

      const coursesMap = new Map<string, Course>();
      coursesData.forEach((course) => {
        coursesMap.set(course.id, course);
      });
      setCourses(coursesMap);
      return registrationsData;
    } catch (err) {
      console.error("Failed to load registrations data:", err);
      return undefined;
    } finally {
      setLoading(false);
    }
  }

  function formatDate(date: Date | undefined): string {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function getStatusBadgeColor(status: Registration["status"]): string {
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

  // Filtered students
  const filteredStudents = useMemo(() => {
    if (!searchQuery) return students;
    const query = searchQuery.toLowerCase();
    return students.filter(
      (student) =>
        student.displayName?.toLowerCase().includes(query) ||
        student.email.toLowerCase().includes(query) ||
        student.phone?.toLowerCase().includes(query)
    );
  }, [students, searchQuery]);

  // Filtered registrations
  const filteredRegistrations = useMemo(() => {
    if (!searchQuery) return registrations;
    const query = searchQuery.toLowerCase();
    return registrations.filter(
      (reg) =>
        reg.name.toLowerCase().includes(query) ||
        reg.email.toLowerCase().includes(query) ||
        courses.get(reg.courseId)?.title.toLowerCase().includes(query)
    );
  }, [registrations, courses, searchQuery]);

  async function runDeleteDelegate(
    student: StudentProfile & { id: string }
  ): Promise<{ success: true } | { success: false; error: string }> {
    const uid = student.uid || student.id;
    if (!user) {
      const err = "You must be signed in.";
      setUpdateError(err);
      return { success: false, error: err };
    }
    setDeletingStudentId(uid);
    setUpdateError(null);
    try {
      const token = (await user.getIdToken()) ?? "";
      const result = await deleteDelegateUser(uid, token);
      if (result.success) {
        await loadData();
        setDetailsDialog((prev) =>
          prev.open && prev.type === "student" && (prev.student?.uid === uid || prev.student?.id === uid)
            ? { open: false, type: "student" }
            : prev
        );
      } else {
        setUpdateError(result.error);
      }
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to delete user";
      setUpdateError(msg);
      return { success: false, error: msg };
    } finally {
      setDeletingStudentId(null);
    }
  }

  function handleDeleteStudentRow(student: StudentProfile & { id: string }) {
    const label = student.email || student.displayName || "this delegate";
    if (
      !confirm(
        `Delete ${label} permanently?\n\nThis will remove their Firebase login, profile data, and all course enrollments. This cannot be undone.`
      )
    ) {
      return;
    }
    void runDeleteDelegate(student);
  }

  async function handleDelete(registrationId: string) {
    if (!confirm("Are you sure you want to delete this enrollment? This cannot be undone.")) return;
    setDeletingId(registrationId);
    setUpdateError(null);
    try {
      const result = await deleteRegistration(registrationId);
      if (result.success) {
        await loadData();
      } else {
        setUpdateError(result.error);
      }
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleExportExcel() {
    const XLSX = await import("xlsx");
    const courseTitle = (id: string) => courses.get(id)?.title ?? id;
    const rows = registrations.map((reg) => {
      const course = courses.get(reg.courseId);
      const totalDisplay = formatAmountDue(reg.amountDueCents, reg, course);
      return {
        "Enrollment ID": reg.id,
        "Delegate Name": reg.name,
        "Email": reg.email,
        "Phone": reg.phone ?? "",
        "Course": courseTitle(reg.courseId),
        "Status": reg.status,
        "Enrollment Date": reg.createdAt ? new Date(reg.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "",
        "Total": totalDisplay,
        "Payment Status": reg.paymentStatus ?? "",
        "Paid At": reg.paidAt ? new Date(reg.paidAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "",
        "Country": reg.country ?? "",
        "Instagram": reg.instagramHandle ?? "",
        "Current Role": reg.currentRole ?? "",
        "Years Experience": reg.yearsExperience ?? "",
        "Primary Work Setting": reg.primaryWorkSetting ?? "",
        "GDC Number": reg.gdcNumber ?? "",
        "Has Placed Implants": reg.hasPlacedImplants ? "Yes" : "No",
        "Implants Placed Count": reg.implantsPlacedCount ?? "",
        "Has Restored Cases": reg.hasRestoredCases ? "Yes" : "No",
        "Aspects to Develop": Array.isArray(reg.aspectsToDevelop) ? reg.aspectsToDevelop.join("; ") : "",
        "Preferred Format": reg.preferredFormat ?? "",
        "How Did You Hear": reg.howDidYouHear ?? "",
        "What Attracted You": reg.whatAttractedYou ?? "",
        "Contact by WhatsApp": reg.contactByWhatsApp ? "Yes" : "No",
        "Single Occupancy Upgrade": reg.singleOccupancyUpgrade ? "Yes" : "No",
        "Enrollment note": reg.enrollmentNote ?? "",
      };
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Enrollments");
    XLSX.writeFile(wb, `enrollments-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  async function handleExportUsersExcel() {
    const XLSX = await import("xlsx");
    const rows = students.map((s) => ({
      "User ID": s.uid || s.id,
      Name: s.displayName || (s.email ? s.email.split("@")[0] : "") || "",
      Email: s.email ?? "",
      Phone: s.phone ?? "",
      "Sign-up Date": s.createdAt
        ? new Date(s.createdAt).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "",
      "Last Updated": s.updatedAt
        ? new Date(s.updatedAt).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Users");
    XLSX.writeFile(wb, `user-registrations-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  async function handleStatusChange(registrationId: string, newStatus: RegistrationStatus) {
    setUpdatingStatus(registrationId);
    setUpdateError(null);

    try {
      const result = await updateRegistrationStatus(registrationId, newStatus);
      if (result.success) {
        // Update local state
        setRegistrations((prev) =>
          prev.map((reg) =>
            reg.id === registrationId
              ? { ...reg, status: newStatus, updatedAt: new Date() }
              : reg
          )
        );
        // Update details dialog if it's open for this registration
        if (detailsDialog.registration?.id === registrationId) {
          setDetailsDialog((prev) => ({
            ...prev,
            registration: prev.registration
              ? { ...prev.registration, status: newStatus, updatedAt: new Date() }
              : undefined,
          }));
        }
      } else {
        setUpdateError(result.error || "Failed to update status");
      }
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setUpdatingStatus(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[var(--font-playfair)] text-2xl tracking-tight">
          Registrations
        </h1>
        <p className="mt-2 text-sm text-white/70">
          Manage user registrations and course enrollments
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10">
        <button
          onClick={() => setActiveTab("users")}
          className={`px-4 py-2 text-sm font-medium transition ${
            activeTab === "users"
              ? "border-b-2 border-accentGold text-accentGold"
              : "text-white/70 hover:text-white"
          }`}
        >
          User Registrations
        </button>
        <button
          onClick={() => setActiveTab("enrollments")}
          className={`px-4 py-2 text-sm font-medium transition ${
            activeTab === "enrollments"
              ? "border-b-2 border-accentGold text-accentGold"
              : "text-white/70 hover:text-white"
          }`}
        >
          Course Enrollments
        </button>
      </div>

      {/* Export Excel — active tab, when there is data */}
      {((activeTab === "users" && students.length > 0) ||
        (activeTab === "enrollments" && registrations.length > 0)) && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={activeTab === "users" ? handleExportUsersExcel : handleExportExcel}
            className="inline-flex items-center gap-2 rounded-lg border border-accentGold/50 bg-accentGold/10 px-4 py-2 text-sm font-medium text-accentGold transition hover:bg-accentGold/20"
          >
            <Download className="h-4 w-4" />
            Export as Excel
          </button>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
        <input
          type="text"
          placeholder={
            activeTab === "users"
              ? "Search by name, email, or phone..."
              : "Search by delegate name, email, or course..."
          }
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-black/40 px-10 py-2 text-white placeholder:text-white/40 focus:border-accentGold/50 focus:outline-none"
        />
      </div>

      {/* Error message */}
      {updateError && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {updateError}
          <button
            onClick={() => setUpdateError(null)}
            className="ml-2 text-red-300 hover:text-red-200"
          >
            ×
          </button>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="py-12 text-center text-white/70">Loading registrations...</div>
      ) : activeTab === "users" ? (
        // User Registrations Tab
        filteredStudents.length === 0 ? (
          <div className="rounded-lg border border-white/10 bg-black/40 px-6 py-12 text-center">
            <p className="text-white/70">
              {searchQuery
                ? "No user registrations found matching your search."
                : "No user registrations yet."}
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-white/10 bg-black/40">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/70">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/70">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/70">
                    Phone
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/70">
                    Sign-up Date
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-white/70">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="transition hover:bg-white/5">
                    <td className="px-4 py-4">
                      <p className="font-medium text-white">
                        {student.displayName || (student.email ? student.email.split("@")[0] : null) || "Account"}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-sm text-white/70">
                      {student.email || "—"}
                    </td>
                    <td className="px-4 py-4 text-sm text-white/70">{student.phone || "—"}</td>
                    <td className="px-4 py-4 text-sm text-white/70">
                      {formatDate(student.createdAt)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() =>
                            setDetailsDialog({
                              open: true,
                              type: "student",
                              student,
                            })
                          }
                          className="rounded p-1.5 text-white/70 transition hover:bg-white/10 hover:text-white"
                          title="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteStudentRow(student)}
                          disabled={deletingStudentId === (student.uid || student.id)}
                          className="rounded p-1.5 text-red-400/80 transition hover:bg-red-500/20 hover:text-red-400 disabled:opacity-50"
                          title="Delete delegate account"
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
        )
      ) : (
        // Course Enrollments Tab
        filteredRegistrations.length === 0 ? (
          <div className="rounded-lg border border-white/10 bg-black/40 px-6 py-12 text-center">
            <p className="text-white/70">
              {searchQuery
                ? "No course enrollments found matching your search."
                : "No course enrollments yet."}
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-white/10 bg-black/40">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/70">
                    Delegate Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/70">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/70">
                    Course
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/70">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/70">
                    Enrollment Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/70">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/70">
                    Payment
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-white/70">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredRegistrations.map((registration) => {
                  const course = courses.get(registration.courseId);
                  const totalDisplay = formatAmountDue(registration.amountDueCents, registration, course);
                  const hasPendingRequest = registration.specialRequest?.status === "pending";
                  const displayStatus = effectiveStatusForAdmin(registration);
                  const canSetConfirmed = registration.paymentStatus === "paid";
                  return (
                    <tr key={registration.id} className="transition hover:bg-white/5">
                      <td className="px-4 py-4">
                        <p className="font-medium text-white">{registration.name}</p>
                        {hasPendingRequest && (
                          <span className="mt-1 inline-block rounded bg-amber-500/20 px-1.5 py-0.5 text-xs text-amber-400">
                            Special request
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm text-white/70">{registration.email}</td>
                      <td className="px-4 py-4 text-sm text-white/70">
                        {course?.title || registration.courseId}
                      </td>
                      <td className="px-4 py-4">
                        <select
                          value={displayStatus}
                          onChange={(e) =>
                            handleStatusChange(registration.id, e.target.value as RegistrationStatus)
                          }
                          disabled={updatingStatus === registration.id}
                          title={!canSetConfirmed ? "Confirm only after payment" : "Update enrollment status"}
                          className={`rounded-full px-2 py-1 text-xs font-semibold capitalize border-0 cursor-pointer transition ${
                            updatingStatus === registration.id
                              ? "opacity-50 cursor-not-allowed"
                              : "hover:opacity-80"
                          } ${getStatusBadgeColor(displayStatus)}`}
                        >
                          <option value="pending">
                            {registration.status === "confirmed" && registration.paymentStatus !== "paid"
                              ? "Pending payment"
                              : "Pending"}
                          </option>
                          <option value="confirmed" disabled={!canSetConfirmed}>
                            Confirmed
                          </option>
                          <option value="cancelled">Cancelled</option>
                          <option value="completed">Completed</option>
                        </select>
                      </td>
                      <td className="px-4 py-4 text-sm text-white/70">
                        {formatDate(registration.createdAt)}
                      </td>
                      <td className="px-4 py-4 text-sm text-white/70">
                        {totalDisplay}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        {registration.paymentStatus === "paid" && (
                          <span className="text-green-400">Paid</span>
                        )}
                        {registration.paymentStatus === "unpaid" && (
                          <span className="text-white/60">Unpaid</span>
                        )}
                        {registration.paymentStatus === "failed" && (
                          <span className="text-red-400">Failed</span>
                        )}
                        {!registration.paymentStatus && <span className="text-white/50">—</span>}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() =>
                              setDetailsDialog({
                                open: true,
                                type: "enrollment",
                                registration,
                                course,
                              })
                            }
                            className="rounded p-1.5 text-white/70 transition hover:bg-white/10 hover:text-white"
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(registration.id)}
                            disabled={deletingId === registration.id}
                            className="rounded p-1.5 text-red-400/80 transition hover:bg-red-500/20 hover:text-red-400 disabled:opacity-50"
                            title="Delete enrollment"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}

      <RegistrationDetailsDialog
        open={detailsDialog.open}
        type={detailsDialog.type}
        student={detailsDialog.student}
        registration={detailsDialog.registration}
        course={detailsDialog.course}
        onClose={() => setDetailsDialog({ open: false, type: "student" })}
        onStatusUpdate={async () => {
          const regs = await loadData();
          setDetailsDialog((prev) => {
            if (!prev.registration?.id || !regs) return prev;
            const updated = regs.find((r) => r.id === prev.registration!.id);
            return updated ? { ...prev, registration: updated } : prev;
          });
        }}
        onFeesSet={() => {
          setDetailsDialog({ open: false, type: "student" });
          setActiveTab("enrollments");
        }}
        getToken={user ? async () => (await user.getIdToken()) ?? "" : undefined}
        onDeleteStudent={runDeleteDelegate}
      />
    </div>
  );
}
