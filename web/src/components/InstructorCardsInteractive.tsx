"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { AnimatePresence } from "motion/react";
import { FadeIn } from "@/components/FadeIn";
import {
  InstructorDetailModal,
  type InstructorModalData,
} from "@/components/InstructorDetailModal";
import type { Instructor } from "@/types/instructor";

type InstructorCardModel = Pick<
  Instructor,
  "id" | "name" | "credentials" | "bio" | "badges" | "imageUrl"
>;

type InstructorCardsInteractiveProps = {
  instructors: InstructorCardModel[];
};

function toModalData(i: InstructorCardModel): InstructorModalData {
  return {
    id: i.id,
    name: i.name,
    credentials: i.credentials,
    bio: i.bio,
    badges: i.badges ?? [],
    imageUrl: i.imageUrl,
  };
}

export function InstructorCardsInteractive({
  instructors,
}: InstructorCardsInteractiveProps) {
  const [selected, setSelected] = useState<InstructorModalData | null>(null);

  const openProfile = useCallback((i: InstructorCardModel) => {
    setSelected(toModalData(i));
  }, []);

  const closeProfile = useCallback(() => {
    setSelected(null);
  }, []);

  if (instructors.length === 0) {
    return (
      <FadeIn className="w-full">
        <p className="w-full text-center text-sm text-white/50">
          No instructors available yet.
        </p>
      </FadeIn>
    );
  }

  return (
    <>
      {instructors.map((instructor, index) => {
        const bioPreview = instructor.bio
          ? instructor.bio.length > 120
            ? instructor.bio.substring(0, 120).trim() + "..."
            : instructor.bio
          : "";
        const imageUrl =
          instructor.imageUrl || "/images/instructors/placeholder.png";

        return (
          <FadeIn
            key={instructor.id}
            delay={0.06 * index}
            className="w-full max-w-[280px] sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]"
          >
            <button
              type="button"
              onClick={() => openProfile(instructor)}
              className="group relative w-full cursor-pointer overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] text-left transition hover:border-accentGold/20 hover:bg-white/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-accentGold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              aria-haspopup="dialog"
              aria-label={`View full profile: ${instructor.name}`}
            >
              <div className="aspect-[3/4] overflow-hidden rounded-t-2xl bg-white/5">
                <Image
                  src={imageUrl}
                  alt=""
                  width={320}
                  height={427}
                  className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-105"
                  unoptimized={
                    imageUrl.startsWith("http://") ||
                    imageUrl.startsWith("https://")
                  }
                />
              </div>
              <div className="p-5">
                <h3 className="font-semibold tracking-tight text-white">
                  {instructor.name}
                </h3>
                <p className="mt-1 text-xs text-accentGold/90">
                  {instructor.credentials}
                </p>
                {bioPreview && (
                  <p className="mt-2 text-sm leading-snug text-white/60">
                    {bioPreview}
                  </p>
                )}
              </div>
            </button>
          </FadeIn>
        );
      })}

      <AnimatePresence mode="wait">
        {selected ? (
          <InstructorDetailModal
            key={selected.id}
            instructor={selected}
            onClose={closeProfile}
          />
        ) : null}
      </AnimatePresence>
    </>
  );
}
