"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  registrationSchema,
  aspectsToDevelopOptions,
  type RegistrationFormData,
} from "@/lib/validations/registration";
import { submitRegistration } from "@/lib/actions/registration";
import type { PrimaryWorkSetting, PreferredFormat } from "@/types/registration";

type Course = { slug: string; id: string; title: string };

const CURRENT_ROLES = [
  "Associate Dentist",
  "Practice Owner",
  "Foundation Dentist",
  "Specialist Prosthodontist",
  "Specialist Oral Surgeon",
  "General Practitioner",
  "Other",
];

const PRIMARY_WORK_SETTINGS: { value: PrimaryWorkSetting; label: string }[] = [
  { value: "NHS", label: "NHS" },
  { value: "Private", label: "Private" },
  { value: "Mixed", label: "Mixed" },
  { value: "Hospital/Academic", label: "Hospital/Academic" },
  { value: "Other", label: "Other" },
];

const PREFERRED_FORMAT_OPTIONS: { value: PreferredFormat; label: string }[] = [
  { value: "hands-on", label: "100% hands-on" },
  { value: "mixed", label: "Mixed (lectures/seminars + hands-on)" },
];

const HOW_DID_YOU_HEAR = [
  "Search / Google",
  "Social media",
  "Colleague referral",
  "Conference / Event",
  "Other",
];

const defaultFormState = (course: Course): Partial<RegistrationFormData> => ({
  courseId: course.id,
  courseSlug: course.slug,
  hasPlacedImplants: false,
  hasRestoredCases: false,
  aspectsToDevelop: [],
  contactByWhatsApp: false,
  consentContact: false,
  acceptedTerms: false,
});

