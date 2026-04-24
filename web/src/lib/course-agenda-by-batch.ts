import type { Course, CourseAgendaDay } from "@/types/course";

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
