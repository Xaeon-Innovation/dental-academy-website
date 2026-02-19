"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getStudentProfile } from "@/lib/actions/student";
import type { RegistrationFormData } from "@/lib/validations/registration";
import EnrollmentForm from "./EnrollmentForm";

type Course = { slug: string; id: string; title: string };

interface EnrollmentFormWithPrefillProps {
  course: Course;
}

export default function EnrollmentFormWithPrefill({ course }: EnrollmentFormWithPrefillProps) {
  const { user } = useAuth();
  const [initialData, setInitialData] = useState<Partial<RegistrationFormData> | undefined>();
  const [ready, setReady] = useState(!user);

  useEffect(() => {
    if (!user) {
      setReady(true);
      return;
    }
    let cancelled = false;
    getStudentProfile(user.uid).then((profile) => {
      if (cancelled) return;
      setInitialData(profile?.savedFormSnapshot);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!ready) {
    return (
      <div className="py-8 text-center text-sm text-white/60">
        Loading your saved details…
      </div>
    );
  }

  return (
    <EnrollmentForm
      course={course}
      initialData={initialData}
      userId={user?.uid}
    />
  );
}
