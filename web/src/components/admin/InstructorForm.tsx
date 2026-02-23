"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Upload, Image as ImageIcon } from "lucide-react";
import type { InstructorFormData } from "@/lib/validations/instructor";
import type { Instructor, InstructorPageVisibility } from "@/types/instructor";
import { INSTRUCTOR_PAGE_KEYS } from "@/types/instructor";
import { uploadInstructorImage } from "@/lib/actions/upload";

interface InstructorFormProps {
  instructor?: Instructor | null;
  onSubmit: (data: InstructorFormData) => Promise<{ success: boolean; error?: string }>;
}

export default function InstructorForm({ instructor, onSubmit }: InstructorFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    instructor?.imageUrl || null
  );

  const [form, setForm] = useState<Partial<InstructorFormData>>({
    name: instructor?.name || "",
    credentials: instructor?.credentials || "",
    bio: instructor?.bio || "",
    badges: instructor?.badges || [],
    imageUrl: instructor?.imageUrl || "",
    visibleOn: instructor?.visibleOn ?? ["home", "about", "courses"],
  });

  function updateField<K extends keyof InstructorFormData>(field: K, value: InstructorFormData[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function addBadge() {
    setForm((prev) => ({
      ...prev,
      badges: [...(prev.badges || []), ""],
    }));
  }

  function updateBadge(index: number, value: string) {
    setForm((prev) => {
      const badges = [...(prev.badges || [])];
      badges[index] = value;
      return { ...prev, badges };
    });
  }

  function removeBadge(index: number) {
    setForm((prev) => {
      const badges = [...(prev.badges || [])];
      badges.splice(index, 1);
      return { ...prev, badges };
    });
  }

  function toggleVisibleOn(page: InstructorPageVisibility) {
    setForm((prev) => {
      const current = prev.visibleOn || [];
      const next = current.includes(page)
        ? current.filter((p) => p !== page)
        : [...current, page];
      return { ...prev, visibleOn: next };
    });
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      setError("Image size must be less than 2MB");
      return;
    }

    setUploading(true);
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to public/images/instructors folder
    const result = await uploadInstructorImage(file);

    if (result.success) {
      updateField("imageUrl", result.url);
    } else {
      setError(result.error || "Failed to upload image");
      setImagePreview(form.imageUrl || null);
    }

    setUploading(false);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleRemoveImage() {
    setImagePreview(null);
    updateField("imageUrl", "");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const cleanedForm: InstructorFormData = {
      ...form,
      badges: form.badges?.filter((b) => b.trim()) || [],
      imageUrl: form.imageUrl?.trim() || undefined,
      visibleOn: form.visibleOn?.length ? form.visibleOn : undefined,
    } as InstructorFormData;

    setLoading(true);
    const result = await onSubmit(cleanedForm);
    setLoading(false);

    if (result.success) {
      router.push("/admin/instructors");
    } else {
      setError(result.error || "Failed to save instructor");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="name" className="mb-1 block text-xs text-white/70">
            Name *
          </label>
          <input
            id="name"
            type="text"
            required
            value={form.name || ""}
            onChange={(e) => updateField("name", e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white placeholder:text-white/40 focus:border-accentGold/50 focus:outline-none"
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="credentials" className="mb-1 block text-xs text-white/70">
            Credentials *
          </label>
          <input
            id="credentials"
            type="text"
            required
            value={form.credentials || ""}
            onChange={(e) => updateField("credentials", e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white placeholder:text-white/40 focus:border-accentGold/50 focus:outline-none"
            placeholder="BDS, MSc"
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="bio" className="mb-1 block text-xs text-white/70">
            Bio *
          </label>
          <textarea
            id="bio"
            rows={4}
            required
            value={form.bio || ""}
            onChange={(e) => updateField("bio", e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white placeholder:text-white/40 focus:border-accentGold/50 focus:outline-none"
            placeholder="Instructor biography..."
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs text-white/70">
            Instructor Photo
          </label>
          
          {/* Image Preview */}
          {imagePreview && (
            <div className="mb-4 relative inline-block">
              <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-white/10">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute -top-2 -right-2 rounded-full bg-red-500 p-1.5 text-white transition hover:bg-red-600"
                aria-label="Remove image"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}

          {/* Upload Button */}
          <div className="flex gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploading}
              className="hidden"
              id="imageUpload"
            />
            <label
              htmlFor="imageUpload"
              className={`flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-black/40 px-4 py-2 text-sm text-white transition hover:bg-white/10 ${
                uploading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {uploading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  {imagePreview ? "Change Image" : "Upload Image"}
                </>
              )}
            </label>
            
            {/* Manual URL Input (Optional) */}
            <div className="flex-1">
              <input
                id="imageUrl"
                type="text"
                value={form.imageUrl || ""}
                onChange={(e) => {
                  let value = e.target.value;
                  // Normalize Windows paths to web paths
                  if (value.includes("\\")) {
                    value = value.replace(/\\/g, "/");
                    // Remove "web/public" or "public" prefix if present
                    value = value.replace(/^(web\/)?public\//i, "");
                    // Ensure it starts with /
                    if (!value.startsWith("/") && !value.startsWith("http")) {
                      value = "/" + value;
                    }
                  }
                  updateField("imageUrl", value);
                  if (value) {
                    setImagePreview(value);
                  } else {
                    setImagePreview(null);
                  }
                }}
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white placeholder:text-white/40 focus:border-accentGold/50 focus:outline-none"
                placeholder="Or enter image URL manually (e.g., /images/instructors/photo.jpg)"
              />
            </div>
          </div>
          <p className="mt-1 text-xs text-white/50">
            Upload an image from your computer (saved to public/images/instructors/) or enter a URL. Max size: 2MB
          </p>
        </div>
        <div className="sm:col-span-2">
          <label className="mb-2 block text-xs text-white/70">
            Show on pages
          </label>
          <p className="mb-3 text-xs text-white/50">
            Choose where this instructor appears on the site. Uncheck all to hide from public pages until you set visibility.
          </p>
          <div className="flex flex-wrap gap-4">
            {INSTRUCTOR_PAGE_KEYS.map((page) => {
              const label =
                page === "home"
                  ? "Home"
                  : page === "about"
                    ? "About"
                    : "Courses";
              const checked = (form.visibleOn || []).includes(page);
              return (
                <label
                  key={page}
                  className="flex cursor-pointer items-center gap-2 text-sm text-white/90"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleVisibleOn(page)}
                    className="h-4 w-4 rounded border-white/20 bg-black/40 text-accentGold focus:ring-accentGold/50"
                  />
                  {label}
                </label>
              );
            })}
          </div>
        </div>
        <div className="sm:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs text-white/70">Badges</label>
            <button
              type="button"
              onClick={addBadge}
              className="flex items-center gap-1 rounded border border-white/10 px-2 py-1 text-xs text-white/70 transition hover:bg-white/10"
            >
              <Plus className="h-3 w-3" />
              Add Badge
            </button>
          </div>
          <div className="space-y-2">
            {(form.badges || []).map((badge, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={badge}
                  onChange={(e) => updateBadge(index, e.target.value)}
                  className="flex-1 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white placeholder:text-white/40 focus:border-accentGold/50 focus:outline-none"
                  placeholder="Badge text..."
                />
                <button
                  type="button"
                  onClick={() => removeBadge(index)}
                  className="rounded p-2 text-white/70 transition hover:bg-red-500/20 hover:text-red-400"
                  aria-label="Remove badge"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-3 border-t border-white/10 pt-6">
        <button
          type="submit"
          disabled={loading || uploading}
          className="rounded-lg bg-accentGold px-6 py-2.5 text-sm font-semibold text-background transition hover:bg-accentGold/90 disabled:opacity-50"
        >
          {loading ? "Saving..." : uploading ? "Uploading..." : instructor ? "Update Instructor" : "Create Instructor"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/instructors")}
          className="rounded-lg border border-white/10 bg-black/40 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
