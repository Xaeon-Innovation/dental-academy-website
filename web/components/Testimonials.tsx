import { Marquee } from "@/components/ui/marquee";

const testimonials = [
  {
    name: "Dr. Sarah Chen",
    rating: 5,
    quote:
      "iPlace and iRestore transformed my implant workflow. The Academy’s precision-driven approach is exactly what I was looking for.",
  },
  {
    name: "Dr. Marcus Webb",
    rating: 5,
    quote:
      "Finally, a curriculum that connects surgery and prosthetics in one clear system. My cases are more predictable than ever.",
  },
  {
    name: "Dr. Elena Vasquez",
    rating: 5,
    quote:
      "The digital track gave me the confidence to integrate scanning and planning into every case. Highly recommend.",
  },
  {
    name: "Dr. James Okonkwo",
    rating: 5,
    quote:
      "Kaleidoscope doesn’t just teach techniques—it builds a repeatable workflow. Game changer for my practice.",
  },
  {
    name: "Dr. Nina Patel",
    rating: 5,
    quote:
      "From atraumatic extraction to final restoration, everything clicks. The Academy delivers on its promise.",
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={i < rating ? "text-accentGold" : "text-white/30"}
          aria-hidden
        >
          ★
        </span>
      ))}
    </div>
  );
}

function TestimonialCard({
  name,
  rating,
  quote,
}: (typeof testimonials)[number]) {
  return (
    <article className="flex w-[320px] shrink-0 flex-col justify-between rounded-2xl border border-white/5 bg-gradient-to-b from-white/[0.03] to-black/90 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.85)] transition hover:border-accentGold/50">
      <StarRating rating={rating} />
      <p className="mt-3 text-sm leading-relaxed text-white/80">{quote}</p>
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-accentGold">
        {name}
      </p>
    </article>
  );
}

export default function Testimonials() {
  return (
    <section
      id="testimonials"
      className="relative z-20 bg-background px-4 py-20 text-white md:py-28"
    >
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accentGold">
          Testimonials
        </p>
        <h2 className="mt-4 font-[var(--font-playfair)] text-3xl tracking-tight md:text-4xl">
          What clinicians say about the Academy
        </h2>
        <div className="mt-10 overflow-hidden">
          <Marquee pauseOnHover repeat={2} className="[--duration:50s]">
            {testimonials.map((t) => (
              <TestimonialCard key={t.name} {...t} />
            ))}
          </Marquee>
        </div>
      </div>
    </section>
  );
}
