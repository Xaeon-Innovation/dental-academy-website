"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Upload, X, Star, Trash2, Pencil, Eye, EyeOff } from "lucide-react";
import type { HomeSettings, VideoTestimonialItem } from "@/types/settings";
import type { Testimonial } from "@/types/testimonial";
import type { Course } from "@/types/course";
import { getHomeSettings, updateHomeSettings } from "@/lib/actions/settings";
import { uploadHomeImage, uploadVideoTestimonialPoster } from "@/lib/actions/upload";
import { compressImageFile } from "@/lib/imageCompression";
import {
  getAllTestimonials,
  updateTestimonialStatus,
  deleteTestimonial,
  createTestimonialAsAdmin,
} from "@/lib/actions/testimonial";
import { getCourses } from "@/lib/actions/course";
import { upload } from "@vercel/blob/client";

type Status = "idle" | "loading" | "saving";
type TabId = "content" | "testimonials" | "videoTestimonials";
type TestimonialsSubTabId = "review" | "add";

/** Upload video via Vercel Blob client upload (file goes browser → Blob, avoids 4.5MB server limit). */
async function uploadVideoToBlob(file: File): Promise<{ success: true; url: string } | { success: false; error: string }> {
  try {
    const blob = await upload(file.name, file, {
      access: "public",
      handleUploadUrl: "/api/upload/video-testimonial",
    });
    return { success: true, url: blob.url };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

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

  const [videoTestimonials, setVideoTestimonials] = useState<VideoTestimonialItem[]>([]);
  const [videoName, setVideoName] = useState("");
  const [videoCredentials, setVideoCredentials] = useState("");
  const [videoQuote, setVideoQuote] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [videoUploading, setVideoUploading] = useState(false);
  const [videoDeletingId, setVideoDeletingId] = useState<string | null>(null);
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [editVideoName, setEditVideoName] = useState("");
  const [editVideoCredentials, setEditVideoCredentials] = useState("");
  const [editVideoQuote, setEditVideoQuote] = useState("");
  const [editVideoFile, setEditVideoFile] = useState<File | null>(null);
  const [editPosterFile, setEditPosterFile] = useState<File | null>(null);
  const [videoSavingId, setVideoSavingId] = useState<string | null>(null);
  const [videoTogglingId, setVideoTogglingId] = useState<string | null>(null);

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
          videoTestimonials: settings?.videoTestimonials ?? [],
        };
        setHome(next);
        setPhilosophyImagePreview(next.philosophyImageUrl || null);
        setCtaImagePreview(next.ctaBackgroundImageUrl || null);
        setVideoTestimonials(next.videoTestimonials ?? []);
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
        "Kaleidoscope Dental Academy exists for Delegates who demand more: more clarity, more control, and more repeatable outcomes.",
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

    const preset = type === "philosophy" ? "homeHero" : "homeCta";

    const uploadFn = async () => {
      setError(null);
      try {
        const compressedFile = await compressImageFile(file, { preset });

        const reader = new FileReader();
        reader.onloadend = () => {
          if (type === "philosophy") {
            setPhilosophyImagePreview(reader.result as string);
          } else {
            setCtaImagePreview(reader.result as string);
          }
        };
        reader.readAsDataURL(compressedFile);

        const result = await uploadHomeImage(compressedFile);
        if (result.success) {
          if (type === "philosophy") {
            updateField("philosophyImageUrl", result.url);
          } else {
            updateField("ctaBackgroundImageUrl", result.url);
          }
        } else {
          setError(result.error || "Failed to upload image.");
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to compress or upload image.";
        setError(message);
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

  async function handleAddVideoTestimonial(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!videoFile) {
      setError("Please select a video file (MP4 or WebM).");
      return;
    }
    if (!videoName.trim()) {
      setError("Please enter the person's name.");
      return;
    }
    setVideoUploading(true);
    try {
      const videoResult = await uploadVideoToBlob(videoFile);
      if (!videoResult.success) {
        setError(videoResult.error);
        return;
      }
      let posterUrl: string | undefined;
      if (posterFile) {
        const posterResult = await uploadVideoTestimonialPoster(posterFile);
        if (posterResult.success) posterUrl = posterResult.url;
      }
      const newItem: VideoTestimonialItem = {
        id: `vt-${Date.now()}`,
        name: videoName.trim(),
        credentials: videoCredentials.trim() || undefined,
        quote: videoQuote.trim() || undefined,
        videoUrl: videoResult.url,
        posterUrl,
        showOnHome: true,
      };
      const nextList = [...videoTestimonials, newItem];
      const result = await updateHomeSettings({ videoTestimonials: nextList });
      if (result.success) {
        setVideoTestimonials(nextList);
        setVideoName("");
        setVideoCredentials("");
        setVideoQuote("");
        setVideoFile(null);
        setPosterFile(null);
        setSuccess("Video testimonial added. It will appear on the home page.");
      } else {
        setError(result.error ?? "Failed to save video testimonial.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save video testimonial. Please try again.");
    } finally {
      setVideoUploading(false);
    }
  }

  function handleStartEditVideo(v: VideoTestimonialItem) {
    setEditingVideoId(v.id);
    setEditVideoName(v.name);
    setEditVideoCredentials(v.credentials ?? "");
    setEditVideoQuote(v.quote ?? "");
    setEditVideoFile(null);
    setEditPosterFile(null);
  }

  function handleCancelEditVideo() {
    setEditingVideoId(null);
    setEditVideoName("");
    setEditVideoCredentials("");
    setEditVideoQuote("");
    setEditVideoFile(null);
    setEditPosterFile(null);
  }

  async function handleSaveEditVideoTestimonial(e: React.FormEvent) {
    e.preventDefault();
    if (!editingVideoId) return;
    const item = videoTestimonials.find((v) => v.id === editingVideoId);
    if (!item) return;
    setError(null);
    setSuccess(null);
    setVideoSavingId(editingVideoId);
    try {
      let videoUrl = item.videoUrl;
      if (editVideoFile) {
        const res = await uploadVideoToBlob(editVideoFile);
        if (!res.success) {
          setError(res.error);
          return;
        }
        videoUrl = res.url;
      }
      let posterUrl: string | undefined = item.posterUrl;
      if (editPosterFile) {
        const res = await uploadVideoTestimonialPoster(editPosterFile);
        if (res.success) posterUrl = res.url;
      }
      const updated: VideoTestimonialItem = {
        ...item,
        name: editVideoName.trim(),
        credentials: editVideoCredentials.trim() || undefined,
        quote: editVideoQuote.trim() || undefined,
        videoUrl,
        posterUrl,
        showOnHome: item.showOnHome !== false,
      };
      const nextList = videoTestimonials.map((v) =>
        v.id === editingVideoId ? updated : v
      );
      const result = await updateHomeSettings({ videoTestimonials: nextList });
      if (result && typeof result === "object" && result.success) {
        setVideoTestimonials(nextList);
        handleCancelEditVideo();
        setSuccess("Video testimonial updated.");
      } else {
        const msg = result && typeof result === "object" && "error" in result && typeof result.error === "string"
          ? result.error
          : "Failed to save changes.";
        setError(msg);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save changes. Please try again.");
    } finally {
      setVideoSavingId(null);
    }
  }

  async function handleToggleShowOnHome(id: string) {
    const item = videoTestimonials.find((v) => v.id === id);
    if (!item) return;
    setError(null);
    setVideoTogglingId(id);
    try {
      const nextList = videoTestimonials.map((v) =>
        v.id === id ? { ...v, showOnHome: !(v.showOnHome !== false) } : v
      );
      const result = await updateHomeSettings({ videoTestimonials: nextList });
      if (result.success) {
        setVideoTestimonials(nextList);
        setSuccess(
          nextList.find((x) => x.id === id)?.showOnHome !== false
            ? "Video will now show on the home page."
            : "Video hidden from the home page."
        );
      } else {
        setError(result.error ?? "Failed to update.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update. Please try again.");
    } finally {
      setVideoTogglingId(null);
    }
  }

  async function handleDeleteVideoTestimonial(id: string) {
    if (!confirm("Delete this video testimonial? It will be removed from the list and the home page.")) return;
    setError(null);
    setVideoDeletingId(id);
    try {
      const nextList = videoTestimonials.filter((v) => v.id !== id);
      const result = await updateHomeSettings({ videoTestimonials: nextList });
      if (result.success) {
        setVideoTestimonials(nextList);
        if (editingVideoId === id) handleCancelEditVideo();
        setSuccess("Video testimonial deleted from the home page.");
      } else {
        setError(result.error ?? "Failed to delete.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete. Please try again.");
    } finally {
      setVideoDeletingId(null);
    }
  }

  const loading = status === "loading";
  const saving = status === "saving";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[var(--font-playfair)] text-2xl tracking-tight">Home management</h1>
        <p className="mt-2 text-sm text-white/70">
          Edit the text and images for the home page, manage testimonials, and upload video testimonials.
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
          <button
            type="button"
            onClick={() => setActiveTab("videoTestimonials")}
            className={`rounded-t-lg px-4 py-2 text-sm font-medium transition ${
              activeTab === "videoTestimonials"
                ? "bg-white/10 text-accentGold"
                : "text-white/60 hover:bg-white/5 hover:text-white/80"
            }`}
          >
            Video testimonials
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
                          {t.displayName?.trim() || "Delegate"}
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
                For past delegates not in the system. Enter course, name and review.
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
                    placeholder="Short paragraph from the delegate..."
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

      {activeTab === "videoTestimonials" && (
        <section className="rounded-lg border border-white/10 bg-black/40 p-6">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-accentGold">
            Video testimonials
          </h2>
          <p className="mt-1 text-xs text-white/60">
            Add as many videos as you need. Use the list below to control which appear on the home page, or edit and delete entries.
          </p>

          {videoTestimonials.length > 0 && (
            <ul className="mt-6 space-y-3">
              {videoTestimonials.map((v) => (
                <li
                  key={v.id}
                  className="rounded-lg border border-white/10 bg-black/20 overflow-hidden"
                >
                  <div className="flex flex-wrap items-center justify-between gap-4 p-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-white">{v.name}</p>
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-medium ${
                            v.showOnHome !== false
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-white/10 text-white/50"
                          }`}
                        >
                          {v.showOnHome !== false ? "Shown on home" : "Hidden"}
                        </span>
                      </div>
                      {v.credentials && (
                        <p className="text-xs text-accentGold/90">{v.credentials}</p>
                      )}
                      {v.quote && (
                        <p className="mt-1 line-clamp-2 text-xs text-white/60">{v.quote}</p>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleShowOnHome(v.id)}
                        disabled={videoTogglingId === v.id || videoDeletingId === v.id}
                        title={v.showOnHome !== false ? "Hide from home page" : "Show on home page"}
                        className="rounded border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80 transition hover:bg-white/10 disabled:opacity-50 inline-flex items-center gap-1.5"
                        aria-label={v.showOnHome !== false ? "Hide from home page" : "Show on home page"}
                      >
                        {v.showOnHome !== false ? (
                          <Eye className="h-3.5 w-3.5" />
                        ) : (
                          <EyeOff className="h-3.5 w-3.5" />
                        )}
                        {videoTogglingId === v.id ? "…" : v.showOnHome !== false ? "Hide" : "Show"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStartEditVideo(v)}
                        disabled={videoDeletingId === v.id || !!editingVideoId}
                        className="rounded border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80 transition hover:bg-white/10 disabled:opacity-50 inline-flex items-center gap-1.5"
                        aria-label="Edit video testimonial"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteVideoTestimonial(v.id)}
                        disabled={videoDeletingId === v.id}
                        className="rounded border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 transition hover:bg-red-500/20 disabled:opacity-50 inline-flex items-center gap-1.5"
                        aria-label="Delete video testimonial"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {videoDeletingId === v.id ? "…" : "Delete"}
                      </button>
                    </div>
                  </div>
                  {editingVideoId === v.id && (
                    <form
                      onSubmit={handleSaveEditVideoTestimonial}
                      className="border-t border-white/10 bg-black/30 p-4 space-y-3"
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accentGold/90">
                        Edit video testimonial
                      </p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label htmlFor="edit-video-name" className="mb-1 block text-[11px] font-medium text-white/70">
                            Name *
                          </label>
                          <input
                            id="edit-video-name"
                            type="text"
                            value={editVideoName}
                            onChange={(e) => setEditVideoName(e.target.value)}
                            required
                            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-accentGold/50 focus:outline-none"
                            disabled={!!videoSavingId}
                          />
                        </div>
                        <div>
                          <label htmlFor="edit-video-credentials" className="mb-1 block text-[11px] font-medium text-white/70">
                            Credentials (optional)
                          </label>
                          <input
                            id="edit-video-credentials"
                            type="text"
                            value={editVideoCredentials}
                            onChange={(e) => setEditVideoCredentials(e.target.value)}
                            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-accentGold/50 focus:outline-none"
                            disabled={!!videoSavingId}
                          />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="edit-video-quote" className="mb-1 block text-[11px] font-medium text-white/70">
                          Short quote (optional)
                        </label>
                        <textarea
                          id="edit-video-quote"
                          rows={2}
                          value={editVideoQuote}
                          onChange={(e) => setEditVideoQuote(e.target.value)}
                          className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-accentGold/50 focus:outline-none"
                          disabled={!!videoSavingId}
                        />
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label htmlFor="edit-video-file" className="mb-1 block text-[11px] font-medium text-white/70">
                            Replace video (optional)
                          </label>
                          <input
                            id="edit-video-file"
                            type="file"
                            accept="video/mp4,video/webm"
                            onChange={(e) => setEditVideoFile(e.target.files?.[0] ?? null)}
                            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white file:mr-2 file:rounded file:border-0 file:bg-accentGold/20 file:px-3 file:py-1 file:text-xs file:text-accentGold"
                            disabled={!!videoSavingId}
                            aria-label="Replace video (optional)"
                          />
                          {editVideoFile && (
                            <p className="mt-1 text-[11px] text-white/50">{editVideoFile.name}</p>
                          )}
                        </div>
                        <div>
                          <label htmlFor="edit-poster-file" className="mb-1 block text-[11px] font-medium text-white/70">
                            Replace poster (optional)
                          </label>
                          <input
                            id="edit-poster-file"
                            type="file"
                            accept="image/*"
                            onChange={(e) => setEditPosterFile(e.target.files?.[0] ?? null)}
                            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white file:mr-2 file:rounded file:border-0 file:bg-accentGold/20 file:px-3 file:py-1 file:text-xs file:text-accentGold"
                            disabled={!!videoSavingId}
                            aria-label="Replace poster (optional)"
                          />
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="submit"
                          disabled={!!videoSavingId || !editVideoName.trim()}
                          className="rounded-lg bg-accentGold px-4 py-2 text-sm font-semibold text-background transition hover:bg-accentGold/90 disabled:opacity-60"
                        >
                          {videoSavingId === v.id ? "Saving…" : "Save changes"}
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEditVideo}
                          disabled={!!videoSavingId}
                          className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10 disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-6 rounded-lg border border-white/10 bg-black/20 p-4">
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-white/80">
              Add video testimonial
            </h3>
            <p className="mt-1 text-[11px] text-white/50">
              Upload a video (MP4 or WebM). Optional: poster image for the card thumbnail.
            </p>
            <form onSubmit={handleAddVideoTestimonial} className="mt-4 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="video-name" className="mb-1 block text-[11px] font-medium text-white/70">
                    Name *
                  </label>
                  <input
                    id="video-name"
                    type="text"
                    value={videoName}
                    onChange={(e) => setVideoName(e.target.value)}
                    required
                    placeholder="Dr. Jane Smith"
                    className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-accentGold/50 focus:outline-none"
                    disabled={videoUploading}
                  />
                </div>
                <div>
                  <label htmlFor="video-credentials" className="mb-1 block text-[11px] font-medium text-white/70">
                    Credentials (optional)
                  </label>
                  <input
                    id="video-credentials"
                    type="text"
                    value={videoCredentials}
                    onChange={(e) => setVideoCredentials(e.target.value)}
                    placeholder="BDS, MClinDent"
                    className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-accentGold/50 focus:outline-none"
                    disabled={videoUploading}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="video-quote" className="mb-1 block text-[11px] font-medium text-white/70">
                  Short quote (optional)
                </label>
                <textarea
                  id="video-quote"
                  rows={2}
                  value={videoQuote}
                  onChange={(e) => setVideoQuote(e.target.value)}
                  placeholder="One line shown on the card..."
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-accentGold/50 focus:outline-none"
                  disabled={videoUploading}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="add-video-file" className="mb-1 block text-[11px] font-medium text-white/70">
                    Video file (MP4 or WebM) *
                  </label>
                  <input
                    id="add-video-file"
                    type="file"
                    accept="video/mp4,video/webm"
                    onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
                    className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white file:mr-2 file:rounded file:border-0 file:bg-accentGold/20 file:px-3 file:py-1 file:text-xs file:text-accentGold"
                    disabled={videoUploading}
                    aria-label="Video file (MP4 or WebM)"
                  />
                  {videoFile && (
                    <p className="mt-1 text-[11px] text-white/50">
                      {videoFile.name} ({(videoFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="add-poster-file" className="mb-1 block text-[11px] font-medium text-white/70">
                    Poster image (optional)
                  </label>
                  <input
                    id="add-poster-file"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPosterFile(e.target.files?.[0] ?? null)}
                    className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white file:mr-2 file:rounded file:border-0 file:bg-accentGold/20 file:px-3 file:py-1 file:text-xs file:text-accentGold"
                    disabled={videoUploading}
                    aria-label="Poster image (optional)"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={videoUploading || !videoFile || !videoName.trim()}
                className="rounded-lg bg-accentGold px-4 py-2 text-sm font-semibold text-background transition hover:bg-accentGold/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {videoUploading ? "Uploading…" : "Add video testimonial"}
              </button>
            </form>
          </div>
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
                  placeholder="Kaleidoscope Dental Academy exists for Delegates who demand more..."
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

