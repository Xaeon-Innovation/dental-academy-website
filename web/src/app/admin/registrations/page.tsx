"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Eye } from "lucide-react";
import { getAllStudents } from "@/lib/actions/student";
import { getAllRegistrations, updateRegistrationStatus } from "@/lib/actions/registration";
import { getCourses } from "@/lib/actions/course";
import type { StudentProfile } from "@/types/student";
import type { Registration, RegistrationStatus } from "@/types/registration";
import type { Course } from "@/types/course";
import RegistrationDetailsDialog from "@/components/admin/RegistrationDetailsDialog";

type Tab = "users" | "enrollments";

export default function AdminRegistrationsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("users");
  const [students, setStudents] = useState<(StudentProfile & { id: string })[]>([]);
  const [registrations, setRegistrations] = useState<(Registration & { id: string })[]>([]);
  const [courses, setCourses] = useState<Map<string, Course>>(new Map());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
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

  async function loadData() {
    setLoading(true);
    try {
      // Load students and registrations in parallel
      const [studentsData, registrationsData, coursesData] = await Promise.all([
        getAllStudents(),
        getAllRegistrations(),
        getCourses(),
      ]);

      setStudents(studentsData);
      setRegistrations(registrationsData);

      // Create a map of courseId -> Course for quick lookup
      const coursesMap = new Map<string, Course>();
      coursesData.forEach((course) => {
        coursesMap.set(course.id, course);
      });
      setCourses(coursesMap);
    } catch (err) {
      console.error("Failed to load registrations data:", err);
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

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
        <input
          type="text"
          placeholder={
            activeTab === "users"
              ? "Search by name, email, or phone..."
              : "Search by student name, email, or course..."
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
                    Student Name
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
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-white/70">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredRegistrations.map((registration) => {
                  const course = courses.get(registration.courseId);
                  return (
                    <tr key={registration.id} className="transition hover:bg-white/5">
                      <td className="px-4 py-4">
                        <p className="font-medium text-white">{registration.name}</p>
                      </td>
                      <td className="px-4 py-4 text-sm text-white/70">{registration.email}</td>
                      <td className="px-4 py-4 text-sm text-white/70">
                        {course?.title || registration.courseId}
                      </td>
                      <td className="px-4 py-4">
                        <select
                          value={registration.status}
                          onChange={(e) =>
                            handleStatusChange(registration.id, e.target.value as RegistrationStatus)
                          }
                          disabled={updatingStatus === registration.id}
                          title="Update enrollment status"
                          className={`rounded-full px-2 py-1 text-xs font-semibold capitalize border-0 cursor-pointer transition ${
                            updatingStatus === registration.id
                              ? "opacity-50 cursor-not-allowed"
                              : "hover:opacity-80"
                          } ${getStatusBadgeColor(registration.status)}`}
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="cancelled">Cancelled</option>
                          <option value="completed">Completed</option>
                        </select>
                      </td>
                      <td className="px-4 py-4 text-sm text-white/70">
                        {formatDate(registration.createdAt)}
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
        onStatusUpdate={() => {
          loadData();
        }}
      />
    </div>
  );
}
