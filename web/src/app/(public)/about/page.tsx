import Image from "next/image";
import Link from "next/link";
import {
  Target,
  Eye,
  GraduationCap,
  Microscope,
  Stethoscope,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { INSTRUCTORS } from "@/lib/constants/instructors";

const MISSION_VISION = [
  {
    icon: Target,
    title: "Our Mission",
    text: "To deliver precision-driven implant education that equips clinicians with the skills, protocols, and confidence to achieve repeatable outcomes in placement and restoration.",
  },
  {
    icon: Eye,
    title: "Our Vision",
    text: "A global community of implant practitioners who share a commitment to excellence, evidence-based practice, and continuous advancement in full-arch and single-implant care.",
  },
];

const FEATURES = [
  {
    icon: GraduationCap,
    title: "Expert Faculty",
    description: "Learn from clinicians and educators with years of hands-on experience and a focus on structured, repeatable protocols.",
  },
  {
    icon: Microscope,
    title: "Advanced Tech",
    description: "Training that integrates digital workflows, guided surgery, and modern materials used in contemporary practice.",
  },
  {
    icon: Stethoscope,
    title: "Hands-on Training",
    description: "Supervised clinical practice and live elements where applicable, so you build real skills, not just theory.",
  },
  {
    icon: BookOpen,
    title: "Evidence-Based",
    description: "Content grounded in current literature and aligned with GDC and FGDP training standards where relevant.",
  },
  {
    icon: Target,
    title: "Clear Outcomes",
    description: "Structured curricula with defined learning objectives so you know what you will achieve by the end of each course.",
  },
  {
    icon: Eye,
    title: "Ongoing Support",
    description: "Post-course mentoring and review days to reinforce learning and support your first cases in practice.",
  },
];

const STATS = [
  { value: "1500+", label: "Graduates worldwide" },
  { value: "20+", label: "Years of excellence" },
  { value: "98%", label: "Career placement" },
];

export default function AboutPage() {
  return (
    <div className="bg-background text-white">
      {/* Hero */}
      <section
        className="relative overflow-hidden px-4 py-12 md:py-16 lg:py-20"
        aria-labelledby="about-hero-heading"
      >
        <div className="pointer-events-none absolute inset-0 z-0 opacity-40">
          <Image
            src="/images/about-hero-bg.jpg"
            alt=""
            fill
            className="object-cover object-center"
            priority
            sizes="100vw"
            aria-hidden
          />
        </div>
        <div className="relative z-10 mx-auto grid max-w-6xl gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div>
            <h1
              id="about-hero-heading"
              className="font-[var(--font-playfair)] text-3xl font-bold leading-tight tracking-tight md:text-4xl lg:text-5xl"
            >
              <span className="block">Elevating</span>
              <span className="text-accentGold">Dentistry</span>
              <span className="block">Through</span>
              <span className="text-accentGold">Excellence</span>
            </h1>
            <p className="mt-6 max-w-lg text-sm leading-relaxed text-white/70 md:text-base">
              Kaleidoscope Dental Academy exists for clinicians who demand more: more clarity, more control, and more repeatable outcomes in implant dentistry.
            </p>
            <div className="mt-8">
              <Link
                href="/courses"
                className="inline-flex items-center gap-2 rounded-full border-2 border-accentGold bg-accentGold px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-background transition hover:border-accentGold/90 hover:bg-accentGold/90"
              >
                Start your journey
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/5 bg-white/5 shadow-2xl lg:aspect-[5/4]">
            <Image
              src="/images/philosophy/teeth.jpeg"
              alt="Kaleidoscope Dental Academy – precision-driven implant education"
              fill
              className="object-cover object-center"
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        </div>
      </section>

      {/* Legacy / About */}
      <section
        className="border-t border-white/5 px-4 py-16 md:py-24"
        aria-labelledby="legacy-heading"
      >
        <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-2 md:items-center">
          <div className="relative order-2 md:order-1 aspect-[4/3] overflow-hidden rounded-2xl border border-white/5 bg-white/5">
            <Image
              src="/images/philosophy/philosophy-image.png"
              alt="Kaleidoscope faculty and clinical training"
              fill
              className="object-cover object-center"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
          <div className="order-1 md:order-2">
            <div className="h-px w-12 bg-accentGold" aria-hidden />
            <h2
              id="legacy-heading"
              className="mt-4 font-[var(--font-playfair)] text-2xl font-semibold tracking-tight md:text-3xl"
            >
              A legacy of clinical mastery
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-white/70 md:text-base">
              Our programmes combine rigorous theory with supervised hands-on training and, where applicable, live patient observation. We focus on implant placement and restoration protocols that you can apply immediately in your practice.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-white/70 md:text-base">
              From single implants to full-arch reconstructions, the academy is built around the principle that excellence comes from clarity, repetition, and expert feedback.
            </p>
            <Link
              href="/courses"
              className="mt-6 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/70 transition hover:text-accentGold"
            >
              Explore our courses
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section
        className="border-t border-white/5 px-4 py-16 md:py-24"
        aria-labelledby="mission-vision-heading"
      >
        <div className="mx-auto max-w-6xl">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-accentGold">
            Our core purpose
          </p>
          <h2
            id="mission-vision-heading"
            className="mt-2 text-center font-[var(--font-playfair)] text-2xl font-semibold tracking-tight md:text-3xl"
          >
            Mission & Vision
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {MISSION_VISION.map(({ icon: Icon, title, text }) => (
              <article
                key={title}
                className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 transition duration-300 hover:border-white/10 hover:bg-white/[0.04]"
              >
                <span
                  className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-accentGold/10 text-accentGold"
                  aria-hidden
                >
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-4 font-semibold tracking-tight text-white">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/70">
                  {text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section
        className="border-t border-white/5 px-4 py-16 md:py-24"
        aria-labelledby="features-heading"
      >
        <div className="mx-auto max-w-6xl">
          <h2
            id="features-heading"
            className="font-[var(--font-playfair)] text-2xl font-semibold tracking-tight md:text-3xl"
          >
            Why the Academy
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-white/70 md:text-base">
            Structured education designed for clinicians who want to grow their implant practice with confidence.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <article
                key={title}
                className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 transition duration-300 hover:border-accentGold/20 hover:bg-white/[0.04] hover:shadow-lg hover:scale-[1.02]"
              >
                <span
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-accentGold/10 text-accentGold"
                  aria-hidden
                >
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-semibold tracking-tight text-white">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/70">
                  {description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section
        className="border-t border-white/5 px-4 py-16 md:py-20"
        aria-label="Academy statistics"
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-10 md:flex-row md:justify-between md:gap-8">
          {STATS.map(({ value, label }) => (
            <div key={label} className="text-center md:text-left">
              <div className="h-px w-12 bg-accentGold" aria-hidden />
              <p className="mt-3 font-[var(--font-playfair)] text-3xl font-semibold tracking-tight text-white md:text-4xl">
                {value}
              </p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.15em] text-white/50">
                {label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Faculty */}
      <section
        className="border-t border-white/5 bg-white/[0.02] px-4 py-16 md:py-20"
        aria-labelledby="faculty-heading"
      >
        <div className="mx-auto max-w-6xl">
          <h2
            id="faculty-heading"
            className="text-center font-[var(--font-playfair)] text-2xl font-semibold tracking-tight md:text-3xl"
          >
            Meet our instructors
          </h2>
          <div className="mt-10 flex flex-wrap justify-center gap-8 md:gap-12">
            {INSTRUCTORS.map((instructor) => (
              <div
                key={instructor.name}
                className="flex flex-col items-center transition hover:opacity-90"
              >
                <div className="relative h-28 w-28 overflow-hidden rounded-full border-2 border-white/10 bg-white/5 md:h-32 md:w-32">
                  <Image
                    src={instructor.imageUrl}
                    alt={instructor.name}
                    fill
                    className="object-cover"
                    sizes="128px"
                  />
                </div>
                <p className="mt-3 text-center text-sm font-medium text-white">
                  {instructor.name}
                </p>
                <p className="mt-0.5 text-center text-xs text-white/60">
                  {instructor.credentials}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link
              href="/courses"
              className="text-xs font-semibold uppercase tracking-[0.18em] text-accentGold transition hover:text-accentGold/80"
            >
              View full profiles on courses →
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section
        className="border-t border-white/5 px-4 py-20 md:py-28"
        aria-labelledby="cta-heading"
      >
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto h-px w-12 bg-accentGold" aria-hidden />
          <h2
            id="cta-heading"
            className="mt-4 font-[var(--font-playfair)] text-3xl font-semibold tracking-tight md:text-4xl"
          >
            Ready to master your craft?
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-white/70 md:text-base">
            Join clinicians who have elevated their implant practice through structured education, hands-on training, and ongoing support from the Academy.
          </p>
          <div className="mt-8">
            <InteractiveHoverButton href="/courses" variant="primary">
              View courses
            </InteractiveHoverButton>
          </div>
          <p className="mt-6 text-xs text-white/50">
            Join a community of excellence, and achieve mastery.
          </p>
        </div>
      </section>

      {/* About page footer block – 3 columns, same styling patterns as site footer */}
      <section
        className="border-t border-white/5 bg-black/80 px-4 py-12 md:py-16"
        aria-label="About Kaleidoscope Dental Academy"
      >
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-3">
          <div>
            <Link href="/" className="text-lg font-semibold tracking-tight text-white">
              Kaleidoscope Dental Academy
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-white/60">
              Precision-driven implant education for clinicians who demand clarity, control, and repeatable outcomes.
            </p>
            <p className="mt-4 text-xs text-white/40">
              &copy; {new Date().getFullYear()} Kaleidoscope Dental Academy.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              Academy
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-white/60">
              <li>
                <Link href="/courses" className="transition hover:text-white">
                  Courses
                </Link>
              </li>
              <li>
                <Link href="/about" className="transition hover:text-white">
                  About
                </Link>
              </li>
              <li>
                <Link href="/blog" className="transition hover:text-white">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/contact" className="transition hover:text-white">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              Contact
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-white/60">
              <li>
                <Link href="/contact" className="transition hover:text-white">
                  Get in touch
                </Link>
              </li>
              <li>
                <a
                  href="mailto:kaleidoscopedentalacademy@gmail.com"
                  className="transition hover:text-white"
                >
                  kaleidoscopedentalacademy@gmail.com
                </a>
              </li>
              <li>
                <a
                  href="tel:+447549685145"
                  className="transition hover:text-white"
                  aria-label="Phone: 07549 685145"
                >
                  07549 685145
                </a>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
