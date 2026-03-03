"use client";

import { useState, useRef, useEffect } from "react";
import { X, Upload, Star, Trash2 } from "lucide-react";
import type { CaseFormData } from "@/lib/validations/case";
import type { Case } from "@/types/case";

interface CaseFormProps {
  caseItem?: Case | null;
  onSubmit: (data: CaseFormData) => Promise<{ success: boolean; error?: string }>;
  onCancel?: () => void;
}

export default function CaseForm({ caseItem, onSubmit, onCancel }: CaseFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingImages, setUploadingImages] = useState<Set<number>>(new Set());
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<Partial<CaseFormData>>({
    title: "",
    description: "",
    images: [],
    primaryImageIndex: 0,
  });

  // Sync form state when caseItem changes
  useEffect(() => {
    if (caseItem) {
      setForm({
        title: caseItem.title || "",
        description: caseItem.description || "",
        images: caseItem.images || [],
        primaryImageIndex: caseItem.primaryImageIndex ?? 0,
      });
    } else {
      setForm({
        title: "",
        description: "",
        images: [],
        primaryImageIndex: 0,
      });
    }
  }, [caseItem]);

  function updateField<K extends keyof CaseFormData>(field: K, value: CaseFormData[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate all files first
    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        setError("All files must be images.");
        return;
      }
    }

    // Upload all files using API route (handles large files better)
    const uploadPromises = files.map(async (file, index) => {
      const uploadIndex = (form.images?.length || 0) + index;
      setUploadingImages((prev) => new Set(prev).add(uploadIndex));
      
      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/upload/case-image", {
          method: "POST",
          body: formData,
        });

        const result = await response.json();
        
        setUploadingImages((prev) => {
          const next = new Set(prev);
          next.delete(uploadIndex);
          return next;
        });

        if (!response.ok || !result.success) {
          return { success: false as const, error: result.error || "Upload failed" };
        }

        return { success: true as const, url: result.url };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Upload failed";
        console.error("Upload error:", err);
        setUploadingImages((prev) => {
          const next = new Set(prev);
          next.delete(uploadIndex);
          return next;
        });
        return { success: false as const, error: errorMessage };
      }
    });

    const results = await Promise.all(uploadPromises);
    const successfulUploads = results.filter((r) => r.success) as { success: true; url: string }[];
    const failedUploads = results.filter((r) => !r.success) as { success: false; error: string }[];
    
    if (successfulUploads.length > 0) {
      const newImages = [...(form.images || []), ...successfulUploads.map((r) => r.url)];
      updateField("images", newImages);
    }

    if (failedUploads.length > 0) {
      const errorMessages = failedUploads.map((r) => r.error).filter(Boolean);
      const errorMsg = errorMessages.length > 0 
        ? `${failedUploads.length} image(s) failed to upload: ${errorMessages[0]}`
        : `${failedUploads.length} image(s) failed to upload.`;
      setError(errorMsg);
    }

    // Reset input
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  }

  function removeImage(index: number) {
    const newImages = [...(form.images || [])];
    newImages.splice(index, 1);
    
    // Adjust primaryImageIndex if needed
    let newPrimaryIndex = form.primaryImageIndex ?? 0;
    if (index === newPrimaryIndex && newImages.length > 0) {
      // If we removed the primary image, set first image as primary
      newPrimaryIndex = 0;
    } else if (index < newPrimaryIndex) {
      // If we removed an image before the primary, decrement the index
      newPrimaryIndex = Math.max(0, newPrimaryIndex - 1);
    } else if (newImages.length === 0) {
      newPrimaryIndex = 0;
    }
    
    updateField("images", newImages);
    updateField("primaryImageIndex", newPrimaryIndex);
  }

  function setPrimaryImage(index: number) {
    if (index >= 0 && index < (form.images?.length || 0)) {
      updateField("primaryImageIndex", index);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!form.title || !form.images || form.images.length === 0) {
      setError("Title and at least one image are required.");
      setLoading(false);
      return;
    }

    // Ensure primaryImageIndex is valid
    const primaryIndex = form.primaryImageIndex ?? 0;
    if (primaryIndex < 0 || primaryIndex >= form.images.length) {
      setError("Primary image index is invalid.");
      setLoading(false);
      return;
    }

    // Prepare data for submission
    const submitData: CaseFormData = {
      title: (form.title || "").trim(),
      description: form.description?.trim() || undefined,
      images: (form.images || []).filter((url) => url && url.trim().length > 0),
      primaryImageIndex: Number(primaryIndex),
    };

    // Validate images array is not empty
    if (submitData.images.length === 0) {
      setError("At least one image is required.");
      setLoading(false);
      return;
    }

    // Ensure primaryImageIndex is within bounds
    if (submitData.primaryImageIndex < 0 || submitData.primaryImageIndex >= submitData.images.length) {
      submitData.primaryImageIndex = 0;
    }

    console.log("Submitting case data:", submitData);

    const result = await onSubmit(submitData);
    
    if (!result.success) {
      setError(result.error || "Failed to save case.");
    }
    setLoading(false);
  }

  const images = form.images || [];
  const primaryIndex = form.primaryImageIndex ?? 0;
  const isUploading = uploadingImages.size > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-white">
          Title <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={form.title || ""}
          onChange={(e) => updateField("title", e.target.value)}
          className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2 text-white placeholder:text-white/40 focus:border-accentGold/50 focus:outline-none"
          placeholder="Enter case title"
          required
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-white">Description</label>
        <textarea
          value={form.description || ""}
          onChange={(e) => updateField("description", e.target.value)}
          rows={4}
          className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2 text-white placeholder:text-white/40 focus:border-accentGold/50 focus:outline-none"
          placeholder="Enter case description (optional)"
        />
      </div>

      {/* Images */}
      <div>
        <label className="block text-sm font-medium text-white">
          Images <span className="text-red-400">*</span>
        </label>
        <p className="mt-1 text-xs text-white/50 mb-3">
          Upload multiple images. Click the star icon to set the primary image (shown first).
        </p>

        {/* Image Upload Button */}
        <div className="mb-4">
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            disabled={isUploading}
            className="hidden"
            id="case-images-upload"
          />
          <label
            htmlFor="case-images-upload"
            className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-black/40 px-4 py-2 text-sm text-white transition hover:bg-white/10 ${
              isUploading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <Upload className="h-4 w-4" />
            {isUploading ? "Uploading..." : "Add Images"}
          </label>
        </div>

        {/* Images Grid */}
        {images.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((imageUrl, index) => (
              <div
                key={index}
                className={`relative group aspect-square rounded-lg overflow-hidden border-2 ${
                  index === primaryIndex
                    ? "border-accentGold"
                    : "border-white/10"
                }`}
              >
                <img
                  src={imageUrl}
                  alt={`Case image ${index + 1}`}
                  className="h-full w-full object-cover"
                />
                
                {/* Overlay with actions */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {/* Set Primary Button */}
                  <button
                    type="button"
                    onClick={() => setPrimaryImage(index)}
                    className={`p-2 rounded-full transition ${
                      index === primaryIndex
                        ? "bg-accentGold text-background"
                        : "bg-white/20 text-white hover:bg-white/30"
                    }`}
                    title={index === primaryIndex ? "Primary image" : "Set as primary"}
                  >
                    <Star className={`h-4 w-4 ${index === primaryIndex ? "fill-current" : ""}`} />
                  </button>
                  
                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="p-2 rounded-full bg-red-600/80 text-white hover:bg-red-600 transition"
                    title="Remove image"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Primary Badge */}
                {index === primaryIndex && (
                  <div className="absolute top-2 left-2 bg-accentGold text-background px-2 py-1 rounded text-xs font-semibold flex items-center gap-1">
                    <Star className="h-3 w-3 fill-current" />
                    Primary
                  </div>
                )}

                {/* Uploading Indicator */}
                {uploadingImages.has(index) && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <div className="text-white text-sm">Uploading...</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-white/10 bg-black/40 p-8 text-center">
            <p className="text-white/70 text-sm">No images uploaded yet. Click "Add Images" to get started.</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-lg border border-white/10 bg-black/40 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading || isUploading}
          className="flex-1 rounded-lg bg-accentGold px-4 py-2 text-sm font-semibold text-background transition hover:bg-accentGold/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Saving..." : caseItem ? "Update Case" : "Create Case"}
        </button>
      </div>
    </form>
  );
}
