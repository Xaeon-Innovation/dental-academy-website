'use client';

import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import useImagePreloader from "@/hooks/useImagePreloader";

gsap.registerPlugin(ScrollTrigger);

const FRAME_COUNT = 240;
const FRAME_PATH = (index: number) =>
  `/hero-sequence/frame_${index.toString().padStart(3, "0")}.jpg`;

export default function HeroSequence() {
  const containerRef = useRef<HTMLElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const stickyRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [currentFrame, setCurrentFrame] = useState(0);

  const frames = useMemo(
    () => Array.from({ length: FRAME_COUNT }, (_, i) => FRAME_PATH(i)),
    []
  );

  const { images, isLoaded } = useImagePreloader(frames);

  const drawFrame = (frameIndex: number) => {
    const canvas = canvasRef.current;
    const image = images[frameIndex];
    if (!canvas || !image) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const { width: canvasWidth, height: canvasHeight } = canvas;
    const imgWidth = image.naturalWidth;
    const imgHeight = image.naturalHeight;
    if (!imgWidth || !imgHeight) return;

    const canvasAspect = canvasWidth / canvasHeight;
    const imageAspect = imgWidth / imgHeight;

    let renderWidth;
    let renderHeight;

    if (imageAspect > canvasAspect) {
      renderHeight = canvasHeight;
      renderWidth = (canvasHeight * imgWidth) / imgHeight;
    } else {
      renderWidth = canvasWidth;
      renderHeight = (canvasWidth * imgHeight) / imgWidth;
    }

    const x = (canvasWidth - renderWidth) / 2;
    const y = (canvasHeight - renderHeight) / 2;

    context.clearRect(0, 0, canvasWidth, canvasHeight);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(image, x, y, renderWidth, renderHeight);
  };

  const renderFrame = (frameIndex: number) => {
    const clampedIndex = Math.max(0, Math.min(FRAME_COUNT - 1, Math.round(frameIndex)));
    if (clampedIndex === currentFrame) return;
    setCurrentFrame(clampedIndex);
    window.requestAnimationFrame(() => drawFrame(clampedIndex));
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      const { innerWidth, innerHeight } = window;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = innerWidth * dpr;
      canvas.height = innerHeight * dpr;
      canvas.style.width = `${innerWidth}px`;
      canvas.style.height = `${innerHeight}px`;

      if (images[currentFrame]) {
        window.requestAnimationFrame(() => drawFrame(currentFrame));
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [currentFrame, images]);

  useEffect(() => {
    if (!isLoaded || !wrapRef.current || !stickyRef.current) return;

    const ctx = gsap.context(() => {
      const frameState = { frame: 0 };

      // IMPORTANT: Do not add onUpdate here that sets autoAlpha: 0 on the sticky. Canvas must stay visible so Philosophy can slide over it.
      const tl = gsap.timeline({
        scrollTrigger: {
          scrub: 1,
          pin: true,
          trigger: "#pin-hero",
          start: "50% 50%",
          endTrigger: "#pin-hero-wrap",
          end: "bottom 50%"
        }
      });

      // Full frame sequence 0→239 over the entire scroll (no frames cut)
      tl.to(
        frameState,
        {
          frame: FRAME_COUNT - 1,
          ease: "none",
          duration: 1,
          onUpdate: () => {
            renderFrame(frameState.frame);
          }
        },
        0
      );

      // IPLACE + "The Foundation" — animates in early during the frame sequence
      tl.fromTo(
        ".hero-text-start",
        { autoAlpha: 0, y: -80, scale: 0.94, transformOrigin: "left top" },
        { autoAlpha: 1, y: 0, scale: 1, ease: "power2.out", duration: 0.22, transformOrigin: "left top" },
        0.12
      );
      // iRestore + "The Perfection" — animates in mid-sequence so it’s visible before Our Philosophy
      tl.fromTo(
        ".hero-text-end",
        { autoAlpha: 0, y: 80, scale: 0.94, transformOrigin: "right bottom" },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.22, ease: "power2.out", transformOrigin: "right bottom" },
        0.38
      );
    }, containerRef);

    return () => ctx.revert();
  }, [isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      renderFrame(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded]);

  return (
    <section
      ref={containerRef}
      className="relative z-0 bg-background"
      aria-label="Implant sequence animation"
    >
      <div
        ref={wrapRef}
        id="pin-hero-wrap"
        className="h-[450vh]"
      >
        <div
          id="pin-hero"
          ref={stickyRef}
          className="sticky top-0 flex h-screen items-stretch justify-stretch overflow-hidden bg-black"
        >
        <canvas ref={canvasRef} className="relative block h-full w-full object-cover" />
        <div className="pointer-events-none absolute inset-0 z-10">
          <div
            className="hero-text-start absolute left-6 top-12 max-w-md text-left md:left-12 md:top-16 lg:left-16"
            style={{ opacity: 0, visibility: "hidden" }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accentGold">
              iPlace
            </p>
            <h1 className="font-[var(--font-playfair)] mt-2 text-3xl tracking-tight text-accentGold md:text-4xl lg:text-5xl">
              The Foundation
            </h1>
          </div>
          <div
            className="hero-text-end absolute bottom-12 right-6 max-w-md text-right md:bottom-16 md:right-12 lg:right-16"
            style={{ opacity: 0, visibility: "hidden" }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/70">
              iRestore
            </p>
            <h2 className="font-[var(--font-playfair)] mt-2 text-3xl tracking-tight text-white md:text-4xl lg:text-5xl">
              The Perfection
            </h2>
          </div>
        </div>
        {!isLoaded && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black">
            <p className="text-xs uppercase tracking-[0.2em] text-white/40">
              Preparing sequence…
            </p>
          </div>
        )}
        </div>
      </div>
    </section>
  );
}