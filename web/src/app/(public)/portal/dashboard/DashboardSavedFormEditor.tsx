"use client";

import { useState, useEffect } from "react";
import type { RegistrationFormData } from "@/lib/validations/registration";
import { aspectsToDevelopOptions } from "@/lib/validations/registration";
import type { PrimaryWorkSetting, PreferredFormat } from "@/types/registration";

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

interface ProfileFallback {
  name?: string;
  email?: string;
  phone?: string;
}

interface DashboardSavedFormEditorProps {
  savedFormSnapshot?: Partial<RegistrationFormData> | null;
  profileFallback?: ProfileFallback | null;
  onSave: (snapshot: Partial<RegistrationFormData>) => Promise<{ success: boolean; error?: string }>;
}

const defaultFormState: Partial<RegistrationFormData> = {
  name: "",
  email: "",
  phone: "",
  country: "",
  instagramHandle: "",
  currentRole: "",
  yearsExperience: undefined,
  primaryWorkSetting: undefined,
  gdcNumber: "",
  hasPlacedImplants: false,
  implantsPlacedCount: undefined,
  hasRestoredCases: false,
  aspectsToDevelop: [],
  preferredFormat: undefined,
  howDidYouHear: "",
  whatAttractedYou: "",
  contactByWhatsApp: false,
};

