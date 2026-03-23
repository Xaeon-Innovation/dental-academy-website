"use client";

import Image from "next/image";
import { useState } from "react";
import { Play } from "lucide-react";
import { TextReveal } from "@/components/TextReveal";
import { VideoTestimonialModal } from "@/components/VideoTestimonialModal";
import {
  getYouTubeThumbnail,
  isDirectVideoUrl,
  type VideoTestimonialItem,
} from "@/lib/video-testimonials";

export interface VideoTestimonialsSectionProps {
  /** Video testimonials from home settings (admin uploads). When empty, section is hidden. */
  items?: VideoTestimonialItem[] | null;
}

function VideoCard({
  item,
  onPlay,
}: {
  item: VideoTestimonialItem;
  onPlay: () => void;
}) {
  // If admin chose a poster image, use it; otherwise use first frame (direct video) or platform thumbnail (YouTube)
  const hasChosenPoster = !!item.posterUrl;
  const fallbackThumbnail = getYouTubeThumbnail(item.videoUrl);
  const useFirstFrame = !hasChosenPoster && isDirectVideoUrl(item.videoUrl);

  return (
    <article className="video-testimonial-card group relative flex w-full max-w-[280px] flex-col mx-auto sm:mx-0">
      <button
        type="button"
        onClick={onPlay}
        className="relative flex w-full flex-col overflow-hidden rounded-[30px] text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-accentGold focus-visible:ring-offset-2 focus-visible:ring-offset-[#212121]"
        aria-label={`Play video testimonial from ${item.name}`}
      >
        {/* Vertical / phone-style video preview: chosen poster, or first frame of video, or YouTube thumbnail */}
        <div className="relative aspect-[9/16] w-full overflow-hidden bg-white/5">
          {hasChosenPoster ? (
            <Image
              src={item.posterUrl!}
              alt=""
              width={360}
              height={640}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : useFirstFrame ? (
            <video
              src={item.videoUrl}
              preload="auto"
              muted
              playsInline
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105 pointer-events-none"
              aria-hidden
            />
          ) : fallbackThumbnail ? (
            <Image
              src={fallbackThumbnail}
              alt=""
              width={360}
              height={640}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-white/5 to-white/10" />
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition opacity group-hover:opacity-100 group-focus-visible:opacity-100">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accentGold/90 text-black shadow-lg transition group-hover:scale-110">
              <Play className="h-7 w-7 fill-current pl-1" aria-hidden />
            </span>
          </div>
        </div>
        {/* Title and details with slightly transparent background */}
        <div className="flex flex-col justify-center bg-black/50 px-4 py-4">
          <h3 className="font-semibold tracking-tight text-white">
            {item.name}
          </h3>
          {item.credentials && (
            <p className="mt-1 text-xs text-accentGold/90">
              {item.credentials}
            </p>
          )}
          {item.quote && (
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-white/70">
              {item.quote}
            </p>
          )}
        </div>
      </button>
    </article>
  );
}

export function VideoTestimonialsSection({ items = [] }: VideoTestimonialsSectionProps) {
  const [modalItem, setModalItem] = useState<VideoTestimonialItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const list = (items ?? []).filter((v) => v.showOnHome !== false);

  const handlePlay = (item: VideoTestimonialItem) => {
    setModalItem(item);
    setModalOpen(true);
  };

  if (list.length === 0) return null;

  return (
    <>
      <section
        id="video-testimonials"
        className="relative z-20 bg-background px-4 py-20 text-white md:py-28"
      >
        {/* Far right: left half of goldsolid (same treatment as Course Tracks) */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 z-0 w-[min(70vw,520px)] max-w-[50vw] bg-[url('/images/logo/goldsolid.png')] bg-left bg-no-repeat bg-[length:200%_auto] opacity-[0.08] [mask-image:linear-gradient(to_left,black_0%,black_22%,rgb(0_0_0_/_0.65)_48%,rgb(0_0_0_/_0.28)_72%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_left,black_0%,black_22%,rgb(0_0_0_/_0.65)_48%,rgb(0_0_0_/_0.28)_72%,transparent_100%)] sm:w-[min(74vw,760px)] sm:max-w-none sm:opacity-[0.1] md:w-[min(78vw,920px)] md:opacity-[0.12]"
        />
        <div className="relative z-10 mx-auto max-w-6xl">
          <div className="text-center">
            <TextReveal className="block text-xs font-semibold uppercase tracking-[0.2em] text-accentGold">
              Video testimonials
            </TextReveal>
            <h2 className="mt-4 font-[var(--font-playfair)] text-3xl tracking-tight md:text-4xl">
              <TextReveal>Hear from our Delegates</TextReveal>
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-white/70 md:text-base">
              Watch what past delegates say about their experience at the Academy.
            </p>
          </div>
          <div className="mt-12 flex flex-wrap justify-center gap-6">
            {list.map((item) => (
              <VideoCard key={item.id} item={item} onPlay={() => handlePlay(item)} />
            ))}
          </div>
        </div>
      </section>
      <VideoTestimonialModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        item={modalItem}
      />
    </>
  );
}
