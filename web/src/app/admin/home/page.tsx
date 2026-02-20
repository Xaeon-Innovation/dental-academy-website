"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Upload, X } from "lucide-react";
import type { HomeSettings } from "@/types/settings";
import { getHomeSettings, updateHomeSettings } from "@/lib/actions/settings";
import { uploadHomeImage } from "@/lib/actions/upload";

type Status = "idle" | "loading" | "saving";

export default function AdminHomeManagementPage() {
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
          Edit the text and images for the home page. Course tracks and instructors are managed
          elsewhere.
        </p>
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
    </div>
  );
}

