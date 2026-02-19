"use client";

import { useState, useEffect } from "react";
import type { StudentProfile } from "@/types/student";

interface DashboardProfileFormProps {
  profile: StudentProfile | null;
  email: string;
  onSave: (data: { phone: string; displayName?: string }) => Promise<{ success: boolean; error?: string }>;
}

export default function DashboardProfileForm({ profile, email, onSave }: DashboardProfileFormProps) {
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [displayName, setDisplayName] = useState(profile?.displayName ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Sync form when profile loads or updates (e.g. after save)
  useEffect(() => {
    setPhone(profile?.phone ?? "");
    setDisplayName(profile?.displayName ?? "");
  }, [profile?.phone, profile?.displayName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSaving(true);
    try {
      const result = await onSave({ phone, displayName: displayName.trim() || undefined });
      if (result.success) {
        setMessage({ type: "success", text: "Profile updated." });
      } else {
        setMessage({ type: "error", text: result.error ?? "Failed to save." });
      }
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to save." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      <div>
        <label id="profile-email-label" htmlFor="profile-email" className="mb-1 block text-xs text-white/70">
          Email
        </label>
        <input
          id="profile-email"
          type="email"
          value={email}
          readOnly
          aria-labelledby="profile-email-label"
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white/70"
        />
        <p className="mt-0.5 text-xs text-white/50">Email cannot be changed here.</p>
      </div>
      <div>
        <label htmlFor="profile-phone" className="mb-1 block text-xs text-white/70">
          Phone number
        </label>
        <input
          id="profile-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white focus:border-accentGold/50 focus:outline-none"
          placeholder="+44 7XXX XXXXXX"
        />
      </div>
      <div>
        <label htmlFor="profile-displayName" className="mb-1 block text-xs text-white/70">
          Full name
        </label>
        <input
          id="profile-displayName"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white focus:border-accentGold/50 focus:outline-none"
          placeholder="Dr. Jane Smith"
        />
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
        {saving ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
