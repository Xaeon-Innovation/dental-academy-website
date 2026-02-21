"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Upload, X, Star, Trash2 } from "lucide-react";
import type { HomeSettings } from "@/types/settings";
import type { Testimonial } from "@/types/testimonial";
import type { Course } from "@/types/course";
import { getHomeSettings, updateHomeSettings } from "@/lib/actions/settings";
import { uploadHomeImage } from "@/lib/actions/upload";
import {
  getAllTestimonials,
  updateTestimonialStatus,
  deleteTestimonial,
  createTestimonialAsAdmin,
} from "@/lib/actions/testimonial";
import { getCourses } from "@/lib/actions/course";

type Status = "idle" | "loading" | "saving";
type TabId = "content" | "testimonials";
type TestimonialsSubTabId = "review" | "add";

export default function AdminHomeManagementPage() {
  const [activeTab, setActiveTab] = useState<TabId>("content");
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [home, setHome] = useState<HomeSettings>({
    philosophyHeading: "",
    philosophyTitle: "",
    philosophyBody: "",
    philosophyImageUrl: "",
    ctaTitle: "",
    ctaBody: "",
    ctaBackgroundImageUrl: "",
  });
  const [philosophyImagePreview, setPhilosophyImagePreview] = useState<string | null>(null);
  const [ctaImagePreview, setCtaImagePreview] = useState<string | null>(null);
  const [uploadingPhilosophy, startUploadingPhilosophy] = useTransition();
  const [uploadingCta, startUploadingCta] = useTransition();
  const philosophyInputRef = useRef<HTMLInputElement | null>(null);
  const ctaInputRef = useRef<HTMLInputElement | null>(null);

  const [testimonials, setTestimonials] = useState<(Testimonial & { id: string })[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [testimonialsLoading, setTestimonialsLoading] = useState(false);
  const [testimonialActionId, setTestimonialActionId] = useState<string | null>(null);
  const [addDisplayName, setAddDisplayName] = useState("");
  const [addCourseId, setAddCourseId] = useState("");
  const [addRating, setAddRating] = useState(5);
  const [addQuote, setAddQuote] = useState("");
  const [addSaving, setAddSaving] = useState(false);
  const [testimonialsSubTab, setTestimonialsSubTab] = useState<TestimonialsSubTabId>("review");

  useEffect(() => {
    let mounted = true;
    async function load() {
      setStatus("loading");
      setError(null);
      try {
        const settings = await getHomeSettings();
        if (!mounted) return;
        const next: HomeSettings = {
          philosophyHeading: settings?.philosophyHeading ?? "",
          philosophyTitle: settings?.philosophyTitle ?? "",
          philosophyBody: settings?.philosophyBody ?? "",
          philosophyImageUrl: settings?.philosophyImageUrl ?? "",
          ctaTitle: settings?.ctaTitle ?? "",
          ctaBody: settings?.ctaBody ?? "",
          ctaBackgroundImageUrl: settings?.ctaBackgroundImageUrl ?? "",
        };
        setHome(next);
        setPhilosophyImagePreview(next.philosophyImageUrl || null);
        setCtaImagePreview(next.ctaBackgroundImageUrl || null);
        setStatus("idle");
      } catch (err) {
        console.error("Failed to load home settings", err);
        if (!mounted) return;
        setError("Failed to load home content. Please try again.");
        setStatus("idle");
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (activeTab !== "testimonials") return;
    let mounted = true;
    setTestimonialsLoading(true);
    Promise.all([getAllTestimonials(), getCourses()])
      .then(([list, coursesList]) => {
        if (!mounted) return;
        setTestimonials(list);
        setCourses(coursesList);
      })
      .finally(() => {
        if (mounted) setTestimonialsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [activeTab]);

  const courseById = new Map(courses.map((c) => [c.id, c]));

  async function handleTestimonialStatus(id: string, status: Testimonial["status"]) {
    setError(null);
    setTestimonialActionId(id);
    const result = await updateTestimonialStatus(id, status);
    setTestimonialActionId(null);
    if (result.success) {
      setTestimonials((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status } : t))
      );
    } else {
      setError(result.error);
    }
  }

  async function handleDeleteTestimonial(id: string) {
    if (!confirm("Delete this testimonial? This cannot be undone.")) return;
    setError(null);
    setTestimonialActionId(id);
    const result = await deleteTestimonial(id);
    setTestimonialActionId(null);
    if (result.success) {
      setTestimonials((prev) => prev.filter((t) => t.id !== id));
    } else {
      setError(result.error);
    }
  }

  async function handleAddTestimonial(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setAddSaving(true);
    const result = await createTestimonialAsAdmin({
      courseId: addCourseId,
      displayName: addDisplayName.trim(),
      rating: addRating,
      quote: addQuote.trim(),
    });
    setAddSaving(false);
    if (result.success) {
      setAddDisplayName("");
      setAddCourseId("");
      setAddRating(5);
      setAddQuote("");
      const list = await getAllTestimonials();
      setTestimonials(list);
      setSuccess("Testimonial added. It will appear on the home page when there are at least 5 approved.");
    } else {
      setError(result.error);
    }
  }

  function updateField<K extends keyof HomeSettings>(field: K, value: HomeSettings[K]) {
    setHome((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setStatus("saving");
    const trimmed: HomeSettings = {
      philosophyHeading: home.philosophyHeading?.trim() || "Our Philosophy",
      philosophyTitle:
        home.philosophyTitle?.trim() ||
        "Precision-driven implant dentistry, from placement to perfection.",
      philosophyBody:
        home.philosophyBody?.trim() ||
        "Kaleidoscope Dental Academy exists for clinicians who demand more: more clarity, more control, and more repeatable outcomes.",
      philosophyImageUrl: home.philosophyImageUrl?.trim() || "",
      ctaTitle: home.ctaTitle?.trim() || "Start your journey",
      ctaBody:
        home.ctaBody?.trim() ||
        "Join the Academy and build precision-driven implant skills with iPlace and iRestore.",
      ctaBackgroundImageUrl: home.ctaBackgroundImageUrl?.trim() || "",
    };

    try {
      const result = await updateHomeSettings(trimmed);
      if (result.success) {
        setSuccess("Home content saved successfully.");
      } else {
        setError(result.error || "Failed to save home content.");
      }
    } catch (err) {
      console.error("Failed to save home content", err);
      setError("Failed to save home content. Please try again.");
    } finally {
      setStatus("idle");
    }
  }

  function handleImageChange(
    e: React.ChangeEvent<HTMLInputElement>,
    type: "philosophy" | "cta"
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Image size must be less than 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === "philosophy") {
        setPhilosophyImagePreview(reader.result as string);
      } else {
        setCtaImagePreview(reader.result as string);
      }
    };
    reader.readAsDataURL(file);

    const uploadFn = async () => {
      setError(null);
      const result = await uploadHomeImage(file);
      if (result.success) {
        if (type === "philosophy") {
          updateField("philosophyImageUrl", result.url);
        } else {
          updateField("ctaBackgroundImageUrl", result.url);
        }
      } else {
        setError(result.error || "Failed to upload image.");
      }
    };

    if (type === "philosophy") {
      startUploadingPhilosophy(uploadFn);
    } else {
      startUploadingCta(uploadFn);
    }
  }

  function clearImage(type: "philosophy" | "cta") {
    if (type === "philosophy") {
      setPhilosophyImagePreview(null);
      updateField("philosophyImageUrl", "");
      if (philosophyInputRef.current) {
        philosophyInputRef.current.value = "";
      }
    } else {
      setCtaImagePreview(null);
      updateField("ctaBackgroundImageUrl", "");
      if (ctaInputRef.current) {
        ctaInputRef.current.value = "";
      }
    }
  }

  const loading = status === "loading";
  const saving = status === "saving";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[var(--font-playfair)] text-2xl tracking-tight">Home management</h1>
        <p className="mt-2 text-sm text-white/70">
          Edit the text and images for the home page, and manage which testimonials appear in the marquee.
        </p>
        <div className="mt-4 flex gap-2 border-b border-white/10">
          <button
            type="button"
            onClick={() => setActiveTab("content")}
            className={`rounded-t-lg px-4 py-2 text-sm font-medium transition ${
              activeTab === "content"
                ? "bg-white/10 text-accentGold"
                : "text-white/60 hover:bg-white/5 hover:text-white/80"
            }`}
          >
            Home content
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("testimonials")}
            className={`rounded-t-lg px-4 py-2 text-sm font-medium transition ${
              activeTab === "testimonials"
                ? "bg-white/10 text-accentGold"
                : "text-white/60 hover:bg-white/5 hover:text-white/80"
            }`}
          >
            Testimonials
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {success}
        </div>
      )}

      {activeTab === "testimonials" && (
        <section className="rounded-lg border border-white/10 bg-black/40 p-6">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-accentGold">
            Testimonials on home page
          </h2>
          <p className="mt-1 text-xs text-white/60">
            Approved testimonials appear in the home page marquee when there are at least 5.
          </p>

          <div className="mt-4 flex gap-2 border-b border-white/10">
            <button
              type="button"
              onClick={() => setTestimonialsSubTab("review")}
              className={`rounded-t-lg px-3 py-2 text-sm font-medium transition ${
                testimonialsSubTab === "review"
                  ? "bg-white/10 text-accentGold"
                  : "text-white/60 hover:bg-white/5 hover:text-white/80"
              }`}
            >
              Review
            </button>
            <button
              type="button"
              onClick={() => setTestimonialsSubTab("add")}
              className={`rounded-t-lg px-3 py-2 text-sm font-medium transition ${
                testimonialsSubTab === "add"
                  ? "bg-white/10 text-accentGold"
                  : "text-white/60 hover:bg-white/5 hover:text-white/80"
              }`}
            >
              Add
            </button>
          </div>

          {testimonialsSubTab === "review" && (
            <>
              {testimonialsLoading ? (
                <p className="mt-4 text-sm text-white/60">Loading testimonials…</p>
              ) : testimonials.length === 0 ? (
                <p className="mt-4 text-sm text-white/60">No testimonials yet. Use the Add tab to add one.</p>
              ) : (
                <ul className="mt-4 space-y-3">
              {testimonials.map((t) => {
                const course = courseById.get(t.courseId);
                const isBusy = testimonialActionId === t.id;
                return (
                  <li
                    key={t.id}
                    className="flex flex-wrap items-start justify-between gap-4 rounded-lg border border-white/10 bg-black/20 p-4"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">
                          {t.displayName?.trim() || "Student"}
                        </span>
                        <span className="flex items-center gap-0.5 text-accentGold">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3.5 w-3.5 ${
                                i < t.rating ? "fill-current" : "text-white/30"
                              }`}
                            />
                          ))}
                        </span>
                        <span
                          className={`rounded px-2 py-0.5 text-xs font-medium ${
                            t.status === "approved"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-white/10 text-white/60"
                          }`}
                        >
                          {t.status}
                        </span>
                        {t.userId === "admin" && (
                          <span className="rounded px-2 py-0.5 text-[10px] font-medium text-white/50 bg-white/10">
                            Admin-added
                          </span>
                        )}
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs text-white/70">
                        {t.quote}
                      </p>
                      <p className="mt-1 text-[11px] text-white/50">
                        Course: {course?.title ?? t.courseId}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {t.status === "pending" ? (
                        <button
                          type="button"
                          onClick={() => handleTestimonialStatus(t.id, "approved")}
                          disabled={isBusy}
                          className="rounded border border-emerald-500/50 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 transition hover:bg-emerald-500/20 disabled:opacity-50"
                        >
                          {isBusy ? "…" : "Approve"}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleTestimonialStatus(t.id, "pending")}
                          disabled={isBusy}
                          className="rounded border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 transition hover:bg-white/10 disabled:opacity-50"
                        >
                          {isBusy ? "…" : "Hide"}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteTestimonial(t.id)}
                        disabled={isBusy}
                        className="rounded border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 transition hover:bg-red-500/20 disabled:opacity-50"
                        aria-label="Delete testimonial"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
              )}
            </>
          )}

          {testimonialsSubTab === "add" && (
            <div className="mt-4 rounded-lg border border-white/10 bg-black/20 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-white/80">
                Add testimonial (e.g. previous courses)
              </h3>
              <p className="mt-1 text-[11px] text-white/50">
                For past students not in the system. Enter course, name and review.
              </p>
              <form onSubmit={handleAddTestimonial} className="mt-4 space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="add-course" className="mb-1 block text-[11px] font-medium text-white/70">
                      Course
                    </label>
                    <select
                      id="add-course"
                      value={addCourseId}
                      onChange={(e) => setAddCourseId(e.target.value)}
                      required
                      className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-accentGold/50 focus:outline-none"
                      disabled={addSaving || testimonialsLoading}
                    >
                      <option value="">Select course</option>
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="add-displayName" className="mb-1 block text-[11px] font-medium text-white/70">
                      Display name
                    </label>
                    <input
                      id="add-displayName"
                      type="text"
                      value={addDisplayName}
                      onChange={(e) => setAddDisplayName(e.target.value)}
                      required
                      placeholder="e.g. Dr. Smith"
                      className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-accentGold/50 focus:outline-none"
                      disabled={addSaving}
                    />
                  </div>
                </div>
                <div>
                  <span className="mb-1 block text-[11px] font-medium text-white/70">Rating</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setAddRating(value)}
                        className="rounded p-1 transition hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-accentGold/50"
                        aria-label={`${value} stars`}
                      >
                        <Star
                          className={`h-7 w-7 ${
                            value <= addRating ? "fill-accentGold text-accentGold" : "text-white/30"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label htmlFor="add-quote" className="mb-1 block text-[11px] font-medium text-white/70">
                    Testimonial
                  </label>
                  <textarea
                    id="add-quote"
                    rows={3}
                    value={addQuote}
                    onChange={(e) => setAddQuote(e.target.value)}
                    required
                    placeholder="Short paragraph from the student..."
                    className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-accentGold/50 focus:outline-none"
                    disabled={addSaving}
                  />
                </div>
                <button
                  type="submit"
                  disabled={addSaving || !addCourseId || !addDisplayName.trim() || !addQuote.trim()}
                  className="rounded-lg bg-accentGold px-4 py-2 text-sm font-semibold text-background transition hover:bg-accentGold/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {addSaving ? "Adding…" : "Add testimonial"}
                </button>
              </form>
            </div>
          )}
        </section>
      )}

      {activeTab === "content" && (
      <form onSubmit={handleSave} className="space-y-8">
        {/* Philosophy section */}
        <section className="rounded-lg border border-white/10 bg-black/40 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-[var(--font-playfair)] text-xl tracking-tight">
                Philosophy section
              </h2>
              <p className="mt-1 text-xs text-white/60">
                This content appears under the &quot;Our Philosophy&quot; section on the home page.
              </p>
            </div>
            <span className="text-xs uppercase tracking-[0.18em] text-accentGold/80">
              Hero copy
            </span>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] md:items-start">
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="philosophyHeading"
                  className="mb-1 block text-xs font-semibold text-white/70"
                >
                  Small heading
                </label>
                <input
                  id="philosophyHeading"
                  type="text"
                  value={home.philosophyHeading ?? ""}
                  onChange={(e) => updateField("philosophyHeading", e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-accentGold/50 focus:outline-none"
                  placeholder="Our Philosophy"
                  disabled={loading || saving}
                />
              </div>

              <div>
                <label
                  htmlFor="philosophyTitle"
                  className="mb-1 block text-xs font-semibold text-white/70"
                >
                  Title
                </label>
                <input
                  id="philosophyTitle"
                  type="text"
                  value={home.philosophyTitle ?? ""}
                  onChange={(e) => updateField("philosophyTitle", e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-accentGold/50 focus:outline-none"
                  placeholder="Precision-driven implant dentistry, from placement to perfection."
                  disabled={loading || saving}
                />
              </div>

              <div>
                <label
                  htmlFor="philosophyBody"
                  className="mb-1 block text-xs font-semibold text-white/70"
                >
                  Body text
                </label>
                <textarea
                  id="philosophyBody"
                  rows={4}
                  value={home.philosophyBody ?? ""}
                  onChange={(e) => updateField("philosophyBody", e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-accentGold/50 focus:outline-none"
                  placeholder="Kaleidoscope Dental Academy exists for clinicians who demand more..."
                  disabled={loading || saving}
                />
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
                Hero image
              </p>
              {philosophyImagePreview && (
                <div className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-black/40">
                  <img
                    src={philosophyImagePreview}
                    alt="Philosophy preview"
                    className="h-40 w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => clearImage("philosophy")}
                    className="absolute right-2 top-2 rounded-full bg-black/70 p-1.5 text-white hover:bg-black"
                    aria-label="Remove image"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}

              <input
                ref={philosophyInputRef}
                id="philosophyImage"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageChange(e, "philosophy")}
                disabled={loading || saving || uploadingPhilosophy}
              />
              <label
                htmlFor="philosophyImage"
                className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white transition hover:bg-white/10 ${
                  loading || saving || uploadingPhilosophy ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {uploadingPhilosophy ? (
                  <>
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-3 w-3" />
                    {philosophyImagePreview ? "Change image" : "Upload image"}
                  </>
                )}
              </label>
              <p className="text-[11px] text-white/50">
                Recommended: wide image, up to 2MB. Defaults to the existing hero image if not set.
              </p>
            </div>
          </div>
        </section>

        {/* CTA section */}
        <section className="rounded-lg border border-white/10 bg-black/40 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-[var(--font-playfair)] text-xl tracking-tight">
                Bottom CTA section
              </h2>
              <p className="mt-1 text-xs text-white/60">
                This content appears in the &quot;Start your journey&quot; section above the home
                page buttons.
              </p>
            </div>
            <span className="text-xs uppercase tracking-[0.18em] text-accentGold/80">
              Call to action
            </span>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] md:items-start">
            <div className="space-y-4">
              <div>
                <label htmlFor="ctaTitle" className="mb-1 block text-xs font-semibold text-white/70">
                  Title
                </label>
                <input
                  id="ctaTitle"
                  type="text"
                  value={home.ctaTitle ?? ""}
                  onChange={(e) => updateField("ctaTitle", e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-accentGold/50 focus:outline-none"
                  placeholder="Start your journey"
                  disabled={loading || saving}
                />
              </div>

              <div>
                <label htmlFor="ctaBody" className="mb-1 block text-xs font-semibold text-white/70">
                  Body text
                </label>
                <textarea
                  id="ctaBody"
                  rows={3}
                  value={home.ctaBody ?? ""}
                  onChange={(e) => updateField("ctaBody", e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-accentGold/50 focus:outline-none"
                  placeholder="Join the Academy and build precision-driven implant skills..."
                  disabled={loading || saving}
                />
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
                Optional background image
              </p>
              {ctaImagePreview && (
                <div className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-black/40">
                  <img
                    src={ctaImagePreview}
                    alt="CTA preview"
                    className="h-32 w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => clearImage("cta")}
                    className="absolute right-2 top-2 rounded-full bg-black/70 p-1.5 text-white hover:bg-black"
                    aria-label="Remove image"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}

              <input
                ref={ctaInputRef}
                id="ctaImage"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageChange(e, "cta")}
                disabled={loading || saving || uploadingCta}
              />
              <label
                htmlFor="ctaImage"
                className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white transition hover:bg-white/10 ${
                  loading || saving || uploadingCta ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {uploadingCta ? (
                  <>
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-3 w-3" />
                    {ctaImagePreview ? "Change image" : "Upload image"}
                  </>
                )}
              </label>
              <p className="text-[11px] text-white/50">
                Optional decorative image behind the CTA content. Leave empty to use a plain
                background.
              </p>
            </div>
          </div>
        </section>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || saving}
            className="rounded-lg bg-accentGold px-5 py-2.5 text-sm font-semibold text-background transition hover:bg-accentGold/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
      )}
    </div>
  );
}

