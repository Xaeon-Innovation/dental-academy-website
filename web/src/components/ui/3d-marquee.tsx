"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

function isLocalSrc(src: string) {
  return src.startsWith("/");
}

function splitArray<T>(arr: T[], numChunks: number): T[][] {
  const chunks: T[][] = Array.from({ length: numChunks }, () => []);
  arr.forEach((item, i) => chunks[i % numChunks].push(item));
  return chunks;
}

interface ThreeDMarqueeProps {
  images: string[];
  className?: string;
}

export function ThreeDMarquee({ images, className }: ThreeDMarqueeProps) {
  const numColumns = 4;
  const columns = splitArray(images, numColumns);

  return (
    <div
      className={cn(
        "relative min-h-[120px] h-full w-full overflow-hidden",
        className
      )}
      style={{ perspective: "600px" }}
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-background to-transparent md:w-24" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-background to-transparent md:w-24" />

      <motion.div
        className="absolute inset-0 flex h-full w-full items-center gap-0.5 sm:gap-1 md:gap-2"
        style={{
          transformStyle: "preserve-3d",
          transform:
            "rotateX(55deg) rotateY(0deg) rotateZ(-45deg) scale(2.25)",
        }}
      >
        {columns.map((columnImages, colIndex) => (
          <MarqueeColumn
            key={colIndex}
            images={columnImages}
            direction={colIndex % 2 === 0 ? "up" : "down"}
            duration={34 + colIndex * 4}
          />
        ))}
      </motion.div>
    </div>
  );
}

function MarqueeColumn({
  images,
  direction,
  duration,
}: {
  images: string[];
  direction: "up" | "down";
  duration: number;
}) {
  if (images.length === 0) return null;

  const duplicated = [...images, ...images, ...images];

  return (
    <div className="flex h-full w-full min-w-0 flex-1 flex-col overflow-hidden">
      <div
        className="flex flex-col gap-0.5 sm:gap-1 md:gap-2"
        style={{
          animation: `marquee-3d-${direction} ${duration}s linear infinite`,
        }}
      >
        {duplicated.map((src, i) => (
          <motion.div
            key={`${src}-${i}`}
            className="relative aspect-[4/5] w-full min-h-[2rem] overflow-hidden rounded-lg border border-white/10 bg-white/5 shadow-lg"
            whileHover={{
              scale: 1.05,
              boxShadow: "0 20px 40px -15px rgba(0,0,0,0.4)",
            }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            {isLocalSrc(src) ? (
              <Image
                src={src}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 640px) 80vw, (max-width: 1024px) 50vw, 900px"
                quality={95}
                loading="lazy"
                draggable={false}
              />
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={src}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
                draggable={false}
              />
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
