import type { Metadata } from "next";
import CasesClient from "./CasesClient";

export const metadata: Metadata = {
  title: "Clinical Cases | Kaleidoscope Dental Academy",
  description:
    "Explore clinical cases and outcomes from Kaleidoscope Dental Academy. Review real-world implant workflows, planning, and results.",
};

export default function CasesPage() {
  return <CasesClient />;
}

