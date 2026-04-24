"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { HomeCtaButtons } from "@/components/HomeCtaButtons";
import type { EnquiryCourseOption } from "@/components/EnquiryModal";

gsap.registerPlugin(ScrollTrigger);

type HomeHeroCtasProps = {
  /** Introductory headline above the primary buttons (before Our Philosophy). */
  introTitle: string;
  availableCourses?: EnquiryCourseOption[];
};

export function HomeHeroCtas({ introTitle, availableCourses = [] }: HomeHeroCtasProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const trigger = ScrollTrigger.create({
      trigger: "#pin-hero-wrap",
      // Show CTAs right as the pinned sequence finishes (before Philosophy comes in).
      start: "bottom bottom",
      onEnter: () => {
        setRevealed(true);
        // Fade in once (no fade-out on reverse scroll).
        gsap.fromTo(
          el,
          { autoAlpha: 0, y: 8 },
          { autoAlpha: 1, y: 0, duration: 0.35, ease: "power2.out" }
        );
      },
    });

    return () => trigger.kill();
  }, []);

  return (
    <section
      ref={sectionRef}
      className={`relative z-40 bg-background px-4 pt-12 pb-14 text-white sm:pt-14 md:pt-16 sm:pb-16 md:pb-20 ${
        revealed ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
      aria-label="Primary calls to action"
    >
      <div className="mx-auto max-w-3xl px-2 text-center">
        <h2 className="font-[var(--font-playfair)] text-2xl font-normal leading-snug tracking-tight text-white sm:text-3xl md:text-[2rem]">
          {introTitle}
        </h2>
      </div>
      <div className="mt-2">
        <HomeCtaButtons availableCourses={availableCourses} />
      </div>
    </section>
  );
}

