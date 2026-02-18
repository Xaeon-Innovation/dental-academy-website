import { redirect } from "next/navigation";
import { migrateInstructorsToFirestore } from "@/lib/migrations/instructors";

async function runInstructorMigration() {
  "use server";

  const result = await migrateInstructorsToFirestore();

  // Optionally, you could log the result on the server
  console.log("Instructor migration result:", result);

  // After seeding, go back to the instructors list
  redirect("/admin/instructors");
}

export default function MigrateInstructorsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[var(--font-playfair)] text-2xl tracking-tight">
          Migrate Constant Instructors to Firestore
        </h1>
        <p className="mt-2 text-sm text-white/70">
          This will read the existing constant instructor definitions and create
          matching instructor documents in Firestore using the same data that the
          admin form expects.
        </p>
        <p className="mt-2 text-xs text-red-300/80">
          You should only need to run this once on an empty{" "}
          <code className="rounded bg-black/40 px-1 py-0.5 text-[0.75rem]">
            instructors
          </code>{" "}
          collection. Running it multiple times will create duplicate instructors.
        </p>
      </div>

      <form action={runInstructorMigration} className="space-y-4">
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
