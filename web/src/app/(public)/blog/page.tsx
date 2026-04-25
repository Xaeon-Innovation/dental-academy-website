import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog | Kaleidoscope Dental Academy",
  description:
    "Insights and updates on dental implant education, iPlace, iRestore and implant practice.",
  robots: { index: false, follow: false },
  keywords: [
    "dental implant blog",
    "implant education",
    "Kaleidoscope Dental Academy",
  ],
};

export default function BlogListingPage() {
  return (
    <div className="bg-background px-4 py-16 text-white md:py-20">
      <div className="mx-auto max-w-6xl">
        <h1 className="font-[var(--font-playfair)] text-3xl tracking-tight md:text-4xl">
          Blog
        </h1>
        <p className="mt-4 max-w-2xl text-white/70">
          Articles and updates will appear here soon. In the meantime, explore our courses and
          clinical cases to see the Academy’s approach in action.
        </p>
      </div>
    </div>
  );
}
