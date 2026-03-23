"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { submitEnquiry } from "@/lib/actions/enquiry";

type EnquiryCourseOption = {
  id: string;
  slug: string;
  title: string;
};

export function HomeCtaButtons({ availableCourses = [] }: { availableCourses?: EnquiryCourseOption[] }) {
  const { user, loading, isAdmin } = useAuth();
  const isStudent = !loading && user && !isAdmin;
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const selectedCourse = useMemo(
    () => availableCourses.find((course) => course.id === selectedCourseId) ?? null,
    [availableCourses, selectedCourseId]
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function onSubmitEnquiry(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!selectedCourse) {
      setError("Please select a course.");
      return;
    }
    setBusy(true);
    const result = await submitEnquiry({
      fullName,
      email,
      phone,
      message,
      interestedCourseId: selectedCourse.id,
      interestedCourseSlug: selectedCourse.slug,
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
    setSelectedCourseId("");
  }

  return (
    <>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/courses"
          className="btn-liquid inline-flex items-center gap-2 px-8 py-3 text-sm font-semibold uppercase tracking-[0.16em]"
        >
          View courses
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
        {isStudent ? (
          <Link
            href="/portal/dashboard"
            className="btn-liquid inline-flex items-center gap-2 px-8 py-3 text-sm font-semibold uppercase tracking-[0.16em]"
          >
            Dashboard
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => {
              setOpen(true);
              setDone(false);
              setError(null);
            }}
            className="btn-liquid inline-flex items-center gap-2 px-8 py-3 text-sm font-semibold uppercase tracking-[0.16em]"
          >
            Enquire now
          </button>
        )}
      </div>
      {mounted &&
        open &&
        createPortal(
          <div
            className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="home-enquiry-modal-title"
            onClick={() => setOpen(false)}
          >
            <div
              className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0B0B0D] p-5 text-left shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h3 id="home-enquiry-modal-title" className="text-lg font-semibold text-white">
                    Quick enquiry
                  </h3>
                  <p className="mt-1 text-xs text-white/60">
                    Submit your details and select a course. Our team will contact you.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
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
                <form className="space-y-2.5" onSubmit={onSubmitEnquiry}>
                  <select
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    required
                    aria-label="Select a course"
                    className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                  >
                    <option value="">Select course</option>
                    {availableCourses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.title}
                      </option>
                    ))}
                  </select>
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
                    disabled={busy || availableCourses.length === 0}
                    className="w-full rounded-full border border-accentGold bg-accentGold px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-background disabled:opacity-60"
                  >
                    {busy ? "Sending..." : "Submit enquiry"}
                  </button>
                </form>
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
