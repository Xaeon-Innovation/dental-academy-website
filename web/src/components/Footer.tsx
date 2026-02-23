import Link from "next/link";
import Image from "next/image";
import { Facebook, Instagram, Linkedin, Youtube } from "lucide-react";
import { getSettings } from "@/lib/actions/settings";

const footerLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/courses", label: "Courses" },
  { href: "/cases", label: "Cases" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
];

const legalLinks = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms & Conditions" },
  { href: "/admin/login", label: "Staff login", ariaLabel: "Admin login" },
];

const DEFAULT_EMAIL = "kaleidoscopedentalacademy@gmail.com";

const SOCIAL_CONFIG = [
  { key: "facebook" as const, label: "Facebook", icon: Facebook },
  { key: "instagram" as const, label: "Instagram", icon: Instagram },
  { key: "linkedin" as const, label: "LinkedIn", icon: Linkedin },
  { key: "youtube" as const, label: "YouTube", icon: Youtube },
];

export default async function Footer() {
  const settings = await getSettings();
  const contactEmail = settings.contactEmail?.trim() || DEFAULT_EMAIL;
  const contactPhone = settings.contactPhone?.trim();
  const socialLinksToShow = SOCIAL_CONFIG.filter(({ key }) => {
    const url = settings.socialLinks?.[key]?.trim();
    return url && url !== "";
  }).map(({ key, label, icon }) => ({
    href: settings.socialLinks![key]!,
    label,
    icon,
  }));

  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/5 bg-black/60 backdrop-blur-sm">
      {/* Main footer content */}
      <div className="mx-auto max-w-6xl px-4 py-12 md:py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand column */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="inline-block">
              <Image
                src="/images/logo/logoTransparent.png"
                alt="Kaleidoscope Dental Academy"
                width={140}
                height={50}
                className="h-auto w-[140px] object-contain"
              />
            </Link>
            <p className="mt-4 text-sm font-medium uppercase tracking-[0.2em] text-accentGold/90">
              Precision Implant Education
            </p>
            <p className="mt-2 max-w-xs text-xs leading-relaxed text-white/50">
              iPlace & iRestore training for dental professionals.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-accentGold">
              Quick links
            </h3>
            <ul className="mt-4 space-y-2.5">
              {footerLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-white/55 transition hover:text-accentGold focus:outline-none focus:ring-2 focus:ring-accentGold/50 focus:ring-offset-2 focus:ring-offset-transparent"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & legal */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-accentGold">
              Get in touch
            </h3>
            <ul className="mt-4 space-y-2.5">
              <li>
                <a
                  href={`mailto:${contactEmail}`}
                  className="text-sm text-white/55 transition hover:text-accentGold focus:outline-none focus:ring-2 focus:ring-accentGold/50 focus:ring-offset-2 focus:ring-offset-transparent"
                >
                  {contactEmail}
                </a>
              </li>
              {contactPhone && (
                <li>
                  <a
                    href={`tel:${contactPhone.replace(/\s/g, "")}`}
                    className="text-sm text-white/55 transition hover:text-accentGold focus:outline-none focus:ring-2 focus:ring-accentGold/50 focus:ring-offset-2 focus:ring-offset-transparent"
                  >
                    {contactPhone}
                  </a>
                </li>
              )}
              {legalLinks.map(({ href, label, ariaLabel }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-white/55 transition hover:text-accentGold focus:outline-none focus:ring-2 focus:ring-accentGold/50 focus:ring-offset-2 focus:ring-offset-transparent"
                    aria-label={ariaLabel}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex flex-wrap gap-3">
              {socialLinksToShow.map(({ href, label, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full p-2 text-white/55 transition hover:bg-white/10 hover:text-accentGold focus:outline-none focus:ring-2 focus:ring-accentGold/50 focus:ring-offset-2 focus:ring-offset-transparent"
                  aria-label={label}
                >
                  <Icon className="h-5 w-5" strokeWidth={1.5} />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/5">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-5 text-center sm:flex-row sm:text-left">
          <p className="text-xs text-white/45">
            &copy; {year} Kaleidoscope Dental Academy. All rights reserved.
          </p>
          <p className="text-[0.65rem] font-medium uppercase tracking-[0.25em] text-white/35">
            Precision Implant Education
          </p>
        </div>
      </div>
    </footer>
  );
}
