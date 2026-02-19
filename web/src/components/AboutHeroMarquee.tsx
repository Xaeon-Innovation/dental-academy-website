"use client";

import { ThreeDMarquee } from "@/components/ui/3d-marquee";

const MARQUEE_IMAGES = [
  "/images/philosophy/teeth3.jpeg",
  "/images/philosophy/teeth.jpeg",
  "/images/philosophy/image.png",
  "/images/philosophy/image2.png",
  "/images/philosophy/clinic.jpg",
  "/images/iplace-irestore-intensive-course.png",
  "/images/instructors/dr-sameh-mohyeldin.png",
  "/images/instructors/dr-sherif-elsharkawy.png",
  "/images/instructors/dr-hisham-warda.png",
  "/images/instructors/dr-david-veige.png",
  "/images/about-hero-bg.jpg",
  "/images/philosophy/teeth3.jpeg",
  "/images/philosophy/image.png",
  "/images/philosophy/clinic.jpg",
  "/images/iplace-irestore-intensive-course.png",
  "/images/instructors/dr-sameh-mohyeldin.png",
  "/images/instructors/dr-hisham-warda.png",
  "/images/philosophy/teeth.jpeg",
  "/images/philosophy/image2.png",
  "/images/instructors/dr-david-veige.png",
  "/images/instructors/dr-sherif-elsharkawy.png",
  "/images/philosophy/clinic.jpg",
  "/images/philosophy/teeth3.jpeg",
  "/images/iplace-irestore-intensive-course.png",
  "/images/philosophy/image.png",
];

export function AboutHeroMarquee() {
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-white/5 bg-gray-950/5 shadow-2xl ring-1 ring-neutral-700/10 lg:aspect-[5/4] dark:bg-neutral-800">
      <ThreeDMarquee images={MARQUEE_IMAGES} className="h-full w-full rounded-2xl p-2" />
    </div>
  );
}
