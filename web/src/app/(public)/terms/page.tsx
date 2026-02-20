import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms and Conditions - Kaleidoscope Dental Academy",
  description:
    "Terms and Conditions for courses and services operated by Kaleidoscope Dental Academy.",
};

export default function TermsPage() {
  return (
    <div className="bg-background px-4 py-16 text-white md:py-20">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-[var(--font-playfair)] text-3xl tracking-tight md:text-4xl">
          Terms and Conditions
        </h1>
        <p className="mt-2 text-sm text-white/60">
          By Kaleidoscope Dental Academy
        </p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-white/70 md:text-base">
          <section>
            <h2 className="mb-4 text-lg font-semibold text-white">
              Scope of these Terms
            </h2>
            <p>
              These Terms and Conditions ("Terms") apply to your participation
              in any course, programme, or service operated by Kaleidoscope
              Dental Academy. By registering for a course or using our services,
              you agree to these Terms. Course-specific details (e.g. eligibility,
              content, inclusions, and venue) are set out in the relevant course
              description and materials provided at registration.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold text-white">
              Eligibility and Course Content
            </h2>
            <p>
              Eligibility (e.g. professional registration, qualifications) and
              course content vary by course and are described on the course
              page and in any materials we provide. It is your responsibility to
              ensure you meet the eligibility requirements for the course you
              are registering for before you enrol.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold text-white">
              What's Included
            </h2>
            <p>
              Inclusions (e.g. tuition, materials, travel, accommodation) vary
              by course and will be set out in the course description and in
              the information provided when you register.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold text-white">
              Participant Responsibilities
            </h2>
            <p>
              Participants are required to comply with all applicable local
              regulations and professional codes of conduct during the training.
              Where a course involves travel, you are responsible for ensuring
              your passport, visa, and travel documents are valid and meet the
              entry requirements of the country or venue where the course takes
              place.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold text-white">
              Data and Media Consent
            </h2>
            <p>
              By enrolling, you consent to the processing of personal data for the
              purpose of course administration, communications, and certification.
              Photos and videos may be taken during the course for educational and
              promotional use unless you explicitly opt out in writing prior to
              course commencement.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold text-white">
              Governing Law
            </h2>
            <p>
              These Terms are governed by the laws of the United Kingdom. Any
              disputes shall be subject to the exclusive jurisdiction of the UK
              courts.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
