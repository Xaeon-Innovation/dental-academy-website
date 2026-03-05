"use client";

import { useEffect, useState } from "react";
import { getSettings, updateSettings } from "@/lib/actions/settings";

type Status = "idle" | "loading" | "saving";

export default function BlogNavToggle() {
  const [status, setStatus] = useState<Status>("loading");
  const [showBlogInNav, setShowBlogInNav] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setStatus("loading");
      setError(null);
      try {
        const settings = await getSettings();
        if (!mounted) return;
        setShowBlogInNav(settings.showBlogInNav !== false);
        setStatus("idle");
      } catch (err) {
        console.error("Failed to load settings", err);
        if (!mounted) return;
        setError("Failed to load setting.");
        setStatus("idle");
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  async function handleToggle(checked: boolean) {
    setShowBlogInNav(checked);
    setError(null);
    setSuccess(null);
    setStatus("saving");
    try {
      const result = await updateSettings({ showBlogInNav: checked });
      if (result.success) {
        setSuccess(checked ? "Blog link is now visible in header and footer." : "Blog link is now hidden from header and footer.");
      } else {
        setError(result.error ?? "Failed to update.");
        setShowBlogInNav(!checked);
      }
    } catch (err) {
      console.error("Failed to update showBlogInNav", err);
      setError("Failed to update.");
      setShowBlogInNav(!checked);
    } finally {
      setStatus("idle");
    }
  }

  const loading = status === "loading";
  const saving = status === "saving";

  return (
    <section className="rounded-lg border border-white/10 bg-black/40 p-6">
      <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-accentGold">
        Navigation
      </h2>
      <p className="mt-1 text-xs text-white/60">
        Control whether the Blog link appears in the header and footer.
      </p>
      {error && (
        <div className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      )}
      {success && (
        <div className="mt-3 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          {success}
        </div>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={showBlogInNav}
            onChange={(e) => handleToggle(e.target.checked)}
            disabled={loading || saving}
            className="h-4 w-4 rounded border-white/20 bg-black/40 text-accentGold focus:ring-accentGold/50 disabled:opacity-50"
          />
          <span className="text-sm font-medium text-white">
            Show Blog in header and footer
          </span>
        </label>
        {(loading || saving) && (
          <span className="text-xs text-white/50">
            {loading ? "Loading…" : "Saving…"}
          </span>
        )}
      </div>
    </section>
  );
}
