"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getVideoEmbedUrl } from "@/lib/video-testimonials";
import type { VideoTestimonialItem } from "@/types/settings";

interface VideoTestimonialModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: VideoTestimonialItem | null;
}

export function VideoTestimonialModal({
  isOpen,
  onClose,
  item,
}: VideoTestimonialModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const embed = item ? getVideoEmbedUrl(item.videoUrl) : null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4"
        onClick={onClose}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
          aria-label="Close video"
        >
          <X className="h-6 w-6" />
        </button>

        <div
          className="relative mx-auto w-full max-w-4xl flex flex-col items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          {item && (
            <div className="mb-3 text-center">
              <h3 className="font-[var(--font-playfair)] text-lg font-semibold text-white">
                {item.name}
              </h3>
              {item.credentials && (
                <p className="text-sm text-accentGold/90">{item.credentials}</p>
              )}
            </div>
          )}
          <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-2xl">
            {embed?.type === "youtube" || embed?.type === "vimeo" ? (
              <iframe
                src={embed.src}
                title={item?.name ?? "Video testimonial"}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="h-full w-full"
              />
            ) : embed?.type === "video" ? (
              <video
                src={embed.src}
                controls
                autoPlay
                className="h-full w-full"
                playsInline
              />
            ) : (
              <div className="flex h-full items-center justify-center text-white/60">
                Unable to play this video.
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
