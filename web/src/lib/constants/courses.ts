export const COURSES = [
  {
    slug: "iplace-irestore",
    id: "iplace-irestore",
    title: "iPlace // iRestore",
    description: "Single and Multiple implants intensive course.",
    cpd: "60 Hrs of CPD",
    provider: "Kaleidoscope Dental Academy",
  },
  {
    slug: "full-arch-intensive",
    id: "full-arch-intensive",
    title: "FULL ARCH INTENSIVE",
    description: "(All-on-X)",
    cpd: "46hrs of CPD",
    provider: "Kaleidoscope Dental Academy",
  },
] as const;

export function getCourseBySlug(slug: string) {
  return COURSES.find((c) => c.slug === slug) ?? null;
}
