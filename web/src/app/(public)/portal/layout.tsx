import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portal | Kaleidoscope Dental Academy",
  description: "Delegate portal for Kaleidoscope Dental Academy.",
  robots: { index: false, follow: false },
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

