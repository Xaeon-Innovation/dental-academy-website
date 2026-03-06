"use client";

import {
  type ComponentPropsWithoutRef,
  type FC,
  useEffect,
  useRef,
} from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export interface TextRevealProps extends ComponentPropsWithoutRef<"span"> {
  children: string;
  /** Duration in seconds for each word reveal. Default 0.12. */
  wordDuration?: number;
  /** Timeline span (0–1) over which words are staggered. Higher = slower overall. Default 0.85. */
  timelineSpan?: number;
}

export const TextReveal: FC<TextRevealProps> = ({
  children,
  className,
  wordDuration = 0.12,
  timelineSpan = 0.85,
  ...props
}) => {
  const targetRef = useRef<HTMLSpanElement>(null);

  if (typeof children !== "string") {
    throw new Error("TextReveal: children must be a string");
  }

  const words = children.split(" ");

  useEffect(() => {
    const el = targetRef.current;
    if (!el) return;

    const wordSpans = el.querySelectorAll<HTMLSpanElement>(".text-reveal-word");
    if (wordSpans.length === 0) return;

    const stagger = Math.min(wordDuration, 1 / wordSpans.length);
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: el,
        start: "top 88%",
        toggleActions: "play none none none",
      },
    });

    wordSpans.forEach((span, i) => {
      const start = (i / wordSpans.length) * timelineSpan;
      tl.fromTo(
        span,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, ease: "power2.out", duration: stagger },
        start
      );
    });

    return () => {
      ScrollTrigger.getAll().forEach((t) => {
        if (t.trigger === el) t.kill();
      });
    };
  }, [children, wordDuration, timelineSpan]);

  return (
    <span ref={targetRef} className={className ?? ""} {...props}>
      {words.map((word, i) => (
        <span
          key={`${word}-${i}`}
          className="text-reveal-word inline-block whitespace-pre opacity-0"
          style={{ willChange: "opacity, transform" }}
        >
          {word}{" "}
        </span>
      ))}
    </span>
  );
};
