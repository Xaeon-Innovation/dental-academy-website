import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - Kaleidoscope Dental Academy",
  description:
    "Privacy Policy for Kaleidoscope Dental Academy. How we collect, use, and protect your personal data for our iPlace and iRestore dental implant training.",
};

export default function PrivacyPage() {
  return (
    <div className="bg-background px-4 py-16 text-white md:py-20">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-[var(--font-playfair)] text-3xl tracking-tight md:text-4xl">
          Privacy Policy
        </h1>
        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-accentGold">
          Kaleidoscope Dental Academy
        </p>
        <p className="mt-2 text-sm text-white/60">
          Last updated: [Date – replace before publish]
        </p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-white/70 md:text-base">
          <section>
            <h2 className="mb-4 text-lg font-semibold text-white">
              Who we are
            </h2>
            <p>
              Kaleidoscope Dental Academy operates the iPlace // iRestore dental
              implant training course and this website. We are the data
              controller for the personal data we collect in connection with
              course enquiries, registrations, and site usage.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold text-white">
              What data we collect
            </h2>
            <p>
              We may collect: name, email address, phone number, professional
              registration details (e.g. GDC number), and other information you
              provide when contacting us or enrolling in a course. We may also
              collect technical data such as IP address and browser type when you
              use this website.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold text-white">
              How we use your data
            </h2>
            <p>
              We use your data to process enquiries, manage course registrations,
              send course-related communications, issue certificates, and
              improve our services. We do not sell your data to third parties.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold text-white">
              Cookies and tracking
            </h2>
            <p>
              This site may use essential cookies for functionality. If we use
              analytics or other non-essential cookies, we will describe them
              here and obtain consent where required by law.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold text-white">
              Data retention
            </h2>
            <p>
              We retain your data for as long as needed to fulfil the purposes
              above (e.g. course administration and certification) and to comply
              with legal obligations. You may request deletion of your data
              subject to applicable law.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold text-white">
              Your rights
            </h2>
            <p>
              Depending on your location, you may have rights to access, correct,
              delete, or restrict processing of your data, and to data
              portability or to object to processing. To exercise these rights
              or ask questions about this policy, contact us using the details
              below.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold text-white">
              Contact
            </h2>
            <p>
              For privacy-related enquiries:{" "}
              <a
                href="mailto:kaleidoscopedentalacademy@gmail.com"
                className="text-accentGold underline transition hover:text-accentGold/80"
              >
                kaleidoscopedentalacademy@gmail.com
              </a>
              . You may also use our{" "}
              <a
                href="/contact"
                className="text-accentGold underline transition hover:text-accentGold/80"
              >
                Contact
              </a>{" "}
              page.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold text-white">
              Changes to this policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time. The "Last
              updated" date at the top will be revised when we do. We encourage
              you to review this page periodically.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