export default function EnrollmentForm({
  course,
  initialData,
  userId,
}: {
  course: Course;
  initialData?: Partial<RegistrationFormData>;
  userId?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState<Partial<RegistrationFormData>>(() => {
    const base = defaultFormState(course);
    if (!initialData) return base;
    return {
      ...base,
      ...initialData,
      courseId: course.id,
      courseSlug: course.slug,
    };
  });

  function update(field: keyof RegistrationFormData, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) setFieldErrors((prev) => ({ ...prev, [field]: "" }));
  }

  function toggleAspect(value: string) {
    setForm((prev) => {
      const arr = prev.aspectsToDevelop ?? [];
      const next = arr.includes(value) ? arr.filter((a) => a !== value) : [...arr, value];
      return { ...prev, aspectsToDevelop: next };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const parsed = registrationSchema.safeParse(form);
    if (!parsed.success) {
      const issues: Record<string, string> = {};
      parsed.error.issues.forEach((i) => {
        const path = i.path[0]?.toString();
        if (path) issues[path] = i.message;
      });
      setFieldErrors(issues);
      setError("Please fix the errors below.");
      return;
    }

    setSubmitting(true);
    const result = await submitRegistration(parsed.data, userId);
    setSubmitting(false);

    if (result.success) {
      router.push(`/courses/${course.slug}/register/success`);
      return;
    }
    setError(result.error);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      {error && (
        <p className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-2 text-sm text-red-200">
          {error}
        </p>
      )}

      {/* Section 1: Personal */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-accentGold">
          Personal information
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="name" className="mb-1 block text-xs text-white/70">
              Full name *
            </label>
            <input
              id="name"
              type="text"
              required
              value={form.name ?? ""}
              onChange={(e) => update("name", e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white placeholder:text-white/40 focus:border-accentGold/50 focus:outline-none"
              placeholder="Dr. Jane Smith"
            />
            {fieldErrors.name && (
              <p className="mt-1 text-xs text-red-400">{fieldErrors.name}</p>
            )}
          </div>
          <div>
            <label htmlFor="email" className="mb-1 block text-xs text-white/70">
              Email address *
            </label>
            <input
              id="email"
              type="email"
              required
              value={form.email ?? ""}
              onChange={(e) => update("email", e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white placeholder:text-white/40 focus:border-accentGold/50 focus:outline-none"
              placeholder="jane@example.com"
            />
            {fieldErrors.email && (
              <p className="mt-1 text-xs text-red-400">{fieldErrors.email}</p>
            )}
          </div>
          <div>
            <label htmlFor="phone" className="mb-1 block text-xs text-white/70">
              Phone number *
            </label>
            <input
              id="phone"
              type="tel"
              required
              value={form.phone ?? ""}
              onChange={(e) => update("phone", e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white placeholder:text-white/40 focus:border-accentGold/50 focus:outline-none"
              placeholder="+44 7XXX XXXXXX"
            />
            {fieldErrors.phone && (
              <p className="mt-1 text-xs text-red-400">{fieldErrors.phone}</p>
            )}
          </div>
          <div>
            <label htmlFor="country" className="mb-1 block text-xs text-white/70">
              Country of residence *
            </label>
            <input
              id="country"
              type="text"
              required
              value={form.country ?? ""}
              onChange={(e) => update("country", e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white placeholder:text-white/40 focus:border-accentGold/50 focus:outline-none"
              placeholder="United Kingdom"
            />
            {fieldErrors.country && (
              <p className="mt-1 text-xs text-red-400">{fieldErrors.country}</p>
            )}
          </div>
          <div>
            <label htmlFor="instagram" className="mb-1 block text-xs text-white/70">
              Instagram handle (optional)
            </label>
            <input
              id="instagram"
              type="text"
              value={form.instagramHandle ?? ""}
              onChange={(e) => update("instagramHandle", e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white placeholder:text-white/40 focus:border-accentGold/50 focus:outline-none"
              placeholder="@username"
            />
          </div>
        </div>
      </section>

      {/* Section 2: Professional */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-accentGold">
          Professional background
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="currentRole" className="mb-1 block text-xs text-white/70">
              Current role *
            </label>
            <select
              id="currentRole"
              required
              value={form.currentRole ?? ""}
              onChange={(e) => update("currentRole", e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white focus:border-accentGold/50 focus:outline-none"
            >
              <option value="">Select role</option>
              {CURRENT_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            {fieldErrors.currentRole && (
              <p className="mt-1 text-xs text-red-400">{fieldErrors.currentRole}</p>
            )}
          </div>
          <div>
            <label htmlFor="yearsExperience" className="mb-1 block text-xs text-white/70">
              Years of dental experience (optional)
            </label>
            <input
              id="yearsExperience"
              type="number"
              min={0}
              max={60}
              value={form.yearsExperience ?? ""}
              onChange={(e) =>
                update("yearsExperience", e.target.value === "" ? undefined : e.target.value)
              }
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white placeholder:text-white/40 focus:border-accentGold/50 focus:outline-none"
              placeholder="5"
            />
          </div>
          <div>
            <label htmlFor="primaryWorkSetting" className="mb-1 block text-xs text-white/70">
              Primary work setting (optional)
            </label>
            <select
              id="primaryWorkSetting"
              value={form.primaryWorkSetting ?? ""}
              onChange={(e) =>
                update("primaryWorkSetting", e.target.value ? (e.target.value as PrimaryWorkSetting) : undefined)
              }
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white focus:border-accentGold/50 focus:outline-none"
            >
              <option value="">Select</option>
              {PRIMARY_WORK_SETTINGS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="gdcNumber" className="mb-1 block text-xs text-white/70">
              GDC number – UK only (optional)
            </label>
            <input
              id="gdcNumber"
              type="text"
              value={form.gdcNumber ?? ""}
              onChange={(e) => update("gdcNumber", e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white placeholder:text-white/40 focus:border-accentGold/50 focus:outline-none"
              placeholder="e.g. 123456"
            />
          </div>
        </div>
      </section>

      {/* Section 3: Implant experience */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-accentGold">
          Implantology experience
        </h2>
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-xs text-white/70">Have you placed implants before? *</p>
            <div className="flex gap-6">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="hasPlacedImplants"
                  checked={form.hasPlacedImplants === true}
                  onChange={() => update("hasPlacedImplants", true)}
                />
                <span className="text-sm">Yes</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="hasPlacedImplants"
                  checked={form.hasPlacedImplants === false}
                  onChange={() => update("hasPlacedImplants", false)}
                />
                <span className="text-sm">No</span>
              </label>
            </div>
          </div>
          {form.hasPlacedImplants && (
            <div>
              <label htmlFor="implantsPlacedCount" className="mb-1 block text-xs text-white/70">
                Approximately how many implants have you placed?
              </label>
              <input
                id="implantsPlacedCount"
                type="number"
                min={0}
                value={form.implantsPlacedCount ?? ""}
                onChange={(e) =>
                  update(
                    "implantsPlacedCount",
                    e.target.value === "" ? undefined : e.target.value
                  )
                }
                className="w-full max-w-[120px] rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white placeholder:text-white/40 focus:border-accentGold/50 focus:outline-none"
                placeholder="e.g. 50"
              />
            </div>
          )}
          <div>
            <p className="mb-2 text-xs text-white/70">Have you restored implant cases before? *</p>
            <div className="flex gap-6">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="hasRestoredCases"
                  checked={form.hasRestoredCases === true}
                  onChange={() => update("hasRestoredCases", true)}
                />
                <span className="text-sm">Yes</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="hasRestoredCases"
                  checked={form.hasRestoredCases === false}
                  onChange={() => update("hasRestoredCases", false)}
                />
                <span className="text-sm">No</span>
              </label>
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs text-white/70">Which aspects are you looking to develop?</p>
            <div className="flex flex-wrap gap-3">
              {aspectsToDevelopOptions.map((aspect) => (
                <label
                  key={aspect}
                  className="flex cursor-pointer items-center gap-2 rounded border border-white/10 px-3 py-2 text-sm transition hover:border-accentGold/30"
                >
                  <input
                    type="checkbox"
                    checked={form.aspectsToDevelop?.includes(aspect) ?? false}
                    onChange={() => toggleAspect(aspect)}
                  />
                  <span>{aspect}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Preferences */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-accentGold">
          Course preferences
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="preferredFormat" className="mb-1 block text-xs text-white/70">
              Do you prefer 100% hands-on or mixed with lectures/seminars? (optional)
            </label>
            <select
              id="preferredFormat"
              value={form.preferredFormat ?? ""}
              onChange={(e) =>
                update("preferredFormat", e.target.value ? (e.target.value as PreferredFormat) : undefined)
              }
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white focus:border-accentGold/50 focus:outline-none"
            >
              <option value="">Select</option>
              {PREFERRED_FORMAT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="howDidYouHear" className="mb-1 block text-xs text-white/70">
              How did you hear about us? (optional)
            </label>
            <select
              id="howDidYouHear"
              value={form.howDidYouHear ?? ""}
              onChange={(e) => update("howDidYouHear", e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white focus:border-accentGold/50 focus:outline-none"
            >
              <option value="">Select</option>
              {HOW_DID_YOU_HEAR.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="whatAttractedYou" className="mb-1 block text-xs text-white/70">
              What attracted you to this course? (optional)
            </label>
            <textarea
              id="whatAttractedYou"
              rows={3}
              value={form.whatAttractedYou ?? ""}
              onChange={(e) => update("whatAttractedYou", e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white placeholder:text-white/40 focus:border-accentGold/50 focus:outline-none"
              placeholder="A few words or sentences..."
            />
          </div>
        </div>
      </section>

      {/* Section 5: Final */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-accentGold">
          Final steps
        </h2>
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-xs text-white/70">Would you like to be contacted by WhatsApp?</p>
            <div className="flex gap-6">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="contactByWhatsApp"
                  checked={form.contactByWhatsApp === true}
                  onChange={() => update("contactByWhatsApp", true)}
                />
                <span className="text-sm">Yes</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="contactByWhatsApp"
                  checked={form.contactByWhatsApp === false}
                  onChange={() => update("contactByWhatsApp", false)}
                />
                <span className="text-sm">No</span>
              </label>
            </div>
          </div>
          <div>
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                required
                checked={form.consentContact ?? false}
                onChange={(e) => update("consentContact", e.target.checked)}
                className="mt-1"
              />
              <span className="text-sm text-white/80">
                I agree to be contacted with further details and early access to course
                registration. *
              </span>
            </label>
            {fieldErrors.consentContact && (
              <p className="mt-1 text-xs text-red-400">{fieldErrors.consentContact}</p>
            )}
          </div>
          <div>
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                required
                checked={form.acceptedTerms ?? false}
                onChange={(e) => update("acceptedTerms", e.target.checked)}
                className="mt-1"
              />
              <span className="text-sm text-white/80">
                I agree to the{" "}
                <Link
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accentGold underline transition hover:text-accentGold/80"
                >
                  Terms and Conditions
                </Link>
                . *
              </span>
            </label>
            {fieldErrors.acceptedTerms && (
              <p className="mt-1 text-xs text-red-400">{fieldErrors.acceptedTerms}</p>
            )}
          </div>
        </div>
      </section>

      <div className="pt-4">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full border-2 border-accentGold bg-accentGold px-8 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-background transition hover:border-accentGold/90 hover:bg-accentGold/90 disabled:opacity-60"
        >
          {submitting ? "Submitting…" : "Submit enrollment"}
        </button>
      </div>
    </form>
  );
}
