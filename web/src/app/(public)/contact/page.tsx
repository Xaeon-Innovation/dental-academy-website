import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MapPin, ArrowRight } from "lucide-react";
import { TextReveal } from "@/components/TextReveal";
import { BubbleBackground } from "@/components/animate-ui/components/backgrounds/bubble";

const contactEmail = "kaleidoscopedentalacademy@gmail.com";

/* Replace the src below with your own Google Maps embed URL from Google Maps > Share > Embed a map */
const MAP_EMBED_SRC =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d317718.69319292053!2d-0.3817834!3d51.528308!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47d8a00baf21de75%3A0x52963a5addd52a99!2sLondon%2C%20UK!5e0!3m2!1sen!2s!4v1708000000000!5m2!1sen!2s";

export const metadata: Metadata = {
  title: "Contact | Kaleidoscope Dental Academy",
  description:
    "Get in touch with Kaleidoscope Dental Academy. Enquiries about iPlace, iRestore and Full Arch training.",
  keywords: [
    "contact Kaleidoscope Dental Academy",
    "iPlace iRestore enquiry",
    "dental implant course contact",
  ],
};

export default function ContactPage() {
  return (
    <div className="bg-background text-white">
      {/* Hero */}
      <section
        className="relative min-h-[50vh] overflow-hidden px-4 py-20 md:py-28 lg:py-32"
        aria-labelledby="contact-hero-heading"
      >
        <BubbleBackground
          interactive
          className="absolute inset-0 z-0 flex items-center justify-center rounded-xl"
        />
        <div className="relative z-10 mx-auto max-w-6xl">
          <div className="h-px w-12 bg-accentGold" aria-hidden />
          <h1
            id="contact-hero-heading"
            className="mt-4 font-[var(--font-playfair)] text-3xl font-bold leading-tight tracking-tight md:text-4xl lg:text-5xl"
          >
            <span className="block">
              <TextReveal>Get in</TextReveal>
            </span>
            <span className="block font-normal italic text-accentGold">
              <TextReveal>Touch</TextReveal>
            </span>
          </h1>
          <p className="mt-6 max-w-lg text-sm leading-relaxed text-white/70 md:text-base">
            Have a question about our courses, enrolment, or CPD programmes? We’d love to hear from you.
          </p>
          <div className="mt-8">
            <Link
              href={`mailto:${contactEmail}`}
              className="btn-liquid inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em]"
            >
              Email us
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      {/* Contact details */}
      <section
        className="border-t border-white/5 px-4 py-16 md:py-24"
        aria-labelledby="contact-details-heading"
      >
        <div className="mx-auto max-w-6xl">
          <TextReveal className="block text-xs font-semibold uppercase tracking-[0.2em] text-accentGold">
            How to reach us
          </TextReveal>
          <h2
            id="contact-details-heading"
            className="mt-2 font-[var(--font-playfair)] text-2xl font-semibold tracking-tight md:text-3xl"
          >
            <TextReveal>Contact details</TextReveal>
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            <a
              href={`mailto:${contactEmail}`}
              className="holographic-card group flex items-start gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-6 hover:border-accentGold/20"
            >
              <span
                className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-accentGold/10 text-accentGold transition group-hover:bg-accentGold/20"
                aria-hidden
              >
                <Mail className="h-6 w-6" />
              </span>
              <div>
                <h3 className="font-semibold tracking-tight text-white">Email</h3>
                <p className="mt-1 text-sm text-white/70">{contactEmail}</p>
                <p className="mt-2 text-xs font-medium uppercase tracking-[0.12em] text-accentGold/90">
                  Send an enquiry
                </p>
              </div>
            </a>
            <div className="holographic-card flex items-start gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-6 hover:border-accentGold/20">
              <span
                className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-accentGold/10 text-accentGold"
                aria-hidden
              >
                <MapPin className="h-6 w-6" />
              </span>
              <div>
                <h3 className="font-semibold tracking-tight text-white">Location</h3>
                <p className="mt-1 text-sm text-white/70">
                  Training and events are held at selected venues. Details are shared upon registration.
                </p>
                <p className="mt-2 text-xs font-medium uppercase tracking-[0.12em] text-accentGold/90">
                  See map below
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map */}
      <section
        className="border-t border-white/5 px-4 py-16 md:py-24"
        aria-labelledby="map-heading"
      >
        <div className="mx-auto max-w-6xl">
          <TextReveal className="block text-xs font-semibold uppercase tracking-[0.2em] text-accentGold">
            Find us
          </TextReveal>
          <h2
            id="map-heading"
            className="mt-2 font-[var(--font-playfair)] text-2xl font-semibold tracking-tight md:text-3xl"
          >
            <TextReveal>Map & location</TextReveal>
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-white/70 md:text-base">
            Kaleidoscope Dental Academy operates in the UK. Course venues and addresses are confirmed when you enrol.
          </p>
          <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-[0_0_60px_rgba(0,0,0,0.4)]">
            <div className="relative aspect-[16/10] w-full min-h-[280px] md:aspect-[21/9] md:min-h-[320px]">
              <iframe
                src={MAP_EMBED_SRC}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Kaleidoscope Dental Academy location map"
                className="absolute inset-0 h-full w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        className="border-t border-white/5 px-4 py-20 md:py-28"
        aria-labelledby="contact-cta-heading"
      >
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto h-px w-12 bg-accentGold" aria-hidden />
          <h2
            id="contact-cta-heading"
            className="mt-4 font-[var(--font-playfair)] text-3xl font-semibold tracking-tight md:text-4xl"
          >
            <TextReveal>Ready to enrol?</TextReveal>
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-white/70 md:text-base">
            Explore our iPlace & iRestore and Full Arch Intensive courses and start your journey with the Academy.
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              href="/courses"
              className="btn-liquid inline-flex items-center gap-2 px-8 py-3.5 text-sm font-semibold uppercase tracking-[0.16em] focus:outline-none focus:ring-2 focus:ring-accentGold/50 focus:ring-offset-2 focus:ring-offset-[#1c1c1e]"
            >
              View courses
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
