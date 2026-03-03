"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, Image as ImageIcon, X, Plus } from "lucide-react";
import type { CaseFormData } from "@/lib/validations/case";
import type { Case } from "@/types/case";
import { uploadCaseImage } from "@/lib/actions/upload";

interface CaseFormProps {
  caseItem?: Case | null;
  onSubmit: (data: CaseFormData) => Promise<{ success: boolean; error?: string }>;
  onCancel?: () => void;
}

export default function CaseForm({ caseItem, onSubmit, onCancel }: CaseFormProps) {
  const router = useRouter();
  const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState<{ [key: number]: boolean }>({});
  const [error, setError] = useState<string | null>(null);
  
  // Initialize with existing images or empty array
  const initialImages = caseItem?.imageUrls?.length 
    ? caseItem.imageUrls 
    : caseItem?.imageUrl 
    ? [caseItem.imageUrl] 
    : [];
  
  const [imageUrls, setImageUrls] = useState<string[]>(initialImages);
  const [imagePreviews, setImagePreviews] = useState<{ [key: number]: string }>({});

  const [form, setForm] = useState<Partial<CaseFormData>>({
    title: caseItem?.title || "",
    description: caseItem?.description || "",
    imageUrls: initialImages,
    order: caseItem?.order ?? 0,
  });

  function updateField<K extends keyof CaseFormData>(field: K, value: CaseFormData[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleImageUpload(index: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setError("Image size must be less than 10MB");
      return;
    }

    setUploading((prev) => ({ ...prev, [index]: true }));
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreviews((prev) => ({ ...prev, [index]: reader.result as string }));
    };
    reader.readAsDataURL(file);

    // Upload to public/images/cases folder
    const result = await uploadCaseImage(file);

    if (result.success) {
      const newImageUrls = [...imageUrls];
      if (index < newImageUrls.length) {
        // Replace existing image
        newImageUrls[index] = result.url;
      } else {
        // Add new image
        newImageUrls.push(result.url);
      }
      setImageUrls(newImageUrls);
      updateField("imageUrls", newImageUrls);
    } else {
      setError(result.error || "Failed to upload image");
      setImagePreviews((prev) => {
        const updated = { ...prev };
        delete updated[index];
        return updated;
      });
    }

    setUploading((prev) => ({ ...prev, [index]: false }));
    
    // Reset file input
    if (fileInputRefs.current[index]) {
      fileInputRefs.current[index]!.value = "";
    }
  }

  function handleRemoveImage(index: number) {
    const newImageUrls = imageUrls.filter((_, i) => i !== index);
    setImageUrls(newImageUrls);
    updateField("imageUrls", newImageUrls);
    
    // Clear preview
    setImagePreviews((prev) => {
      const updated = { ...prev };
      delete updated[index];
      // Shift previews for indices after removed image
      const shifted: { [key: number]: string } = {};
      Object.keys(updated).forEach((key) => {
        const idx = parseInt(key);
        if (idx > index) {
          shifted[idx - 1] = updated[idx];
        } else if (idx < index) {
          shifted[idx] = updated[idx];
        }
      });
      return shifted;
    });
  }

  function handleAddImageSlot() {
    const MAX_IMAGES = 20; // Maximum number of images per case
    if (imageUrls.length >= MAX_IMAGES) {
      setError(`Maximum ${MAX_IMAGES} images allowed per case`);
      return;
    }
    const newIndex = imageUrls.length;
    setImageUrls([...imageUrls, ""]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.title?.trim()) {
      setError("Title is required");
      return;
    }

    // Filter out empty strings and validate URLs
    const validImageUrls = imageUrls.filter((url) => {
      const trimmed = url?.trim();
      if (!trimmed) return false;
      // Validate URL format
      return trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("/");
    });

    if (validImageUrls.length === 0) {
      setError("At least one image is required");
      return;
    }

    const cleanedForm: CaseFormData = {
      title: form.title.trim(),
      description: form.description?.trim() || undefined,
      imageUrls: validImageUrls,
      order: form.order ?? 0,
    };

    setLoading(true);
    try {
      // Ensure form data is serializable before sending
      try {
        JSON.stringify(cleanedForm);
      } catch (serializeErr) {
        console.error("Form data serialization error:", serializeErr);
        setError("Invalid form data. Please check your inputs.");
        setLoading(false);
        return;
      }

      const result = await onSubmit(cleanedForm);
      
      // Validate result structure
      if (!result || typeof result !== 'object') {
        console.error("Invalid result from server:", result);
        setError("Invalid response from server");
        setLoading(false);
        return;
      }

      if (result.success) {
        router.push("/admin/cases");
        router.refresh();
      } else {
        setError(result.error || "Failed to save case");
      }
    } catch (err) {
      console.error("Form submission error:", err);
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  function handleCancelClick() {
    router.push("/admin/cases");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-white/90 mb-2">
          Title <span className="text-red-400">*</span>
        </label>
        <input
          id="title"
          type="text"
          value={form.title}
          onChange={(e) => updateField("title", e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2 text-white placeholder:text-white/40 focus:border-accentGold/50 focus:outline-none"
          placeholder="Enter case title"
          required
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-white/90 mb-2">
          Description
        </label>
        <textarea
          id="description"
          value={form.description || ""}
          onChange={(e) => updateField("description", e.target.value)}
          rows={4}
          className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2 text-white placeholder:text-white/40 focus:border-accentGold/50 focus:outline-none resize-none"
          placeholder="Enter case description (optional)"
        />
      </div>

      {/* Images Upload */}
      <div>
        <label className="block text-sm font-medium text-white/90 mb-2">
          Images <span className="text-red-400">*</span>
        </label>
        <p className="text-xs text-white/50 mb-4">
          Add multiple images to showcase different views of the case
        </p>
        
        <div className="space-y-4">
          {imageUrls.map((imageUrl, index) => (
            <div key={index} className="relative">
              {imageUrl || imagePreviews[index] ? (
                <div className="relative inline-block">
                  <img
                    src={imagePreviews[index] || imageUrl}
                    alt={`Preview ${index + 1}`}
                    className="h-48 w-48 rounded-lg object-cover border border-white/10"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute -top-2 -right-2 rounded-full bg-red-600 p-1.5 text-white transition hover:bg-red-700"
                    title="Remove image"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center w-full">
                  <label
                    htmlFor={`image-upload-${index}`}
                    className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition ${
                      uploading[index]
                        ? "border-accentGold/50 bg-accentGold/10"
                        : "border-white/20 bg-black/40 hover:border-white/30"
                    }`}
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {uploading[index] ? (
                        <>
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accentGold mb-2"></div>
                          <p className="mb-2 text-sm text-white/70">Uploading...</p>
                        </>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 mb-2 text-white/40" />
                          <p className="mb-2 text-sm text-white/70">
                            <span className="font-semibold">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-white/50">PNG, JPG, GIF up to 10MB</p>
                        </>
                      )}
                    </div>
                    <input
                      id={`image-upload-${index}`}
                      ref={(el) => {
                        fileInputRefs.current[index] = el;
                      }}
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(index, e)}
                      disabled={uploading[index]}
                    />
                  </label>
                </div>
              )}
            </div>
          ))}
          
          {/* Add Image Button */}
          <button
            type="button"
            onClick={handleAddImageSlot}
            className="flex items-center gap-2 rounded-lg border border-dashed border-white/20 bg-black/40 px-4 py-3 text-sm font-medium text-white/70 transition hover:border-accentGold/50 hover:bg-accentGold/10 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading || Object.values(uploading).some((u) => u) || imageUrls.length >= 20}
            title={imageUrls.length >= 20 ? "Maximum 20 images allowed" : "Add another image"}
          >
            <Plus className="h-4 w-4" />
            Add Another Image {imageUrls.length > 0 && `(${imageUrls.length}/20)`}
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={handleCancelClick}
          className="flex-1 rounded-lg border border-white/10 bg-black/40 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 rounded-lg bg-accentGold px-4 py-2 text-sm font-semibold text-background transition hover:bg-accentGold/90 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading || Object.values(uploading).some((u) => u)}
        >
          {loading ? "Saving..." : caseItem ? "Update Case" : "Create Case"}
        </button>
      </div>
    </form>
  );
}
