"use client";

import Link from "next/link";
import { useState } from "react";
import type { Course } from "@/types/course";

interface CoursesClientProps {
  courses: Course[];
}

export default function CoursesClient({ courses }: CoursesClientProps) {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const toggleCard = (slug: string) => {
    setExpandedCard(expandedCard === slug ? null : slug);
  };

  const getOverviewPreview = (course: Course) => {
    if (course.overview && course.overview.length > 0) {
      return course.overview[0];
    }
    return course.description;
  };

  return (
    <div className="bg-background px-4 py-16 text-white md:py-20">
      <div className="mx-auto max-w-4xl">
        <header className="mb-10 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accentGold">
            Courses
          </p>
          <h1 className="font-[var(--font-playfair)] text-3xl tracking-tight md:text-4xl">
            Two intensive tracks. One academy.
          </h1>
          <p className="mt-2 text-sm text-white/70">
            Course Provider: Kaleidoscope Dental Academy
          </p>
        </header>
        <div className="space-y-6">
          {courses.length === 0 ? (
            <div className="rounded-lg border border-white/10 bg-black/40 px-6 py-12 text-center">
              <p className="text-white/70">No courses available at this time.</p>
            </div>
          ) : (
            courses.map((course) => {
              const isExpanded = expandedCard === course.slug;
              return (
                <article
                  key={course.slug}
                  className={`group relative overflow-hidden rounded-3xl border transition-all duration-500 ease-in-out ${
                    isExpanded
                      ? "border-accentGold/30 bg-gradient-to-r from-white/[0.05] to-black/90 shadow-[0_24px_80px_rgba(201,168,110,0.15)]"
                      : "border-white/5 bg-gradient-to-r from-white/[0.03] to-black/90 shadow-[0_18px_60px_rgba(0,0,0,0.85)]"
                  }`}
                >
                  <div className="p-6">
                    {course.cpd && (
                      <span className="inline-block rounded-full border border-accentGold/60 px-3 py-1 text-[0.65rem] uppercase tracking-[0.18em] text-accentGold">
                        {course.cpd}
                      </span>
                    )}
                    <h2 className="mt-4 text-lg font-semibold tracking-tight">
                      {course.title}
                    </h2>
                    <p className="mt-2 text-sm text-white/70">
                      {course.description}
                    </p>
                    {course.provider && (
                      <p className="mt-2 text-xs text-white/50">
                        Course Provider: {course.provider}
                      </p>
                    )}

                    {/* Expanded Content */}
                    <div
                      className={`grid transition-all duration-500 ease-in-out ${
                        isExpanded
                          ? "grid-rows-[1fr] opacity-100"
                          : "grid-rows-[0fr] opacity-0"
                      }`}
                    >
                      <div className="overflow-hidden">
                        <div
                          className={`mt-6 space-y-4 border-t border-white/10 pt-6 transition-all duration-500 ${
                            isExpanded
                              ? "translate-y-0 opacity-100"
                              : "-translate-y-4 opacity-0"
                          }`}
                        >
                          <div className="space-y-3">
                            <h3 className="text-sm font-semibold uppercase tracking-[0.1em] text-accentGold">
                              Course Overview
                            </h3>
                            <p className="text-sm leading-relaxed text-white/80">
                              {getOverviewPreview(course)}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-3 pt-2">
                            <Link
                              href={`/courses/${course.slug}`}
                              className="inline-block rounded-full border-2 border-accentGold bg-accentGold px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-background transition hover:border-accentGold/90 hover:bg-accentGold/90"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Learn More
                            </Link>
                            <Link
                              href={`/courses/${course.slug}/register`}
                              className="inline-block rounded-full border-2 border-accentGold px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-accentGold transition hover:border-accentGold/80 hover:bg-accentGold/10"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Enroll Now
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Toggle Button */}
                    <button
                      onClick={() => toggleCard(course.slug)}
                      className={`mt-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-accentGold transition-all duration-300 hover:text-accentGold/80 ${
                        isExpanded ? "text-accentGold/70" : ""
                      }`}
                    >
                      <span>{isExpanded ? "Hide details" : "View course"}</span>
                      <span
                        className={`inline-block transition-transform duration-300 ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      >
                        →
                      </span>
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}