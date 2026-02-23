"use client";

import React, { useCallback, useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  type MotionValue,
} from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface HeroParallaxProduct {
  title: string;
  link: string;
  thumbnail: string;
}

const springConfig = { stiffness: 300, damping: 30, bounce: 100 };
/** One card (30rem) + gap (5rem) in px for horizontal step */
const HORIZONTAL_STEP_PX = 560;

export function HeroParallax({
  products,
  title = "The Ultimate development studio",
  description = "We build beautiful products with the latest technologies and frameworks. We are a team of passionate developers and designers that love to build amazing products.",
}: {
  products: HeroParallaxProduct[];
  title?: string;
  description?: string;
}) {
  const firstRow = products.slice(0, 5);
  const secondRow = products.slice(5, 10);
  const thirdRow = products.slice(10, 15);
  const ref = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const translateX = useSpring(
    useTransform(scrollYProgress, [0, 1], [0, 1000]),
    springConfig
  );
  const translateXReverse = useSpring(
    useTransform(scrollYProgress, [0, 1], [0, -1000]),
    springConfig
  );
  const rotateX = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [15, 0]),
    springConfig
  );
  const opacity = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [0.2, 1]),
    springConfig
  );
  const rotateZ = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [20, 0]),
    springConfig
  );
  const translateY = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [-700, 500]),
    springConfig
  );

  const rowCount = 5;
  const [rowOffsets, setRowOffsets] = useState([0, 0, 0]);
  const setRowOffset = useCallback((rowIndex: number, updater: (prev: number) => number) => {
    setRowOffsets((prev) => {
      const next = [...prev];
      const current = next[rowIndex];
      next[rowIndex] = ((updater(current) % rowCount) + rowCount) % rowCount;
      return next;
    });
  }, []);

  return (
    <div
      ref={ref}
      className="relative flex h-[300vh] flex-col self-auto overflow-hidden py-40 antialiased [perspective:1000px] [transform-style:preserve-3d]"
    >
      <Header title={title} description={description} />
      <motion.div
        style={{
          rotateX,
          rotateZ,
          translateY,
          opacity,
        }}
        className="overflow-visible"
      >
        <div className="flex flex-col gap-20">
          <CaseRow
            products={firstRow}
            scrollTranslate={translateX}
            direction="reverse"
            offset={rowOffsets[0]}
            onPrev={() => setRowOffset(0, (o) => o - 1)}
            onNext={() => setRowOffset(0, (o) => o + 1)}
          />
          <CaseRow
            products={secondRow}
            scrollTranslate={translateXReverse}
            direction="normal"
            offset={rowOffsets[1]}
            onPrev={() => setRowOffset(1, (o) => o - 1)}
            onNext={() => setRowOffset(1, (o) => o + 1)}
          />
          <CaseRow
            products={thirdRow}
            scrollTranslate={translateX}
            direction="reverse"
            offset={rowOffsets[2]}
            onPrev={() => setRowOffset(2, (o) => o - 1)}
            onNext={() => setRowOffset(2, (o) => o + 1)}
          />
        </div>
      </motion.div>
    </div>
  );
}

const ROW_TRANSITION = { type: "spring" as const, stiffness: 300, damping: 30 };

function CaseRow({
  products,
  scrollTranslate,
  direction,
  offset,
  onPrev,
  onNext,
}: {
  products: HeroParallaxProduct[];
  scrollTranslate: MotionValue<number>;
  direction: "normal" | "reverse";
  offset: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  const count = products.length;

  return (
    <div
      className="flex items-center gap-4"
      aria-label="Case row navigation"
    >
      <div className="min-w-0 flex-1 overflow-hidden">
        <motion.div
          className={`flex gap-20 ${direction === "reverse" ? "flex-row-reverse" : "flex-row"}`}
          animate={{ x: direction === "reverse" ? offset * HORIZONTAL_STEP_PX : -offset * HORIZONTAL_STEP_PX }}
          transition={ROW_TRANSITION}
        >
          {products.map((product) => (
            <ProductCard
              product={product}
              translate={scrollTranslate}
              key={product.title}
            />
          ))}
        </motion.div>
      </div>
      <div className="flex shrink-0 flex-row gap-2">
        <button
          type="button"
          onClick={onPrev}
          className="flex size-10 items-center justify-center rounded-full border border-white/20 bg-background/80 text-white shadow-lg backdrop-blur-sm transition hover:bg-white/10 hover:border-white/40 md:size-11"
          aria-label="Previous case"
        >
          <ChevronLeft className="size-5 md:size-6" />
        </button>
        <button
          type="button"
          onClick={onNext}
          className="flex size-10 items-center justify-center rounded-full border border-white/20 bg-background/80 text-white shadow-lg backdrop-blur-sm transition hover:bg-white/10 hover:border-white/40 md:size-11"
          aria-label="Next case"
        >
          <ChevronRight className="size-5 md:size-6" />
        </button>
      </div>
    </div>
  );
}

function Header({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="relative left-0 top-0 mx-auto w-full max-w-7xl px-4 py-20 md:py-40">
      <h1 className="font-[var(--font-playfair)] text-2xl font-bold text-white md:text-7xl">
        {title}
      </h1>
      <p className="mt-8 max-w-2xl text-base text-neutral-200 md:text-xl">
        {description}
      </p>
    </div>
  );
}

function ProductCard({
  product,
  translate,
}: {
  product: HeroParallaxProduct;
  translate: MotionValue<number>;
}) {
  const isExternal = product.link.startsWith("http");
  const linkProps = isExternal
    ? { href: product.link, target: "_blank", rel: "noopener noreferrer" as const }
    : { href: product.link };

  return (
    <motion.div
      style={{ x: translate }}
      whileHover={{ y: -20 }}
      className="group/product relative h-96 w-[30rem] shrink-0"
    >
      <a
        {...linkProps}
        className="block group-hover/product:shadow-2xl"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.thumbnail}
          height={600}
          width={600}
          className="absolute inset-0 h-full w-full object-cover object-left-top"
          alt={product.title}
        />
      </a>
      <div className="pointer-events-none absolute inset-0 h-full w-full bg-black opacity-0 group-hover/product:opacity-80" />
      <h2 className="absolute bottom-4 left-4 text-white opacity-0 group-hover/product:opacity-100">
        {product.title}
      </h2>
    </motion.div>
  );
}
