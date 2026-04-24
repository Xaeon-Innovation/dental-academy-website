"use client";

import type { Course } from "@/types/course";
import { getAgendaForBatch } from "@/lib/course-agenda-by-batch";
import { useCourseBatchSelection } from "@/contexts/CourseBatchContext";

export function CourseAgendaSection({ course }: { course: Pick<Course, "agenda" | "batches"> }) {
  const { batchId } = useCourseBatchSelection();
  const hasBatches = Boolean(course.batches?.length);
  const displayAgenda = getAgendaForBatch(course, hasBatches ? batchId : null);

  if (!displayAgenda.length) return null;

  return (
    <section className="mt-10">
      <h2 className="font-[var(--font-playfair)] text-xl font-semibold tracking-tight text-white">Course Agenda</h2>
      {hasBatches ? (
        <p className="mt-1 text-xs text-white/50">Shown for the cohort selected in the enquiry panel.</p>
      ) : null}
      <div className="mt-4 space-y-4">
        {displayAgenda.map((day, index) => (
          <div
            key={`${day.day}-${day.date}-${index}`}
            className="rounded-xl border border-white/5 bg-white/[0.02] p-5 transition hover:border-white/10"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-accentGold">
                {day.day} ({day.date})
              </span>
              <span className="text-xs text-white/50">{day.time}</span>
            </div>
            <h3 className="mt-2 font-medium text-white">{day.title}</h3>
            <ul className="mt-3 space-y-1.5 pl-1 text-sm text-white/70">
              {day.items.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accentGold/60" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
