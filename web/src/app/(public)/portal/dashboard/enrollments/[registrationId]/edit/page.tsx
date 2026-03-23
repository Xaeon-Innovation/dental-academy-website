import { redirect } from "next/navigation";

/** Detailed enrollment editing removed; delegates use minimal enrollment and profile only. */
export default async function EditEnrollmentRedirectPage() {
  redirect("/portal/dashboard");
}
