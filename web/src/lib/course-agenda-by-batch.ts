import type { Course, CourseAgendaDay } from "@/types/course";

/** Normalize agenda days for save: keep complete days, trim items, default time. */
export function cleanAgendaDays(days: CourseAgendaDay[] | undefined): CourseAgendaDay[] {
  if (!days?.length) return [];
  return days
    .filter((d) => d.day.trim() && d.date.trim() && d.title.trim())
    .map((d) => ({
      day: d.day.trim(),
      date: d.date.trim(),
      title: d.title.trim(),
      time: d.time.trim() || "Full Day",
      items: (d.items ?? []).map((s) => s.trim()).filter(Boolean),
    }));
}

/**
 * Agenda shown for a cohort: per-batch `agenda` when present, otherwise the course-level `agenda` (legacy).
 */
export function getAgendaForBatch(
  course: Pick<Course, "agenda" | "batches">,
  batchId: string | null | undefined
): CourseAgendaDay[] {
  const fallback = course.agenda ?? [];
  const batches = course.batches;
  if (!batches?.length || !batchId) return fallback;
  const batch = batches.find((b) => b.id === batchId);
  if (batch?.agenda && batch.agenda.length > 0) return batch.agenda;
  return fallback;
}
