"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";

type FadeInProps = {
  children: React.ReactNode;
  className?: string;
  /** Stagger delay in seconds */
  delay?: number;
  duration?: number;
  /** Initial vertical offset in px */
  y?: number;
} & Omit<HTMLMotionProps<"div">, "children" | "initial" | "animate" | "transition">;

/**
 * Scroll-triggered fade + slight rise. Respects `prefers-reduced-motion`.
 */
export function FadeIn({
  children,
  className = "",
  delay = 0,
  duration = 0.55,
  y = 18,
  ...rest
}: FadeInProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{
        duration,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
