"use client";

import { useState } from "react";
import { submitEnquiry } from "@/lib/actions/enquiry";

type CourseEnquiryFormProps = {
  courseId: string;
  courseSlug: string;
  title?: string;
  className?: string;
};

export function CourseEnquiryForm({ courseId, courseSlug, title, className }: CourseEnquiryFormProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const result = await submitEnquiry({
      fullName,
      email,
      phone,
      message,
      interestedCourseId: courseId,
      interestedCourseSlug: courseSlug,
    });
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setDone(true);
    setFullName("");
    setEmail("");
    setPhone("");
    setMessage("");
  }

  return (
    <div className={className ?? "mt-5 rounded-xl border border-accentGold/20 bg-accentGold/5 p-4"}>
      <h4 className="text-sm font-semibold text-white">
        {title || "Not ready to pay yet? Enquire first"}
      </h4>
      <p className="mt-1 text-xs text-white/70">
        Send your details and our team will contact you with course info.
      </p>
      {done ? (
        <div className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
          Thanks. Your enquiry was sent successfully.
        </div>
      ) : (
        <form className="mt-3 space-y-2.5" onSubmit={onSubmit}>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Full name"
            required
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          />
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone"
            required
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          />
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={2}
            placeholder="Question (optional)"
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          />
          {error && <p className="text-xs text-red-300">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-full border border-accentGold bg-accentGold px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-background disabled:opacity-60"
          >
            {busy ? "Sending..." : "Submit enquiry"}
          </button>
        </form>
      )}
    </div>
  );
}
