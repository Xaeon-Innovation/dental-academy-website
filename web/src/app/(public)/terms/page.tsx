import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms and Conditions - Kaleidoscope Dental Academy",
  description:
    "Terms and Conditions for the iPlace // iRestore dental implant training course operated by Kaleidoscope Dental Academy.",
};

export default function TermsPage() {
  return (
    <div className="bg-background px-4 py-16 text-white md:py-20">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-[var(--font-playfair)] text-3xl tracking-tight md:text-4xl">
          Terms and Conditions
        </h1>
        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-accentGold">
          iPlace // iRestore Course
        </p>
        <p className="mt-2 text-sm text-white/60">
          By Kaleidoscope Dental Academy
        </p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-white/70 md:text-base">
          <section>
            <h2 className="mb-4 text-lg font-semibold text-white">
              iPlace // iRestore Course – Terms and Conditions
            </h2>
            <p>
              These Terms and Conditions ("Terms") apply to your participation
              in the iPlace // iRestore dental implant training course, operated
              by Kaleidoscope Dental Academy. By registering for the course, you
              agree to these Terms.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold text-white">
              Eligibility and Course Description
            </h2>
            <p>
              The course is open to dentists holding valid registration with the
              General Dental Council in the United Kingdom or an equivalent
              international dental license. The course includes theory, treatment
              planning, hands-on restorative exercises, and live surgical training
              under supervision in Egypt. Delegates are expected to assist in 6–10
              implant placements and personally place 6–10 implants across a
              variety of clinical scenarios using a mix of freehand, pilot
              drill–only guided, and fully guided techniques.
            </p>
            <p className="mt-4">
              There will be structured case discussions and planning sessions
              before surgeries to enhance surgical confidence, with exposure to
              digital workflows and the potential use of bone grafts or membranes
              when appropriate. Participants will also gain restorative experience
              with implant components and impressions, with support throughout the
              digital workflow from planning to restoration. The course offers 60
              hours of verifiable CPD and concludes with a remote UK-based
              follow-up case discussion and certification session.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold text-white">
              What's Included
            </h2>
            <p>
              Flights, accommodation, daily transfers, and course tuition are
              included.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold text-white">
              Participant Responsibilities
            </h2>
            <p>
              Participants are required to comply with all local regulations and
              professional codes of conduct during the training in Egypt. You are
              also responsible for ensuring your passport, visa, and travel
              documents are valid and meet the entry requirements of Egypt.
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
