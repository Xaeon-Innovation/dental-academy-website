"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, X, Trash2, Upload } from "lucide-react";
import type { CourseFormData } from "@/lib/validations/course";
import type { Course, CourseBatch } from "@/types/course";
import { getCourses } from "@/lib/actions/course";
import { getInstructors } from "@/lib/actions/instructor";
import type { Instructor } from "@/types/instructor";
import { uploadCourseLayoutImage } from "@/lib/actions/upload";
import { cleanAgendaDays } from "@/lib/course-agenda-by-batch";

interface CourseFormProps {
  course?: Course | null;
  onSubmit: (data: CourseFormData) => Promise<{ success: boolean; error?: string }>; // eslint-disable-line no-unused-vars
  onCancel?: () => void;
}

function parseDisplayDateRangeToStartEnd(dateRange: string | undefined): { start: string; end: string } {
  const raw = (dateRange || "").trim();
  if (!raw) return { start: "", end: "" };
  const match = raw.match(/(\d{1,2}\s+\w+(?:\s+\d{4})?)\s*[–-]\s*(\d{1,2}\s+\w+(?:\s+\d{4})?)/i);
  if (!match) return { start: "", end: "" };
  return { start: match[1].replace(/\s+/g, " ").trim(), end: match[2].replace(/\s+/g, " ").trim() };
}

function formatDisplayDateRange(start: string, end: string): string {
  const s = start.trim();
  const e = end.trim();
  if (!s || !e) return "";
  const yearMatch = `${s} ${e}`.match(/\b(20\d{2})\b/);
  const year = yearMatch?.[1] ?? String(new Date().getFullYear());
  const stripYear = (v: string) => v.replace(new RegExp(`\\s*,?\\s*${year}\\s*$`, "i"), "").trim();
  const left = stripYear(s);
  const right = stripYear(e);
  return `${left} – ${right}, ${year}`;
}