export default function DashboardSavedFormEditor({
  savedFormSnapshot,
  profileFallback,
  onSave,
}: DashboardSavedFormEditorProps) {
  const [form, setForm] = useState<Partial<RegistrationFormData>>(defaultFormState);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Prefill from saved snapshot, then fill any missing name/email/phone from profile
  useEffect(() => {
    const fromSnapshot = savedFormSnapshot ? { ...defaultFormState, ...savedFormSnapshot } : { ...defaultFormState };
    const prefill = {
      ...fromSnapshot,
      name: fromSnapshot.name || profileFallback?.name || "",
      email: fromSnapshot.email || profileFallback?.email || "",
      phone: fromSnapshot.phone || profileFallback?.phone || "",
    };
    setForm(prefill);
  }, [savedFormSnapshot, profileFallback?.name, profileFallback?.email, profileFallback?.phone]);

  function update(field: keyof RegistrationFormData, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleAspect(value: string) {
    setForm((prev) => {
      const arr = prev.aspectsToDevelop ?? [];
      const next = arr.includes(value) ? arr.filter((a) => a !== value) : [...arr, value];
      return { ...prev, aspectsToDevelop: next };
    });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSaving(true);
    const result = await onSave(form);
    setSaving(false);
    if (result.success) {
      setMessage({ type: "success", text: "Saved. This info will prefill on your next enrollment." });
    } else {
      setMessage({ type: "error", text: result.error ?? "Failed to save." });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="sf-name" className="mb-1 block text-xs text-white/70">Full name</label>
          <input
            id="sf-name"
            type="text"
            value={form.name ?? ""}
            onChange={(e) => update("name", e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white focus:border-accentGold/50 focus:outline-none"
            placeholder="Dr. Jane Smith"
          />
        </div>
        <div>
          <label htmlFor="sf-email" className="mb-1 block text-xs text-white/70">Email</label>
          <input
            id="sf-email"
            type="email"
            value={form.email ?? ""}
            onChange={(e) => update("email", e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white focus:border-accentGold/50 focus:outline-none"
            placeholder="jane@example.com"
          />
        </div>
        <div>
          <label htmlFor="sf-phone" className="mb-1 block text-xs text-white/70">Phone</label>
          <input
            id="sf-phone"
            type="tel"
            value={form.phone ?? ""}
            onChange={(e) => update("phone", e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white focus:border-accentGold/50 focus:outline-none"
            placeholder="+44 7XXX XXXXXX"
          />
        </div>
        <div>
          <label htmlFor="sf-country" className="mb-1 block text-xs text-white/70">Country</label>
          <input
            id="sf-country"
            type="text"
            value={form.country ?? ""}
            onChange={(e) => update("country", e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white focus:border-accentGold/50 focus:outline-none"
            placeholder="United Kingdom"
          />
        </div>
        <div>
          <label htmlFor="sf-instagram" className="mb-1 block text-xs text-white/70">Instagram (optional)</label>
          <input
            id="sf-instagram"
            type="text"
            value={form.instagramHandle ?? ""}
            onChange={(e) => update("instagramHandle", e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white focus:border-accentGold/50 focus:outline-none"
            placeholder="@username"
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="sf-currentRole" className="mb-1 block text-xs text-white/70">Current role</label>
          <select
            id="sf-currentRole"
            value={form.currentRole ?? ""}
            onChange={(e) => update("currentRole", e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white focus:border-accentGold/50 focus:outline-none"
          >
            <option value="">Select role</option>
            {CURRENT_ROLES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="sf-yearsExperience" className="mb-1 block text-xs text-white/70">Years of experience</label>
          <input
            id="sf-yearsExperience"
            type="number"
            min={0}
            max={60}
            value={form.yearsExperience ?? ""}
            onChange={(e) =>
              update("yearsExperience", e.target.value === "" ? undefined : e.target.value)
            }
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white focus:border-accentGold/50 focus:outline-none"
            placeholder="5"
          />
        </div>
        <div>
          <label htmlFor="sf-primaryWorkSetting" className="mb-1 block text-xs text-white/70">Primary work setting</label>
          <select
            id="sf-primaryWorkSetting"
            value={form.primaryWorkSetting ?? ""}
            onChange={(e) =>
              update("primaryWorkSetting", e.target.value ? (e.target.value as PrimaryWorkSetting) : undefined)
            }
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white focus:border-accentGold/50 focus:outline-none"
          >
            <option value="">Select</option>
            {PRIMARY_WORK_SETTINGS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="sf-gdcNumber" className="mb-1 block text-xs text-white/70">GDC number (UK, optional)</label>
          <input
            id="sf-gdcNumber"
            type="text"
            value={form.gdcNumber ?? ""}
            onChange={(e) => update("gdcNumber", e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white focus:border-accentGold/50 focus:outline-none"
            placeholder="e.g. 123456"
          />
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs text-white/70">Have you placed implants before?</p>
        <div className="flex gap-6">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="sf-hasPlacedImplants"
              checked={form.hasPlacedImplants === true}
              onChange={() => update("hasPlacedImplants", true)}
            />
            <span className="text-sm">Yes</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="sf-hasPlacedImplants"
              checked={form.hasPlacedImplants === false}
              onChange={() => update("hasPlacedImplants", false)}
            />
            <span className="text-sm">No</span>
          </label>
        </div>
      </div>
      {form.hasPlacedImplants && (
        <div>
          <label htmlFor="sf-implantsPlacedCount" className="mb-1 block text-xs text-white/70">Approx. implants placed</label>
          <input
            id="sf-implantsPlacedCount"
            type="number"
            min={0}
            value={form.implantsPlacedCount ?? ""}
            onChange={(e) =>
              update("implantsPlacedCount", e.target.value === "" ? undefined : e.target.value)
            }
            className="w-full max-w-[120px] rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white focus:border-accentGold/50 focus:outline-none"
            placeholder="e.g. 50"
          />
        </div>
      )}
      <div>
        <p className="mb-2 text-xs text-white/70">Have you restored implant cases before?</p>
        <div className="flex gap-6">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="sf-hasRestoredCases"
              checked={form.hasRestoredCases === true}
              onChange={() => update("hasRestoredCases", true)}
            />
            <span className="text-sm">Yes</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="sf-hasRestoredCases"
              checked={form.hasRestoredCases === false}
              onChange={() => update("hasRestoredCases", false)}
            />
            <span className="text-sm">No</span>
          </label>
        </div>
      </div>
      <div>
        <p className="mb-2 text-xs text-white/70">Aspects to develop</p>
        <div className="flex flex-wrap gap-2">
          {aspectsToDevelopOptions.map((aspect) => (
            <label
              key={aspect}
              className="flex cursor-pointer items-center gap-2 rounded border border-white/10 px-3 py-1.5 text-sm transition hover:border-accentGold/30"
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
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="sf-preferredFormat" className="mb-1 block text-xs text-white/70">Preferred format</label>
          <select
            id="sf-preferredFormat"
            value={form.preferredFormat ?? ""}
            onChange={(e) =>
              update("preferredFormat", e.target.value ? (e.target.value as PreferredFormat) : undefined)
            }
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white focus:border-accentGold/50 focus:outline-none"
          >
            <option value="">Select</option>
            {PREFERRED_FORMAT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="sf-howDidYouHear" className="mb-1 block text-xs text-white/70">How did you hear about us?</label>
          <select
            id="sf-howDidYouHear"
            value={form.howDidYouHear ?? ""}
            onChange={(e) => update("howDidYouHear", e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white focus:border-accentGold/50 focus:outline-none"
          >
            <option value="">Select</option>
            {HOW_DID_YOU_HEAR.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="sf-whatAttractedYou" className="mb-1 block text-xs text-white/70">What attracted you? (optional)</label>
          <textarea
            id="sf-whatAttractedYou"
            rows={2}
            value={form.whatAttractedYou ?? ""}
            onChange={(e) => update("whatAttractedYou", e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white focus:border-accentGold/50 focus:outline-none"
            placeholder="A few words..."
          />
        </div>
      </div>
      <div>
        <p className="mb-2 text-xs text-white/70">Contact by WhatsApp?</p>
        <div className="flex gap-6">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="sf-contactByWhatsApp"
              checked={form.contactByWhatsApp === true}
              onChange={() => update("contactByWhatsApp", true)}
            />
            <span className="text-sm">Yes</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="sf-contactByWhatsApp"
              checked={form.contactByWhatsApp === false}
              onChange={() => update("contactByWhatsApp", false)}
            />
            <span className="text-sm">No</span>
          </label>
        </div>
      </div>

      {message && (
        <p
          className={
            message.type === "success"
              ? "text-sm text-green-400"
              : "text-sm text-red-400"
          }
        >
          {message.text}
        </p>
      )}
      <button
        type="submit"
        disabled={saving}
        className="rounded-full border border-accentGold bg-accentGold/20 px-5 py-2 text-sm font-semibold uppercase tracking-wider text-accentGold transition hover:bg-accentGold/30 disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save enrollment info"}
      </button>
    </form>
  );
}
