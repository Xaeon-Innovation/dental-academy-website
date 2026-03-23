/** Session draft: course enrollment intent + contact (prefill portal / auto-enroll after signup). */
export const MINIMAL_ENROLLMENT_DRAFT_KEY = "minimalEnrollmentDraft_v1";

export type MinimalEnrollmentDraft = {
  courseSlug: string;
  courseId?: string;
  enrollmentNote?: string;
  name?: string;
  email?: string;
  phone?: string;
  consentContact?: boolean;
  acceptedTerms?: boolean;
  /**
   * When true (with courseId + contact fields), portal signup completes enrollment
   * and sends the user to the delegate dashboard (password-only step on portal).
   */
  finalizeOnPortal?: boolean;
};

export function readMinimalEnrollmentDraft(): MinimalEnrollmentDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(MINIMAL_ENROLLMENT_DRAFT_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as MinimalEnrollmentDraft;
    if (!data?.courseSlug || typeof data.courseSlug !== "string") return null;
    return data;
  } catch {
    return null;
  }
}

export function writeMinimalEnrollmentDraft(draft: MinimalEnrollmentDraft): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(MINIMAL_ENROLLMENT_DRAFT_KEY, JSON.stringify(draft));
}

export function clearMinimalEnrollmentDraft(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(MINIMAL_ENROLLMENT_DRAFT_KEY);
}

/** Draft ready for password-only signup + auto enroll */
export function isFinalizeEnrollmentDraft(
  d: MinimalEnrollmentDraft | null
): d is MinimalEnrollmentDraft & {
  courseId: string;
  name: string;
  email: string;
  phone: string;
  finalizeOnPortal: true;
} {
  return Boolean(
    d?.finalizeOnPortal &&
      d.courseId &&
      d.name?.trim() &&
      d.email?.trim() &&
      d.phone?.trim() &&
      d.consentContact === true &&
      d.acceptedTerms === true
  );
}

/** Slug segment from redirect path `/courses/[slug]` or `/courses/[slug]/...` */
export function courseSlugFromCoursesRedirect(redirect: string): string | null {
  const m = redirect.match(/^\/courses\/([^/?#]+)/);
  return m?.[1] ?? null;
}
