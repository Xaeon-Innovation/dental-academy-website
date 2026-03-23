export interface VideoTestimonialItem {
  id: string;
  name: string;
  credentials?: string;
  quote?: string;
  videoUrl: string;
  posterUrl?: string;
  /** When false, video is hidden from the home page but kept in the list. Default true. */
  showOnHome?: boolean;
}

export interface HomeSettings {
  philosophyHeading?: string;
  philosophyTitle?: string;
  philosophyBody?: string;
  philosophyImageUrl?: string;
  ctaTitle?: string;
  ctaBody?: string;
  ctaBackgroundImageUrl?: string;
  /**
   * Home page course track card image (iPlace // iRestore).
   * Prefer a Vercel Blob URL in production (upload via Admin → Home).
   */
  courseTrackIplaceImageUrl?: string;
  /**
   * Home page course track card image (Full Arch Intensive).
   * Prefer a Vercel Blob URL in production.
   */
  courseTrackFullArchImageUrl?: string;
  /** Video testimonials shown on the home page (uploaded via admin). */
  videoTestimonials?: VideoTestimonialItem[];
}

export interface SiteSettings {
  siteName?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactLocation?: string;
  mapEmbedSrc?: string;
  adminEmails?: string[]; // List of emails allowed to access admin dashboard
  /** When false, Blog link is hidden from header and footer. Default true. */
  showBlogInNav?: boolean;
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    facebook?: string;
    instagram?: string;
    youtube?: string;
  };
  featureFlags?: Record<string, boolean>;
  /** Optional home page content configuration */
  home?: HomeSettings;
  [key: string]: unknown;
}
