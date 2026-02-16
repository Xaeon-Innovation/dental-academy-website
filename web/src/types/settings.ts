export interface SiteSettings {
  siteName?: string;
  contactEmail?: string;
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    facebook?: string;
    instagram?: string;
  };
  featureFlags?: Record<string, boolean>;
  [key: string]: unknown;
}