export default function CourseForm({ course, onSubmit, onCancel }: CourseFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [allInstructors, setAllInstructors] = useState<Instructor[]>([]);
  const [legacyStartDate, setLegacyStartDate] = useState<string>("");
  const [legacyEndDate, setLegacyEndDate] = useState<string>("");
  const [batchDateDrafts, setBatchDateDrafts] = useState<Record<string, { start: string; end: string }>>(() => {
    const map: Record<string, { start: string; end: string }> = {};
    for (const b of course?.batches || []) {
      map[b.id] = parseDisplayDateRangeToStartEnd(b.dateRange);
    }
    return map;
  });
  const [agendaTargetBatchId, setAgendaTargetBatchId] = useState<string>(
    course?.batches?.[0]?.id ?? ""
  );
  const layoutImageInputRef = useRef<HTMLInputElement>(null);
  const [uploadingLayoutImage, setUploadingLayoutImage] = useState(false);
  const [layoutImagePreview, setLayoutImagePreview] = useState<string | null>(
    course?.layoutImageUrl || null
  );
  const [limitMaxDelegates, setLimitMaxDelegates] = useState(
    Boolean(course?.maxParticipants)
  );

  const [form, setForm] = useState<Partial<CourseFormData>>({
    title: course?.title || "",
    slug: course?.slug || "",
    description: course?.description || "",
    cpd: course?.cpd || "",
    provider: course?.provider || "",
    status: course?.status || "open",
    order: course?.order ?? 0,
    dateRange: course?.dateRange || "",
    duration: course?.duration || "",
    location: course?.location || "",
    maxParticipants: course?.maxParticipants,
    registrationBadge: course?.registrationBadge || "",
    overview: course?.overview || [],
    learningPoints: course?.learningPoints || [],
    agenda: course?.agenda || [],
    requirements: course?.requirements || [],
    instructors: course?.instructors || (course?.instructor ? [course.instructor] : []),
    pricing: course?.pricing || {
      currency: undefined,
      standard: { amount: "", from: "" },
    },
    packageIncludes: course?.packageIncludes || [],
    relatedCourseSlugs: course?.relatedCourseSlugs || [],
    layoutImageUrl: course?.layoutImageUrl || "",
    batches: course?.batches || [],
  });

  // Parse legacy course.dateRange to extract start/end for single-cohort editing (no batches).
  useEffect(() => {
    if (course?.dateRange) {
      const { start, end } = parseDisplayDateRangeToStartEnd(course.dateRange);
      if (start && end) {
        setTimeout(() => {
          setLegacyStartDate(start);
          setLegacyEndDate(end);
        }, 0);
      }
    }
  }, [course]);

  // Keep per-batch start/end drafts in sync with batch ids (add/remove/replace).
  const batchesSignature = (form.batches || []).map((b) => `${b.id}:${b.dateRange || ""}`).join("|");
  useEffect(() => {
    const batches = form.batches || [];
    const ids = new Set(batches.map((b) => b.id));
    setBatchDateDrafts((prev) => {
      const next: Record<string, { start: string; end: string }> = {};
      for (const b of batches) {
        const existing = prev[b.id];
        next[b.id] = existing && (existing.start || existing.end) ? existing : parseDisplayDateRangeToStartEnd(b.dateRange);
      }
      return next;
    });
    setAgendaTargetBatchId((current) => {
      if (current && ids.has(current)) return current;
      return batches[0]?.id ?? "";
    });
  }, [batchesSignature]);

  // Load all courses for related courses selection
  useEffect(() => {
    async function loadCourses() {
      const courses = await getCourses();
      setAllCourses(courses);
    }
    loadCourses();
  }, []);

  // Load all instructors
  useEffect(() => {
    async function loadInstructors() {
      const instructors = await getInstructors();
      setAllInstructors(instructors);
    }
    loadInstructors();
  }, []);

  // Auto-generate slug from title
  useEffect(() => {
    if (!course && form.title && !form.slug) {
      const slug = form.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      // Use setTimeout to avoid synchronous setState in effect
      setTimeout(() => {
        setForm((prev) => ({ ...prev, slug }));
      }, 0);
    }
  }, [form.title, form.slug, course]);

  function updateField<K extends keyof CourseFormData>(field: K, value: CourseFormData[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: "" }));
    }
  }

  async function handleLayoutImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      setError("Image size must be less than 2MB");
      return;
    }
    setUploadingLayoutImage(true);
    setError(null);
    const reader = new FileReader();
    reader.onloadend = () => setLayoutImagePreview(reader.result as string);
    reader.readAsDataURL(file);
    const result = await uploadCourseLayoutImage(file);
    if (result.success) {
      updateField("layoutImageUrl", result.url);
      setLayoutImagePreview(result.url);
    } else {
      setError(result.error || "Failed to upload image");
      setLayoutImagePreview(form.layoutImageUrl || null);
    }
    setUploadingLayoutImage(false);
    if (layoutImageInputRef.current) layoutImageInputRef.current.value = "";
  }

  function handleRemoveLayoutImage() {
    setLayoutImagePreview(null);
    updateField("layoutImageUrl", "");
    if (layoutImageInputRef.current) layoutImageInputRef.current.value = "";
  }

  function addArrayItem(field: "overview" | "learningPoints" | "packageIncludes" | "requirements") {
    setForm((prev) => ({
      ...prev,
      [field]: [...(prev[field] || []), ""],
    }));
  }

  function updateArrayItem(
    field: "overview" | "learningPoints" | "packageIncludes" | "requirements",
    index: number,
    value: string
  ) {
    setForm((prev) => {
      const arr = [...(prev[field] || [])];
      arr[index] = value;
      return { ...prev, [field]: arr };
    });
  }

  function removeArrayItem(
    field: "overview" | "learningPoints" | "packageIncludes" | "requirements",
    index: number
  ) {
    setForm((prev) => {
      const arr = [...(prev[field] || [])];
      arr.splice(index, 1);
      return { ...prev, [field]: arr };
    });
  }

  function addAgendaDay() {
    setForm((prev) => ({
      ...prev,
      agenda: [
        ...(prev.agenda || []),
        { day: "", date: "", title: "", time: "", items: [] },
      ],
    }));
  }

  function addBatch() {
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `batch_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const next = [
      ...(form.batches || []),
      {
        id,
        label: "",
        dateRange: "",
        duration: (form.duration || "").trim(),
        location: (form.location || "").trim(),
        earlyBirdUntil: "",
      },
    ];
    updateField("batches", next);
  }

  function updateBatch<K extends keyof CourseBatch>(index: number, field: K, value: CourseBatch[K]) {
    const next = [...(form.batches || [])];
    next[index] = { ...next[index], [field]: value };
    updateField("batches", next);
  }

  function removeBatch(index: number) {
    const next = [...(form.batches || [])];
    next.splice(index, 1);
    updateField("batches", next);
  }

  function updateAgendaDay(index: number, field: string, value: string | string[]) {
    setForm((prev) => {
      const agenda = [...(prev.agenda || [])];
      agenda[index] = { ...agenda[index], [field]: value };
      return { ...prev, agenda };
    });
  }

  function addAgendaItem(agendaIndex: number) {
    setForm((prev) => {
      const agenda = [...(prev.agenda || [])];
      agenda[agendaIndex] = {
        ...agenda[agendaIndex],
        items: [...(agenda[agendaIndex].items || []), ""],
      };
      return { ...prev, agenda };
    });
  }

  function removeAgendaDay(index: number) {
    setForm((prev) => {
      const agenda = [...(prev.agenda || [])];
      agenda.splice(index, 1);
      return { ...prev, agenda };
    });
  }


  // Generate agenda days from date range and duration
  function generateAgendaDays() {
    const batches = form.batches || [];
    const hasBatches = batches.length > 0;

    const startDate = hasBatches
      ? (agendaTargetBatchId ? batchDateDrafts[agendaTargetBatchId]?.start ?? "" : "")
      : legacyStartDate;
    const endDate = hasBatches
      ? (agendaTargetBatchId ? batchDateDrafts[agendaTargetBatchId]?.end ?? "" : "")
      : legacyEndDate;

    const batchIndex = hasBatches ? batches.findIndex((b) => b.id === agendaTargetBatchId) : -1;
    const durationForGen =
      hasBatches && batchIndex >= 0 ? (batches[batchIndex]?.duration || "").trim() : (form.duration || "").trim();

    if (!startDate || !endDate || !durationForGen) return;

    try {
      // Parse dates (assuming format like "15 May" or "15 May 2026")
      const currentYear = new Date().getFullYear();
      const parseDate = (dateStr: string): Date => {
        const parts = dateStr.trim().split(/\s+/);
        const day = parseInt(parts[0]);
        const monthNames = [
          "january", "february", "march", "april", "may", "june",
          "july", "august", "september", "october", "november", "december"
        ];
        const month = monthNames.findIndex(m => m.startsWith(parts[1].toLowerCase()));
        const year = parts[2] ? parseInt(parts[2]) : currentYear;
        return new Date(year, month, day);
      };

      const start = parseDate(startDate);
      const end = parseDate(endDate);
      const days: typeof form.agenda = [];
      const dayNames = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
      const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

      // Preserve existing agenda content if available (per-batch when generating for a cohort)
      const existingAgenda =
        hasBatches && batchIndex >= 0 && (batches[batchIndex]?.agenda?.length ?? 0) > 0
          ? batches[batchIndex]!.agenda!
          : form.agenda || [];
      const existingByDate = new Map(existingAgenda.map((a) => [a.date, a]));

      let currentDate = new Date(start);

      while (currentDate <= end) {
        const dayName = dayNames[currentDate.getDay()];
        const dateStr = `${currentDate.getDate()} ${monthNames[currentDate.getMonth()]}`;
        
        const existing = existingByDate.get(dateStr);
        days.push({
          day: existing?.day || dayName,
          date: dateStr,
          title: existing?.title || "",
          time: existing?.time || "Full Day",
          items: existing?.items || [],
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }

      setForm((prev) => ({ ...prev, agenda: days }));

      // Update dateRange (legacy single-cohort) OR batch display range
      const dateRangeStr = formatDisplayDateRange(startDate, endDate) || `${startDate} – ${endDate}, ${currentYear}`;
      if (hasBatches && batchIndex >= 0) {
        const nextBatches = [...batches];
        nextBatches[batchIndex] = {
          ...nextBatches[batchIndex],
          dateRange: dateRangeStr,
          agenda: days,
        };
        updateField("batches", nextBatches);
      } else {
        updateField("dateRange", dateRangeStr);
      }
    } catch (err) {
      console.error("Error generating agenda days:", err);
    }
  }

  // Note: Removed auto-generation on change to allow manual control

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const cleanedAgenda = cleanAgendaDays(form.agenda);
    const hasBatches = Boolean(form.batches?.length);
    const cleanedBatches = hasBatches
      ? (form.batches ?? []).map((batch) => {
          const agenda =
            agendaTargetBatchId && batch.id === agendaTargetBatchId
              ? cleanedAgenda
              : cleanAgendaDays(batch.agenda);
          return { ...batch, agenda };
        })
      : form.batches;

    // Clean up empty strings from arrays
    const cleanedForm: CourseFormData = {
      ...form,
      overview: form.overview?.filter((s) => s.trim()) || [],
      learningPoints: form.learningPoints?.filter((s) => s.trim()) || [],
      packageIncludes: form.packageIncludes?.filter((s) => s.trim()) || [],
      requirements: form.requirements?.filter((s) => s.trim()) || [],
      agenda: cleanedAgenda,
      batches: cleanedBatches,
      instructors: form.instructors?.filter((i) => i.name.trim()) || [],
      // Unlimited capacity: omit the field so updateCourse can delete it from Firestore
      maxParticipants: limitMaxDelegates ? form.maxParticipants : undefined,
    } as CourseFormData;

    // One source of truth for early-bird cutoff when cohorts exist: `batches[].earlyBirdUntil`.
    if ((cleanedForm.batches?.length ?? 0) > 0 && cleanedForm.pricing?.earlyBird) {
      cleanedForm.pricing = {
        ...cleanedForm.pricing,
        earlyBird: { amount: cleanedForm.pricing.earlyBird.amount },
      };
    }

    setLoading(true);
    const result = await onSubmit(cleanedForm);
    setLoading(false);

    if (result.success) {
      router.push("/admin/courses");
    } else {
      setError(result.error || "Failed to save course");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {/* Basic Information */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-accentGold">
          Basic Information
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="title" className="mb-1 block text-xs text-white/70">
              Title *
            </label>
            <input
              id="title"
              type="text"
              required
              value={form.title || ""}
              onChange={(e) => updateField("title", e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white placeholder:text-white/40 focus:border-accentGold/50 focus:outline-none"
            />
            {fieldErrors.title && <p className="mt-1 text-xs text-red-400">{fieldErrors.title}</p>}
          </div>
          <div>
            <label htmlFor="slug" className="mb-1 block text-xs text-white/70">
              Slug *
            </label>
            <input
              id="slug"
              type="text"
              required
              value={form.slug || ""}
              onChange={(e) => updateField("slug", e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white placeholder:text-white/40 focus:border-accentGold/50 focus:outline-none"
            />
            {fieldErrors.slug && <p className="mt-1 text-xs text-red-400">{fieldErrors.slug}</p>}
          </div>
          <div>
            <label htmlFor="status" className="mb-1 block text-xs text-white/70">
              Status *
            </label>
            <select
              id="status"
              required
              value={form.status || "open"}
              onChange={(e) => updateField("status", e.target.value as "open" | "closed")}
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white focus:border-accentGold/50 focus:outline-none"
            >
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="description" className="mb-1 block text-xs text-white/70">
              Description *
            </label>
            <textarea
              id="description"
              required
              rows={3}
              value={form.description || ""}
              onChange={(e) => updateField("description", e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white placeholder:text-white/40 focus:border-accentGold/50 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="cpd" className="mb-1 block text-xs text-white/70">
              CPD Hours
            </label>
            <input
              id="cpd"
              type="text"
              value={form.cpd || ""}
              onChange={(e) => updateField("cpd", e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white placeholder:text-white/40 focus:border-accentGold/50 focus:outline-none"
              placeholder="60 Hrs of CPD"
            />
          </div>
          <div>
            <label htmlFor="provider" className="mb-1 block text-xs text-white/70">
              Provider
            </label>
            <input
              id="provider"
              type="text"
              value={form.provider || ""}
              onChange={(e) => updateField("provider", e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white placeholder:text-white/40 focus:border-accentGold/50 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="order" className="mb-1 block text-xs text-white/70">
              Order
            </label>
            <input
              id="order"
              type="number"
              min="0"
              value={form.order ?? 0}
              onChange={(e) => updateField("order", parseInt(e.target.value) || 0)}
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white placeholder:text-white/40 focus:border-accentGold/50 focus:outline-none"
            />
          </div>
        </div>
      </section>

      {/* Layout / Thumbnail Image (course card) */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-accentGold">
          Card layout image
        </h2>
        <p className="text-xs text-white/60">
          Optional cover image for the course card on the courses listing (shown as full-card background, faded on the left for text). You can upload a new image, change it by uploading again, or remove it with the × on the preview. Remember to save the course after changing or removing.
        </p>
        <div className="space-y-3">
          {layoutImagePreview && (
            <div className="relative inline-block">
              <img
                src={layoutImagePreview}
                alt="Layout preview"
                className="h-24 w-auto rounded-lg border border-white/10 object-cover"
              />
              <button
                type="button"
                onClick={handleRemoveLayoutImage}
                className="absolute -top-2 -right-2 rounded-full bg-red-500 p-1.5 text-white transition hover:bg-red-600"
                aria-label="Remove layout image"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          <input
            ref={layoutImageInputRef}
            type="file"
            accept="image/*"
            onChange={handleLayoutImageUpload}
            disabled={uploadingLayoutImage}
            className="hidden"
            id="course-layout-image"
          />
          <label
            htmlFor="course-layout-image"
            className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-black/40 px-4 py-2 text-sm text-white transition hover:bg-white/10 ${
              uploadingLayoutImage ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <Upload className="h-4 w-4" />
            {uploadingLayoutImage ? "Uploading..." : layoutImagePreview ? "Change image" : "Upload image"}
          </label>
        </div>
      </section>

      {/* Capacity (course-level) + legacy dates when not using batches */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-accentGold">
          Capacity & scheduling (course-level)
        </h2>
        <p className="text-xs text-white/60">
          If you add <span className="text-white/80">Batches</span> below, put each cohort&apos;s dates, duration, and location on the batch.
          Keep this section for overall capacity (and optional legacy fields if you are not using batches yet).
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {!(form.batches && form.batches.length > 0) ? (
            <>
              <div>
                <label htmlFor="legacyStartDate" className="mb-1 block text-xs text-white/70">
                  Start Date
                </label>
                <input
                  id="legacyStartDate"
                  type="text"
                  value={legacyStartDate}
                  onChange={(e) => {
                    setLegacyStartDate(e.target.value);
                    if (legacyEndDate && form.duration) {
                      setTimeout(() => generateAgendaDays(), 100);
                    }
                  }}
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white placeholder:text-white/40 focus:border-accentGold/50 focus:outline-none"
                  placeholder="15 May"
                />
                <p className="mt-1 text-xs text-white/50">Format: &quot;15 May&quot; or &quot;15 May 2026&quot;</p>
              </div>
              <div>
                <label htmlFor="legacyEndDate" className="mb-1 block text-xs text-white/70">
                  End Date
                </label>
                <input
                  id="legacyEndDate"
                  type="text"
                  value={legacyEndDate}
                  onChange={(e) => {
                    setLegacyEndDate(e.target.value);
                    if (legacyStartDate && form.duration) {
                      setTimeout(() => generateAgendaDays(), 100);
                    }
                  }}
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white placeholder:text-white/40 focus:border-accentGold/50 focus:outline-none"
                  placeholder="22 May"
                />
                <p className="mt-1 text-xs text-white/50">Format: &quot;22 May&quot; or &quot;22 May 2026&quot;</p>
              </div>
              <div>
                <label htmlFor="dateRange" className="mb-1 block text-xs text-white/70">
                  Date Range (Display)
                </label>
                <input
                  id="dateRange"
                  type="text"
                  value={form.dateRange || ""}
                  onChange={(e) => updateField("dateRange", e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white placeholder:text-white/40 focus:border-accentGold/50 focus:outline-none"
                  placeholder="15 May – 22 May, 2026"
                />
                <p className="mt-1 text-xs text-white/50">Auto-generated from start/end dates when you generate agenda days</p>
              </div>
              <div>
                <label htmlFor="duration" className="mb-1 block text-xs text-white/70">
                  Duration
                </label>
                <input
                  id="duration"
                  type="text"
                  value={form.duration || ""}
                  onChange={(e) => {
                    updateField("duration", e.target.value);
                    if (legacyStartDate && legacyEndDate) {
                      setTimeout(() => generateAgendaDays(), 100);
                    }
                  }}
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white placeholder:text-white/40 focus:border-accentGold/50 focus:outline-none"
                  placeholder="8 Days (3 days theory, 3 days clinical hands-on)"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="location" className="mb-1 block text-xs text-white/70">
                  Location
                </label>
                <input
                  id="location"
                  type="text"
                  value={form.location || ""}
                  onChange={(e) => updateField("location", e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white placeholder:text-white/40 focus:border-accentGold/50 focus:outline-none"
                />
              </div>
            </>
          ) : (
            <div className="sm:col-span-2 rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/70">
              This course uses <span className="text-white/85">Batches</span>. Dates, duration, and location should be edited per batch (below).
            </div>
          )}
          <div>
            <label className="mb-2 flex items-center gap-2 text-xs text-white/70">
              <input
                type="checkbox"
                checked={limitMaxDelegates}
                onChange={(e) => setLimitMaxDelegates(e.target.checked)}
                className="rounded border-white/10 bg-black/40 text-accentGold focus:ring-accentGold/50"
              />
              Limit max delegates
            </label>
            <label htmlFor="maxParticipants" className="mb-1 block text-xs text-white/70">
              Max Delegates
            </label>
            <input
              id="maxParticipants"
              type="number"
              min="1"
              value={form.maxParticipants || ""}
              onChange={(e) => updateField("maxParticipants", e.target.value ? parseInt(e.target.value) : undefined)}
              disabled={!limitMaxDelegates}
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white placeholder:text-white/40 focus:border-accentGold/50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            />
            {!limitMaxDelegates && (
              <p className="mt-1 text-xs text-white/50">
                No capacity limit — spots left will be hidden on the public courses page.
              </p>
            )}
          </div>
          <div>
            <label htmlFor="registrationBadge" className="mb-1 block text-xs text-white/70">
              Registration Badge
            </label>
            <input
              id="registrationBadge"
              type="text"
              value={form.registrationBadge || ""}
              onChange={(e) => updateField("registrationBadge", e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white placeholder:text-white/40 focus:border-accentGold/50 focus:outline-none"
              placeholder="Open Registration"
            />
          </div>
        </div>
      </section>

      {/* Batches (multiple dates per course) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-accentGold">
            Batches
          </h2>
          <button
            type="button"
            onClick={addBatch}
            className="flex items-center gap-1 rounded border border-white/10 px-2 py-1 text-xs text-white/70 transition hover:bg-white/10"
          >
            <Plus className="h-3 w-3" />
            Add Batch
          </button>
        </div>
        <p className="text-xs text-white/60">
          Add multiple cohorts for the same course (e.g. May + September). Each batch can have its own dates, duration, location, and Early Bird cutoff.
        </p>
        <div className="space-y-3">
          {(form.batches || []).length === 0 ? (
            <div className="rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-sm text-white/60">
              No batches yet. Add one to enable multiple cohorts.
            </div>
          ) : (
            (form.batches || []).map((batch, index: number) => (
              <div key={batch.id ?? index} className="rounded-lg border border-white/10 bg-black/40 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-white">
                    Batch {index + 1}
                  </p>
                  <button
                    type="button"
                    onClick={() => removeBatch(index)}
                    className="rounded p-1 text-white/70 transition hover:bg-red-500/20 hover:text-red-400"
                    aria-label="Remove batch"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs text-white/70">Label *</label>
                    <input
                      type="text"
                      value={batch.label || ""}
                      onChange={(e) => updateBatch(index, "label", e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-white placeholder:text-white/40 focus:border-accentGold/50 focus:outline-none"
                      placeholder="May 2026"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-white/70">Early Bird Until</label>
                    <input
                      type="text"
                      value={batch.earlyBirdUntil || ""}
                      onChange={(e) => updateBatch(index, "earlyBirdUntil", e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-white placeholder:text-white/40 focus:border-accentGold/50 focus:outline-none"
                      placeholder="1 July 2026"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-white/70">Start Date</label>
                    <input
                      type="text"
                      value={batchDateDrafts[batch.id]?.start ?? ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        setBatchDateDrafts((prev) => ({ ...prev, [batch.id]: { start: v, end: prev[batch.id]?.end ?? "" } }));
                      }}
                      className="w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-white placeholder:text-white/40 focus:border-accentGold/50 focus:outline-none"
                      placeholder="15 May"
                    />
                    <p className="mt-1 text-xs text-white/45">Used for agenda generation</p>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-white/70">End Date</label>
                    <input
                      type="text"
                      value={batchDateDrafts[batch.id]?.end ?? ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        setBatchDateDrafts((prev) => ({ ...prev, [batch.id]: { start: prev[batch.id]?.start ?? "", end: v } }));
                      }}
                      className="w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-white placeholder:text-white/40 focus:border-accentGold/50 focus:outline-none"
                      placeholder="22 May"
                    />
                    <p className="mt-1 text-xs text-white/45">Used for agenda generation</p>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-white/70">Duration</label>
                    <input
                      type="text"
                      value={batch.duration || ""}
                      onChange={(e) => updateBatch(index, "duration", e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-white placeholder:text-white/40 focus:border-accentGold/50 focus:outline-none"
                      placeholder="8 Days (3 days theory, 3 days clinical hands-on)"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-white/70">Location</label>
                    <input
                      type="text"
                      value={batch.location || ""}
                      onChange={(e) => updateBatch(index, "location", e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-white placeholder:text-white/40 focus:border-accentGold/50 focus:outline-none"
                      placeholder="Cairo"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs text-white/70">Date Range (Display) *</label>
                    <input
                      type="text"
                      value={batch.dateRange || ""}
                      onChange={(e) => updateBatch(index, "dateRange", e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-white placeholder:text-white/40 focus:border-accentGold/50 focus:outline-none"
                      placeholder="15 May – 22 May, 2026"
                    />
                    <p className="mt-1 text-xs text-white/45">Tip: click Generate Days in Course Agenda (choose this batch) to auto-fill this from start/end.</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Pricing */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-accentGold">
          Pricing
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="currency" className="mb-1 block text-xs text-white/70">
              Currency
            </label>
            <select
              id="currency"
              value={form.pricing?.currency || ""}
              onChange={(e) =>
                updateField("pricing", {
                  ...form.pricing,
                  currency: e.target.value as "EUR" | "EGP" | "USD" | undefined,
                  standard: form.pricing?.standard || { amount: "", from: "" },
                })
              }
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white focus:border-accentGold/50 focus:outline-none"
            >
              <option value="">Select currency</option>
              <option value="EUR">Euro (€)</option>
              <option value="EGP">Egyptian Pound (EGP)</option>
              <option value="USD">US Dollar ($)</option>
            </select>
          </div>
          <div>
            <label htmlFor="earlyBirdAmount" className="mb-1 block text-xs text-white/70">
              Early Bird Amount
            </label>
            <input
              id="earlyBirdAmount"
              type="text"
              value={form.pricing?.earlyBird?.amount || ""}
              onChange={(e) => {
                const hasBatchCohorts = (form.batches?.length ?? 0) > 0;
                updateField("pricing", {
                  ...form.pricing,
                  earlyBird: hasBatchCohorts
                    ? { amount: e.target.value }
                    : {
                        amount: e.target.value,
                        until: form.pricing?.earlyBird?.until || "",
                      },
                  standard: form.pricing?.standard || { amount: "", from: "" },
                });
              }}
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white placeholder:text-white/40 focus:border-accentGold/50 focus:outline-none"
              placeholder="£6,995"
            />
          </div>
          {form.batches && form.batches.length > 0 ? (
            <div className="sm:col-span-2 rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-xs text-white/65">
              <span className="font-medium text-white/80">Early bird deadline</span> is set per batch above
              (Early Bird Until on each cohort). The course-level pricing block only needs the early-bird{" "}
              <span className="text-white/80">amount</span>.
            </div>
          ) : (
            <div>
              <label htmlFor="earlyBirdUntil" className="mb-1 block text-xs text-white/70">
                Early Bird Until
              </label>
              <input
                id="earlyBirdUntil"
                type="text"
                value={form.pricing?.earlyBird?.until || ""}
                onChange={(e) =>
                  updateField("pricing", {
                    ...form.pricing,
                    earlyBird: {
                      ...form.pricing?.earlyBird,
                      amount: form.pricing?.earlyBird?.amount || "",
                      until: e.target.value,
                    },
                    standard: form.pricing?.standard || { amount: "", from: "" },
                  })
                }
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white placeholder:text-white/40 focus:border-accentGold/50 focus:outline-none"
                placeholder="31 March 2026"
              />
            </div>
          )}
          <div>
            <label htmlFor="standardAmount" className="mb-1 block text-xs text-white/70">
              Standard Amount *
            </label>
            <input
              id="standardAmount"
              type="text"
              required
              value={form.pricing?.standard?.amount || ""}
              onChange={(e) =>
                updateField("pricing", {
                  ...form.pricing,
                  standard: {
                    amount: e.target.value,
                    from: form.pricing?.standard?.from || "",
                  },
                })
              }
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white placeholder:text-white/40 focus:border-accentGold/50 focus:outline-none"
              placeholder="£7,995"
            />
          </div>
          <div>
            <label htmlFor="standardFrom" className="mb-1 block text-xs text-white/70">
              Standard From *
            </label>
            <input
              id="standardFrom"
              type="text"
              required
              value={form.pricing?.standard?.from || ""}
              onChange={(e) =>
                updateField("pricing", {
                  ...form.pricing,
                  standard: {
                    amount: form.pricing?.standard?.amount || "",
                    from: e.target.value,
                  },
                })
              }
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white placeholder:text-white/40 focus:border-accentGold/50 focus:outline-none"
              placeholder="1 April 2026"
            />
          </div>
          <div>
            <label htmlFor="singleOccupancyUpgrade" className="mb-1 block text-xs text-white/70">
              Single Occupancy Upgrade
            </label>
            <input
              id="singleOccupancyUpgrade"
              type="text"
              value={form.pricing?.singleOccupancyUpgrade || ""}
              onChange={(e) =>
                updateField("pricing", {
                  ...form.pricing,
                  singleOccupancyUpgrade: e.target.value,
                  standard: form.pricing?.standard || { amount: "", from: "" },
                })
              }
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white placeholder:text-white/40 focus:border-accentGold/50 focus:outline-none"
              placeholder="£500"
            />
          </div>
        </div>
      </section>

      {/* Package Includes */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-accentGold">
            Package Includes
          </h2>
          <button
            type="button"
            onClick={() => addArrayItem("packageIncludes")}
            className="flex items-center gap-1 rounded border border-white/10 px-2 py-1 text-xs text-white/70 transition hover:bg-white/10"
          >
            <Plus className="h-3 w-3" />
            Add Item
          </button>
        </div>
        <div className="space-y-2">
          {(form.packageIncludes || []).map((item, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={item}
                onChange={(e) => updateArrayItem("packageIncludes", index, e.target.value)}
                className="flex-1 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white placeholder:text-white/40 focus:border-accentGold/50 focus:outline-none"
                placeholder="e.g., Flights"
              />
              <button
                type="button"
                onClick={() => removeArrayItem("packageIncludes", index)}
                className="rounded p-2 text-white/70 transition hover:bg-red-500/20 hover:text-red-400"
                aria-label="Remove package item"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Overview */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-accentGold">
            Course Overview
          </h2>
          <button
            type="button"
            onClick={() => addArrayItem("overview")}
            className="flex items-center gap-1 rounded border border-white/10 px-2 py-1 text-xs text-white/70 transition hover:bg-white/10"
          >
            <Plus className="h-3 w-3" />
            Add Paragraph
          </button>
        </div>
        <div className="space-y-2">
          {(form.overview || []).map((para, index) => (
            <div key={index} className="flex gap-2">
              <textarea
                rows={3}
                value={para}
                onChange={(e) => updateArrayItem("overview", index, e.target.value)}
                className="flex-1 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white placeholder:text-white/40 focus:border-accentGold/50 focus:outline-none"
                placeholder="Overview paragraph..."
              />
              <button
                type="button"
                onClick={() => removeArrayItem("overview", index)}
                className="rounded p-2 text-white/70 transition hover:bg-red-500/20 hover:text-red-400"
                aria-label="Remove overview paragraph"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* What You Will Learn */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-accentGold">
            What You Will Learn
          </h2>
          <button
            type="button"
            onClick={() => addArrayItem("learningPoints")}
            className="flex items-center gap-1 rounded border border-white/10 px-2 py-1 text-xs text-white/70 transition hover:bg-white/10"
          >
            <Plus className="h-3 w-3" />
            Add Point
          </button>
        </div>
        <div className="space-y-2">
          {(form.learningPoints || []).map((point, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={point}
                onChange={(e) => updateArrayItem("learningPoints", index, e.target.value)}
                className="flex-1 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white placeholder:text-white/40 focus:border-accentGold/50 focus:outline-none"
                placeholder="Learning point..."
              />
              <button
                type="button"
                onClick={() => removeArrayItem("learningPoints", index)}
                className="rounded p-2 text-white/70 transition hover:bg-red-500/20 hover:text-red-400"
                aria-label="Remove learning point"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Course Agenda */}
      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-accentGold">
            Course Agenda
          </h2>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
            {(form.batches || []).length > 0 ? (
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
                <label className="text-xs text-white/60" htmlFor="agendaTargetBatch">
                  Generate for batch
                </label>
                <select
                  id="agendaTargetBatch"
                  value={agendaTargetBatchId}
                  onChange={(e) => setAgendaTargetBatchId(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-accentGold/50 focus:outline-none sm:w-56"
                >
                  {(form.batches || []).map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.label?.trim() ? b.label : b.id}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            <button
              type="button"
              onClick={generateAgendaDays}
              className="flex items-center gap-1 rounded border border-white/10 px-2 py-1 text-xs text-white/70 transition hover:bg-white/10"
            >
              Generate Days
            </button>
            <button
              type="button"
              onClick={addAgendaDay}
              className="flex items-center gap-1 rounded border border-white/10 px-2 py-1 text-xs text-white/70 transition hover:bg-white/10"
            >
              <Plus className="h-3 w-3" />
              Add Day
            </button>
          </div>
        </div>
        {(!form.agenda || form.agenda.length === 0) &&
          ((form.batches || []).length > 0
            ? Boolean(agendaTargetBatchId && batchDateDrafts[agendaTargetBatchId]?.start && batchDateDrafts[agendaTargetBatchId]?.end)
            : Boolean(legacyStartDate && legacyEndDate)) && (
          <div className="rounded-lg border border-accentGold/30 bg-accentGold/10 px-4 py-3 text-sm text-accentGold">
            {(form.batches || []).length > 0 ? (
              <>
                Set the selected batch&apos;s start/end dates and duration, then click &quot;Generate Days&quot; to auto-create agenda days (and update that
                batch&apos;s display date range).
              </>
            ) : (
              <>Set start date, end date, and duration, then click &quot;Generate Days&quot; to auto-create agenda days.</>
            )}
          </div>
        )}
        <div className="space-y-4">
          {(form.agenda || []).map((day, index) => (
            <div key={index} className="rounded-lg border border-white/10 bg-black/40 p-4">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-medium text-white">Day {index + 1}</h3>
                <button
                  type="button"
                  onClick={() => removeAgendaDay(index)}
                  className="rounded p-1 text-white/70 transition hover:bg-red-500/20 hover:text-red-400"
                  aria-label="Remove agenda day"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-white/70">Day (Auto-generated)</label>
                  <input
                    type="text"
                    value={day.day}
                    readOnly
                    className="w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-white/50 cursor-not-allowed"
                    placeholder="FRIDAY"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-white/70">Date (Auto-generated)</label>
                  <input
                    type="text"
                    value={day.date}
                    readOnly
                    className="w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-white/50 cursor-not-allowed"
                    placeholder="15 May"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs text-white/70">Title</label>
                  <input
                    type="text"
                    value={day.title}
                    onChange={(e) => updateAgendaDay(index, "title", e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-white placeholder:text-white/40 focus:border-accentGold/50 focus:outline-none"
                    placeholder="Arrival & Welcome"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs text-white/70">Time</label>
                  <input
                    type="text"
                    value={day.time}
                    onChange={(e) => updateAgendaDay(index, "time", e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-white placeholder:text-white/40 focus:border-accentGold/50 focus:outline-none"
                    placeholder="Evening"
                  />
                </div>
                <div className="sm:col-span-2">
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-xs text-white/70">Items</label>
                    <button
                      type="button"
                      onClick={() => addAgendaItem(index)}
                      className="flex items-center gap-1 rounded border border-white/10 px-2 py-1 text-xs text-white/70 transition hover:bg-white/10"
                    >
                      <Plus className="h-3 w-3" />
                      Add Item
                    </button>
                  </div>
                  <div className="space-y-2">
                    {(day.items || []).map((item, itemIndex) => (
                      <div key={itemIndex} className="flex gap-2">
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => {
                            const items = [...(day.items || [])];
                            items[itemIndex] = e.target.value;
                            updateAgendaDay(index, "items", items);
                          }}
                          className="flex-1 rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-white placeholder:text-white/40 focus:border-accentGold/50 focus:outline-none"
                          placeholder="Agenda item..."
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const items = [...(day.items || [])];
                            items.splice(itemIndex, 1);
                            updateAgendaDay(index, "items", items);
                          }}
                          className="rounded p-2 text-white/70 transition hover:bg-red-500/20 hover:text-red-400"
                          aria-label="Remove agenda item"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Instructors */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-accentGold">
            Instructors
          </h2>
          <Link
            href="/admin/instructors"
            className="flex items-center gap-1 rounded border border-white/10 px-2 py-1 text-xs text-white/70 transition hover:bg-white/10"
          >
            Manage Instructors
          </Link>
        </div>
        <div className="space-y-2">
          {allInstructors.length === 0 ? (
            <p className="text-sm text-white/50">
              No instructors available.{" "}
              <Link href="/admin/instructors" className="text-accentGold underline">
                Create instructors first
              </Link>
            </p>
          ) : (
            allInstructors.map((instructor) => {
              const isSelected = (form.instructors || []).some(
                (i) => i.name === instructor.name && i.credentials === instructor.credentials
              );
              return (
                <label key={instructor.id} className="flex items-start gap-3 rounded-lg border border-white/10 bg-black/40 p-3 transition hover:bg-white/5">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      const currentInstructors = form.instructors || [];
                      if (e.target.checked) {
                        // Add instructor
                        updateField("instructors", [
                          ...currentInstructors,
                          {
                            name: instructor.name,
                            credentials: instructor.credentials,
                            bio: instructor.bio,
                            badges: instructor.badges || [],
                            imageUrl: instructor.imageUrl,
                          },
                        ]);
                      } else {
                        // Remove instructor
                        updateField(
                          "instructors",
                          currentInstructors.filter(
                            (i) => !(i.name === instructor.name && i.credentials === instructor.credentials)
                          )
                        );
                      }
                    }}
                    className="mt-1 rounded border-white/10 bg-black/40 text-accentGold focus:ring-accentGold/50"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-white">{instructor.name}</p>
                    <p className="mt-0.5 text-xs text-accentGold/90">{instructor.credentials}</p>
                    <p className="mt-2 text-xs text-white/70 line-clamp-2">{instructor.bio}</p>
                  </div>
                </label>
              );
            })
          )}
        </div>
      </section>

      {/* Related Courses */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-accentGold">
          Related Courses
        </h2>
        <div className="space-y-2">
          {allCourses
            .filter((c) => c.id !== course?.id)
            .map((c) => (
              <label key={c.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={(form.relatedCourseSlugs || []).includes(c.slug)}
                  onChange={(e) => {
                    const slugs = form.relatedCourseSlugs || [];
                    if (e.target.checked) {
                      updateField("relatedCourseSlugs", [...slugs, c.slug]);
                    } else {
                      updateField(
                        "relatedCourseSlugs",
                        slugs.filter((s) => s !== c.slug)
                      );
                    }
                  }}
                  className="rounded border-white/10 bg-black/40 text-accentGold focus:ring-accentGold/50"
                />
                <span className="text-sm text-white/80">{c.title}</span>
              </label>
            ))}
          {allCourses.filter((c) => c.id !== course?.id).length === 0 && (
            <p className="text-sm text-white/50">No other courses available</p>
          )}
        </div>
      </section>

      {/* Form Actions */}
      <div className="flex gap-3 border-t border-white/10 pt-6">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-accentGold px-6 py-2.5 text-sm font-semibold text-background transition hover:bg-accentGold/90 disabled:opacity-50"
        >
          {loading ? "Saving..." : course ? "Update Course" : "Create Course"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-white/10 bg-black/40 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
