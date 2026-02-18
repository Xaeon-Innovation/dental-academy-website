import { redirect } from "next/navigation";
import { migrateCoursesToFirestore } from "@/lib/migrations/courses";

async function runCourseMigration() {
  "use server";

  const result = await migrateCoursesToFirestore();

  // Optionally, you could log the result on the server
  console.log("Course migration result:", result);

  // After seeding, go back to the courses list
  redirect("/admin/courses");
}

export default function MigrateCoursesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[var(--font-playfair)] text-2xl tracking-tight">
          Migrate Constant Courses to Firestore
        </h1>
        <p className="mt-2 text-sm text-white/70">
          This will read the existing constant course definitions and create
          matching course documents in Firestore using the same data that the
          admin form expects.
        </p>
        <p className="mt-2 text-xs text-red-300/80">
          You should only need to run this once on an empty{" "}
          <code className="rounded bg-black/40 px-1 py-0.5 text-[0.75rem]">
            courses
          </code>{" "}
          collection. Running it multiple times will create duplicate courses.
        </p>
      </div>

      <form action={runCourseMigration} className="space-y-4">
        <button
          type="submit"
          className="rounded-lg bg-accentGold px-6 py-2.5 text-sm font-semibold text-background transition hover:bg-accentGold/90"
        >
          Run Migration
        </button>
      </form>
    </div>
  );
}

