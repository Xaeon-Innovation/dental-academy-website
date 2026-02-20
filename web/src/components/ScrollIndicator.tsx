"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ChevronDown } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

export default function ScrollIndicator() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const arrowRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const arrow = arrowRef.current;
    if (!container || !arrow) return;

    const ctx = gsap.context(() => {
      gsap.timeline({ repeat: -1 }).to(arrow, {
        y: 8,
        duration: 0.6,
        ease: "power2.inOut",
      }).to(arrow, {
        y: 0,
        duration: 0.6,
        ease: "power2.inOut",
      });

      ScrollTrigger.create({
        trigger: document.body,
        start: "top top",
        end: "100px top",
        onUpdate: (self) => {
          gsap.set(container, { opacity: 1 - self.progress });
          (container as HTMLElement).style.pointerEvents =
            self.progress >= 1 ? "none" : "auto";
        },
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed top-24 right-4 z-20 flex flex-col items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2 backdrop-blur-sm md:top-28 md:right-6"
      aria-label="Scroll down"
    >
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-accentGold">
        scroll
      </span>
      <div ref={arrowRef} className="text-accentGold">
        <ChevronDown className="h-6 w-6" aria-hidden />
      </div>
    </div>
  );
}
