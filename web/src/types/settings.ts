export interface HomeSettings {
  philosophyHeading?: string;
  philosophyTitle?: string;
  philosophyBody?: string;
  philosophyImageUrl?: string;
  ctaTitle?: string;
  ctaBody?: string;
  ctaBackgroundImageUrl?: string;
}

export interface SiteSettings {
  siteName?: string;
  contactEmail?: string;
  adminEmails?: string[]; // List of emails allowed to access admin dashboard
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    facebook?: string;
    instagram?: string;
  };
  featureFlags?: Record<string, boolean>;
  /** Optional home page content configuration */
  home?: HomeSettings;
  [key: string]: unknown;
}
