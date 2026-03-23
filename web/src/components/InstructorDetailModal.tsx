"use client";

import { forwardRef, useEffect, useId } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { motion } from "motion/react";
import type { Instructor } from "@/types/instructor";

export type InstructorModalData = Pick<
  Instructor,
  "id" | "name" | "credentials" | "bio" | "badges" | "imageUrl"
>;

type InstructorDetailModalProps = {
  instructor: InstructorModalData;
  onClose: () => void;
};

export const InstructorDetailModal = forwardRef<
  HTMLDivElement,
  InstructorDetailModalProps
>(function InstructorDetailModal({ instructor, onClose }, ref) {
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const imageUrl =
    instructor.imageUrl || "/images/instructors/placeholder.png";

  return (
    <motion.div
      ref={ref}
      role="presentation"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="relative max-h-[min(90vh,900px)] w-full max-w-3xl overflow-y-auto rounded-2xl border border-white/10 bg-[#1c1c1e] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-full bg-black/50 p-2 text-white transition hover:bg-black/70"
          aria-label="Close profile"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex flex-col gap-6 p-6 pt-14 md:flex-row md:items-start md:gap-8 md:p-8 md:pt-8">
          {/* Use w-full max-w + explicit img size — min(100%,280px) + fill() was collapsing to 0 width in some flex contexts */}
          <div className="mx-auto w-full max-w-[280px] shrink-0 md:mx-0 md:w-[280px]">
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl border border-white/10 bg-white/5">
              <Image
                src={imageUrl}
                alt={instructor.name}
                width={280}
                height={374}
                className="h-full w-full object-cover object-top"
                sizes="280px"
                unoptimized={
                  imageUrl.startsWith("http://") ||
                  imageUrl.startsWith("https://")
                }
              />
            </div>
          </div>

          <div className="min-w-0 flex-1 text-left" id={descId}>
            <h2
              id={titleId}
              className="font-[var(--font-playfair)] text-2xl font-semibold tracking-tight text-white md:text-3xl"
            >
              {instructor.name}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-accentGold/95">
              {instructor.credentials}
            </p>
            {instructor.badges && instructor.badges.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-2">
                {instructor.badges.map((badge) => (
                  <li
                    key={badge}
                    className="rounded-full border border-accentGold/30 bg-accentGold/10 px-3 py-1 text-xs font-medium text-accentGold/90"
                  >
                    {badge}
                  </li>
                ))}
              </ul>
            )}
            {instructor.bio?.trim() ? (
              <div className="mt-5 space-y-3 text-sm leading-relaxed text-white/75">
                {instructor.bio.split(/\n\n+/).map((para, i) => (
                  <p key={i} className="whitespace-pre-line">
                    {para.trim()}
                  </p>
                ))}
              </div>
            ) : (
              <p className="mt-5 text-sm text-white/50">No biography provided.</p>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
});

InstructorDetailModal.displayName = "InstructorDetailModal";
