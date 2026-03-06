/**
 * Helpers for video testimonials (embed URLs, thumbnails).
 * Video testimonial data is stored in HomeSettings.videoTestimonials (admin uploads).
 */

import type { VideoTestimonialItem } from "@/types/settings";

export type { VideoTestimonialItem };

/** Parse YouTube or Vimeo URL and return iframe embed URL, or null for direct video (e.g. MP4). */
export function getVideoEmbedUrl(url: string): { type: "youtube" | "vimeo" | "video"; src: string } | null {
  if (!url || typeof url !== "string") return null;
  const u = url.trim();

  const ytMatch = u.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) {
    return { type: "youtube", src: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1` };
  }

  const vimeoMatch = u.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) {
    return { type: "vimeo", src: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1` };
  }

  if (
    u.endsWith(".mp4") ||
    u.endsWith(".webm") ||
    u.startsWith("blob:") ||
    u.includes(".mp4?") ||
    u.includes(".webm?")
  ) {
    return { type: "video", src: u };
  }

  return null;
}

/** Whether the URL is a direct video file (MP4/WebM) for first-frame preview. */
export function isDirectVideoUrl(url: string): boolean {
  const embed = getVideoEmbedUrl(url);
  return embed?.type === "video";
}

/** Get thumbnail URL for YouTube (when posterUrl not provided). */
export function getYouTubeThumbnail(url: string): string | null {
  const match = url.trim().match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (!match) return null;
  return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
}

/** Fallback when no video testimonials are configured in admin (e.g. static config). */
export const VIDEO_TESTIMONIALS: VideoTestimonialItem[] = [];
