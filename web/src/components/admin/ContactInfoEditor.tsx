"use client";

import { useEffect, useState } from "react";
import type { SiteSettings } from "@/types/settings";
import { getSettings, updateContactSettings } from "@/lib/actions/settings";

type Status = "idle" | "loading" | "saving";

const DEFAULT_MAP_EMBED =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d317718.69319292053!2d-0.3817834!3d51.528308!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47d8a00baf21de75%3A0x52963a5addd52a99!2sLondon%2C%20UK!5e0!3m2!1sen!2s!4v1708000000000!5m2!1sen!2s";

const DEFAULT_LOCATION =
  "Training and events are held at selected venues. Details are shared upon registration.";

export default function ContactInfoEditor() {
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactLocation, setContactLocation] = useState("");
  const [mapEmbedSrc, setMapEmbedSrc] = useState("");
  const [socialLinks, setSocialLinks] = useState<NonNullable<SiteSettings["socialLinks"]>>({
    facebook: "",
    instagram: "",
    linkedin: "",
    youtube: "",
  });

  useEffect(() => {
    let mounted = true;
    async function load() {
      setStatus("loading");
      setError(null);
      try {
        const settings = await getSettings();
        if (!mounted) return;
        setContactEmail(settings.contactEmail ?? "");
        setContactPhone(settings.contactPhone ?? "");
        setContactLocation(settings.contactLocation ?? "");
        setMapEmbedSrc(settings.mapEmbedSrc ?? "");
        setSocialLinks({
          facebook: settings.socialLinks?.facebook ?? "",
          instagram: settings.socialLinks?.instagram ?? "",
          linkedin: settings.socialLinks?.linkedin ?? "",
          youtube: settings.socialLinks?.youtube ?? "",
        });
        setStatus("idle");
      } catch (err) {
        console.error("Failed to load contact settings", err);
        if (!mounted) return;
        setError("Failed to load contact information. Please try again.");
        setStatus("idle");
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  function updateSocial(key: keyof NonNullable<SiteSettings["socialLinks"]>, value: string) {
    setSocialLinks((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setStatus("saving");
    try {
      const result = await updateContactSettings({
        contactEmail: contactEmail.trim() || undefined,
        contactPhone: contactPhone.trim() || undefined,
        contactLocation: contactLocation.trim() || undefined,
        mapEmbedSrc: mapEmbedSrc.trim() || undefined,
        socialLinks: {
          facebook: socialLinks.facebook?.trim() || undefined,
          instagram: socialLinks.instagram?.trim() || undefined,
          linkedin: socialLinks.linkedin?.trim() || undefined,
          youtube: socialLinks.youtube?.trim() || undefined,
        },
      });
      if (result.success) {
        setSuccess("Contact information saved successfully.");
      } else {
        setError(result.error ?? "Failed to save contact information.");
      }
    } catch (err) {
      console.error("Failed to save contact settings", err);
      setError("Failed to save contact information. Please try again.");
    } finally {
      setStatus("idle");
    }
  }

  const loading = status === "loading";
  const saving = status === "saving";

  return (
    <section className="rounded-lg border border-white/10 bg-black/40 p-6">
      <div className="mb-4">
        <h2 className="font-[var(--font-playfair)] text-xl tracking-tight">
          Contact information
        </h2>
        <p className="mt-1 text-xs text-white/60">
          Email, phone, location and map appear on the contact page and in the footer.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {success}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="contactEmail"
              className="mb-1 block text-xs font-semibold text-white/70"
            >
              Email
            </label>
            <input
              id="contactEmail"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-accentGold/50 focus:outline-none"
              placeholder="kaleidoscopedentalacademy@gmail.com"
              disabled={loading || saving}
            />
          </div>
          <div>
            <label
              htmlFor="contactPhone"
              className="mb-1 block text-xs font-semibold text-white/70"
            >
              Phone number
            </label>
            <input
              id="contactPhone"
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-accentGold/50 focus:outline-none"
              placeholder="+44 123 456 7890"
              disabled={loading || saving}
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="contactLocation"
            className="mb-1 block text-xs font-semibold text-white/70"
          >
            Location description
          </label>
          <textarea
            id="contactLocation"
            rows={2}
            value={contactLocation}
            onChange={(e) => setContactLocation(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-accentGold/50 focus:outline-none"
            placeholder={DEFAULT_LOCATION}
            disabled={loading || saving}
          />
        </div>

        <div>
          <label
            htmlFor="mapEmbedSrc"
            className="mb-1 block text-xs font-semibold text-white/70"
          >
            Google Maps embed URL
          </label>
          <input
            id="mapEmbedSrc"
            type="url"
            value={mapEmbedSrc}
            onChange={(e) => setMapEmbedSrc(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-accentGold/50 focus:outline-none"
            placeholder={DEFAULT_MAP_EMBED.slice(0, 60) + "…"}
            disabled={loading || saving}
          />
          <p className="mt-1 text-[11px] text-white/50">
            From Google Maps: Share → Embed a map → copy the iframe src.
          </p>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
            Social media links
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                "facebook",
                "instagram",
                "linkedin",
                "youtube",
              ] as const
            ).map((key) => (
              <div key={key}>
                <label
                  htmlFor={`social-${key}`}
                  className="mb-1 block text-[11px] font-medium capitalize text-white/60"
                >
                  {key}
                </label>
                <input
                  id={`social-${key}`}
                  type="url"
                  value={socialLinks[key] ?? ""}
                  onChange={(e) => updateSocial(key, e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-accentGold/50 focus:outline-none"
                  placeholder={`https://${key}.com/…`}
                  disabled={loading || saving}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={loading || saving}
            className="rounded-lg bg-accentGold px-5 py-2.5 text-sm font-semibold text-background transition hover:bg-accentGold/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save contact info"}
          </button>
        </div>
      </form>
    </section>
  );
}
