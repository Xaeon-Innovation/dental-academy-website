"use client";

import { useState, useEffect, useRef } from "react";
import { X, ChevronLeft, ChevronRight, Image as ImageIcon } from "lucide-react";
import type { Case } from "@/types/case";

interface CaseDetailModalProps {
  open: boolean;
  caseItem: Case | null;
  onClose: () => void;
}

export default function CaseDetailModal({ open, caseItem, onClose }: CaseDetailModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const images = caseItem?.imageUrls?.length
    ? caseItem.imageUrls
    : caseItem?.imageUrl
    ? [caseItem.imageUrl]
    : [];

  useEffect(() => {
    if (open && images.length > 0) {
      setCurrentImageIndex(0);
    }
  }, [open, images.length]);

  function handleNext() {
    if (images.length === 0) return;
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  }

  function handlePrevious() {
    if (images.length === 0) return;
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  }

  useEffect(() => {
    if (!open) return;

    // Disable right-click context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // Disable keyboard shortcuts for screenshots
    const handleKeyDown = (e: KeyboardEvent) => {
      // Disable Print Screen (multiple variations)
      if (e.key === "PrintScreen" || e.keyCode === 44 || e.code === "PrintScreen") {
        e.preventDefault();
        e.stopPropagation();
        setShowWarning(true);
        setTimeout(() => setShowWarning(false), 5000);
        return false;
      }
      // Disable Windows + Print Screen
      if ((e.ctrlKey || e.metaKey || e.altKey) && (e.key === "PrintScreen" || e.keyCode === 44)) {
        e.preventDefault();
        e.stopPropagation();
        setShowWarning(true);
        setTimeout(() => setShowWarning(false), 5000);
        return false;
      }
      // Disable Alt + Print Screen
      if (e.altKey && (e.key === "PrintScreen" || e.keyCode === 44)) {
        e.preventDefault();
        e.stopPropagation();
        setShowWarning(true);
        setTimeout(() => setShowWarning(false), 5000);
        return false;
      }
      // Disable F12 (DevTools)
      if (e.key === "F12" || e.keyCode === 123) {
        e.preventDefault();
        e.stopPropagation();
        setShowWarning(true);
        setTimeout(() => setShowWarning(false), 3000);
        return false;
      }
      // Disable Ctrl+Shift+I (DevTools)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "I" || e.keyCode === 73)) {
        e.preventDefault();
        e.stopPropagation();
        setShowWarning(true);
        setTimeout(() => setShowWarning(false), 3000);
        return false;
      }
      // Disable Ctrl+Shift+C (DevTools)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "C" || e.keyCode === 67)) {
        e.preventDefault();
        e.stopPropagation();
        setShowWarning(true);
        setTimeout(() => setShowWarning(false), 3000);
        return false;
      }
      // Disable Ctrl+Shift+J (Console)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "J" || e.keyCode === 74)) {
        e.preventDefault();
        e.stopPropagation();
        setShowWarning(true);
        setTimeout(() => setShowWarning(false), 3000);
        return false;
      }
      // Disable Ctrl+U (View Source)
      if ((e.ctrlKey || e.metaKey) && (e.key === "u" || e.key === "U" || e.keyCode === 85)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      // Disable Ctrl+S (Save Page)
      if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "S" || e.keyCode === 83)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      // Disable Ctrl+P (Print)
      if ((e.ctrlKey || e.metaKey) && (e.key === "p" || e.key === "P" || e.keyCode === 80)) {
        e.preventDefault();
        e.stopPropagation();
        setShowWarning(true);
        setTimeout(() => setShowWarning(false), 3000);
        return false;
      }
      // Disable Ctrl+A (Select All)
      if ((e.ctrlKey || e.metaKey) && (e.key === "a" || e.key === "A" || e.keyCode === 65)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      // Escape to close modal
      if (e.key === "Escape") {
        onClose();
      }
      // Arrow keys for navigation
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrevious();
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNext();
      }
    };

    // Disable drag and drop
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
      return false;
    };

    // Disable text selection
    const handleSelectStart = (e: Event) => {
      e.preventDefault();
      return false;
    };

    // Disable copy completely
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setShowWarning(true);
      setTimeout(() => setShowWarning(false), 5000);
      // Clear clipboard
      if (e.clipboardData) {
        e.clipboardData.setData("text/plain", "");
        e.clipboardData.setData("text/html", "");
      }
      return false;
    };

    // Disable cut
    const handleCut = (e: ClipboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setShowWarning(true);
      setTimeout(() => setShowWarning(false), 5000);
      return false;
    };

    // Disable paste
    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    document.addEventListener("contextmenu", handleContextMenu, { capture: true });
    document.addEventListener("keydown", handleKeyDown, { capture: true });
    document.addEventListener("dragstart", handleDragStart, { capture: true });
    document.addEventListener("selectstart", handleSelectStart, { capture: true });
    document.addEventListener("copy", handleCopy, { capture: true });
    document.addEventListener("cut", handleCut, { capture: true });
    document.addEventListener("paste", handlePaste, { capture: true });

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu, { capture: true });
      document.removeEventListener("keydown", handleKeyDown, { capture: true });
      document.removeEventListener("dragstart", handleDragStart, { capture: true });
      document.removeEventListener("selectstart", handleSelectStart, { capture: true });
      document.removeEventListener("copy", handleCopy, { capture: true });
      document.removeEventListener("cut", handleCut, { capture: true });
      document.removeEventListener("paste", handlePaste, { capture: true });
    };
  }, [open, images.length, onClose]);

  if (!open || !caseItem) return null;

  return (
    <>
      {/* Warning Message */}
      {showWarning && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-md animate-pulse">
          <div className="rounded-lg border-2 border-red-500 bg-red-500/20 px-10 py-8 text-center backdrop-blur-lg shadow-2xl">
            <p className="text-2xl font-bold text-red-400 mb-3">
              ⚠️ SCREENSHOT PROTECTION ACTIVE
            </p>
            <p className="text-lg font-semibold text-white mb-2">
              Screenshots and copying are strictly prohibited
            </p>
            <p className="text-sm text-white/80">
              This content is protected by copyright. Unauthorized copying or distribution is illegal.
            </p>
          </div>
        </div>
      )}

      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 case-protected"
        onClick={onClose}
        style={{
          userSelect: "none",
          WebkitUserSelect: "none",
        }}
      >
        <div
          ref={modalRef}
          className="case-protected relative w-full max-w-6xl max-h-[90vh] rounded-lg border border-white/10 bg-background overflow-hidden"
          onClick={(e) => e.stopPropagation()}
          style={{
            userSelect: "none",
            WebkitUserSelect: "none",
          }}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-50 rounded-full bg-black/60 backdrop-blur-sm p-2 text-white/70 transition hover:bg-black/80 hover:text-white"
            title="Close (Esc)"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Watermark Overlay */}
          <div
            className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none"
            style={{
              background: "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.03) 10px, rgba(255,255,255,0.03) 20px)",
            }}
          >
            <div className="text-white/20 text-3xl font-bold select-none">
              KALEIDOSCOPE DENTAL
            </div>
          </div>

          {/* Image Gallery */}
          <div className="relative aspect-video w-full bg-black/20">
            {images.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <ImageIcon className="h-16 w-16 text-white/20" />
              </div>
            ) : (
              <>
                {/* Main Image */}
                <div className="relative h-full w-full">
                  <img
                    src={images[currentImageIndex]}
                    alt={`${caseItem.title} - Image ${currentImageIndex + 1}`}
                    className="h-full w-full object-contain"
                    draggable="false"
                    onContextMenu={(e) => e.preventDefault()}
                    onDragStart={(e) => e.preventDefault()}
                    style={{
                      userSelect: "none",
                      WebkitUserSelect: "none",
                      pointerEvents: "none",
                      touchAction: "none",
                    }}
                  />
                  
                  {/* Protection Overlay */}
                  <div
                    className="absolute inset-0 z-20"
                    onContextMenu={(e) => e.preventDefault()}
                    onDragStart={(e) => e.preventDefault()}
                    style={{
                      userSelect: "none",
                      WebkitUserSelect: "none",
                      pointerEvents: "auto",
                    }}
                  />

                  {/* Navigation Arrows */}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={handlePrevious}
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 rounded-full bg-black/60 backdrop-blur-sm p-2 text-white/70 transition hover:bg-black/80 hover:text-white"
                        title="Previous (←)"
                      >
                        <ChevronLeft className="h-6 w-6" />
                      </button>
                      <button
                        onClick={handleNext}
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 rounded-full bg-black/60 backdrop-blur-sm p-2 text-white/70 transition hover:bg-black/80 hover:text-white"
                        title="Next (→)"
                      >
                        <ChevronRight className="h-6 w-6" />
                      </button>
                    </>
                  )}

                  {/* Image Counter */}
                  {images.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 bg-black/60 backdrop-blur-sm px-4 py-2 rounded text-sm text-white">
                      {currentImageIndex + 1} / {images.length}
                    </div>
                  )}
                </div>

                {/* Thumbnail Strip */}
                {images.length > 1 && (
                  <div className="absolute bottom-0 left-0 right-0 z-30 bg-black/80 backdrop-blur-sm p-4 overflow-x-auto">
                    <div className="flex gap-2 justify-center">
                      {images.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`relative flex-shrink-0 h-16 w-16 rounded overflow-hidden border-2 transition ${
                            index === currentImageIndex
                              ? "border-accentGold"
                              : "border-white/20 hover:border-white/40"
                          }`}
                        >
                          <img
                            src={image}
                            alt={`Thumbnail ${index + 1}`}
                            className="h-full w-full object-cover"
                            draggable="false"
                            onContextMenu={(e) => e.preventDefault()}
                            onDragStart={(e) => e.preventDefault()}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Case Info */}
          <div className="p-6 relative z-10">
            <h2 className="font-[var(--font-playfair)] text-2xl font-semibold text-white mb-2 select-none">
              {caseItem.title}
            </h2>
            {caseItem.description && (
              <p className="text-white/70 select-none">{caseItem.description}</p>
            )}
          </div>

          {/* Additional Protection Layer */}
          <div
            className="absolute inset-0 z-40"
            onContextMenu={(e) => e.preventDefault()}
            onDragStart={(e) => e.preventDefault()}
            style={{
              userSelect: "none",
              WebkitUserSelect: "none",
              pointerEvents: "none",
            }}
          />
        </div>
      </div>
    </>
  );
}
