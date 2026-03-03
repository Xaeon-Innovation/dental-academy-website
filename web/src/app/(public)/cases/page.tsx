import { getCases } from "@/lib/actions/case";
import CasesDisplay from "@/components/CasesDisplay";
import type { Case } from "@/types/case";

export default async function CasesPage() {
  let cases: Case[] = [];
  try {
    const result = await getCases();
    // Ensure result is an array
    if (Array.isArray(result)) {
      cases = result;
    } else {
      console.error("Invalid cases data received:", result);
      cases = [];
    }
  } catch (error: any) {
    console.error("Failed to load cases:", error);
    // Log detailed error for debugging
    if (error?.message) {
      console.error("Error message:", error.message);
    }
    if (error?.stack) {
      console.error("Error stack:", error.stack);
    }
    cases = [];
  }

  return (
    <div className="bg-background px-4 py-16 text-white md:py-20">
      <div className="mx-auto max-w-6xl">
        <h1 className="font-[var(--font-playfair)] text-3xl tracking-tight md:text-4xl">
          Cases
        </h1>
        <p className="mt-4 text-white/70">
          Clinical case studies and before/after results
        </p>
        <div className="mt-8">
          <CasesDisplay cases={cases} />
        </div>
      </div>
    </div>
  );
}
