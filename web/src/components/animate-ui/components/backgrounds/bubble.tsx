"use client";

import {
  type ComponentPropsWithoutRef,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { motion, useMotionValue, useSpring } from "motion/react";
import { cn } from "@/lib/utils";

export type SpringOptions = {
  stiffness?: number;
  damping?: number;
};

export type BubbleColors = {
  first?: string;
  second?: string;
  third?: string;
  fourth?: string;
  fifth?: string;
  sixth?: string;
};

const DEFAULT_COLORS: BubbleColors = {
  first: "18,113,255",
  second: "221,74,255",
  third: "0,220,255",
  fourth: "200,50,50",
  fifth: "180,180,50",
  sixth: "140,100,255",
};

const DEFAULT_TRANSITION: SpringOptions = {
  stiffness: 100,
  damping: 20,
};

type BubbleBackgroundProps = ComponentPropsWithoutRef<"div"> & {
  interactive?: boolean;
  transition?: SpringOptions;
  colors?: BubbleColors;
};

const BLOB_ORIGINS: Array<{ x: string; y: string }> = [
  { x: "50%", y: "50%" },
  { x: "calc(50% - 400px)", y: "50%" },
  { x: "calc(50% + 400px)", y: "calc(50% + 200px)" },
  { x: "calc(50% - 200px)", y: "50%" },
  { x: "calc(50% - 800px)", y: "calc(50% + 200px)" },
  { x: "50%", y: "50%" },
];

export function BubbleBackground({
  interactive = false,
  transition = DEFAULT_TRANSITION,
  colors = DEFAULT_COLORS,
  className,
  ...props
}: BubbleBackgroundProps) {
  const ref = useRef<HTMLDivElement>(null);
  const filterId = useId().replace(/:/g, "");
  const [mounted, setMounted] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = {
    stiffness: transition.stiffness ?? 100,
    damping: transition.damping ?? 20,
  };
  const x = useSpring(mouseX, springConfig);
  const y = useSpring(mouseY, springConfig);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!interactive || !ref.current) return;
    const el = ref.current;
    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      mouseX.set((e.clientX - centerX) * 0.5);
      mouseY.set((e.clientY - centerY) * 0.5);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [interactive, mouseX, mouseY]);

  const c = { ...DEFAULT_COLORS, ...colors };
  const colorList = [c.first, c.second, c.third, c.fourth, c.fifth, c.sixth];

  if (!mounted) {
    return (
      <div
        ref={ref}
        className={cn("absolute inset-0 overflow-hidden", className)}
        aria-hidden
        {...props}
      />
    );
  }

  return (
    <div
      ref={ref}
      className={cn("absolute inset-0 overflow-hidden", className)}
      aria-hidden
      {...props}
    >
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div
          className="h-full w-full opacity-70"
          style={{ filter: `url(#${filterId}) blur(40px)` }}
        >
          <svg className="absolute h-0 w-0" aria-hidden>
            <defs>
              <filter id={filterId}>
                <feGaussianBlur
                  in="SourceGraphic"
                  stdDeviation="10"
                  result="blur"
                />
                <feColorMatrix
                  in="blur"
                  mode="matrix"
                  values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8"
                  result="goo"
                />
                <feBlend in="SourceGraphic" in2="goo" />
              </filter>
            </defs>
          </svg>

          {colorList.map((rgb, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full mix-blend-hard-light"
              style={{
                width: "80%",
                height: "80%",
                top: "50%",
                left: "50%",
                background: `radial-gradient(circle at center, rgba(${rgb}, 0.5) 0, rgba(${rgb}, 0) 50%)`,
                x: "-50%",
                y: "-50%",
                transformOrigin: `${BLOB_ORIGINS[i]?.x ?? "50%"} ${BLOB_ORIGINS[i]?.y ?? "50%"}`,
              }}
              animate={{
                rotate: [0, 180, 360],
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 20 + i * 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}

          {interactive && (
            <div
              className="absolute"
              style={{
                left: "50%",
                top: "50%",
                width: "100%",
                height: "100%",
                transform: "translate(-50%, -50%)",
              }}
            >
              <motion.div
                className="absolute inset-0 rounded-full mix-blend-hard-light"
                style={{
                  background: `radial-gradient(circle at center, rgba(${c.sixth}, 0.4) 0, rgba(${c.sixth}, 0) 50%)`,
                  x,
                  y,
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
