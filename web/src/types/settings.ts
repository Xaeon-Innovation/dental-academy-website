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
  [key: string]: unknown;
}
