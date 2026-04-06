import Link from "next/link";
import { getCourses } from "@/lib/actions/course";
import LegacyAccessRequestClient from "./request-client";

export const dynamic = "force-dynamic";

export default async function LegacyAccessRequestPage() {
  const courses = await getCourses();
  const openCourses = courses.filter((c) => c.status === "open");

  return (
    <div className="min-h-screen bg-background px-4 py-16 text-white md:py-24">
      <div className="mx-auto max-w-xl">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-black/90 p-8 shadow-[0_18px_60px_rgba(0,0,0,0.85)]">
          <h1 className="font-[var(--font-playfair)] text-2xl tracking-tight text-white">
            Past delegate access
          </h1>
          <p className="mt-2 text-sm text-white/70">
            If you attended a previous course, request access and our team will verify you and unlock
            your course materials in the portal.
          </p>

          <div className="mt-6">
            <LegacyAccessRequestClient
              courses={openCourses.map((c) => ({ id: c.id, title: c.title }))}
            />
          </div>

          <p className="mt-6 text-center text-xs text-white/50">
            Already approved?{" "}
            <Link href="/portal" className="text-accentGold/80 hover:text-accentGold">
              Go to portal →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

