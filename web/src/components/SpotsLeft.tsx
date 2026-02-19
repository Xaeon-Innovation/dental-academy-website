"use client";

import { useEffect, useState } from "react";
import { getEnrollmentCount } from "@/lib/actions/course";

interface SpotsLeftProps {
  courseId: string;
  maxParticipants?: number;
  className?: string;
}

export function SpotsLeft({ courseId, maxParticipants, className }: SpotsLeftProps) {
  const [spotsLeft, setSpotsLeft] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!maxParticipants) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    const fetchCount = async () => {
      try {
        const count = await getEnrollmentCount(courseId);
        if (!cancelled) {
          const left = Math.max(0, maxParticipants - count);
          setSpotsLeft(left);
          setLoading(false);
        }
      } catch (err) {
        console.error("Error fetching enrollment count:", err);
        if (!cancelled) {
          setLoading(false);
          // On error, show maxParticipants as spots left (assume no enrollments yet)
          setSpotsLeft(maxParticipants);
        }
      }
    };
    fetchCount();
    return () => {
      cancelled = true;
    };
  }, [courseId, maxParticipants]);

  // Refresh count periodically (every 10 seconds) to catch enrollments from other users
  useEffect(() => {
    if (!maxParticipants) return;
    const interval = setInterval(async () => {
      try {
        const count = await getEnrollmentCount(courseId);
        setSpotsLeft(Math.max(0, maxParticipants - count));
      } catch (err) {
        console.error("Error refreshing enrollment count:", err);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [courseId, maxParticipants]);

  if (!maxParticipants) {
    return null;
  }

  if (loading) {
    return (
      <div className={className}>
        <p className="text-xs text-white/60">Loading availability...</p>
      </div>
    );
  }

  // Fallback: if spotsLeft is still null after loading, show maxParticipants
  const displaySpots = spotsLeft ?? maxParticipants;

  const isLow = displaySpots <= 5;
  const isVeryLow = displaySpots <= 2;

  return (
    <div className={className}>
      <p className="text-xs text-white/60">
        {isVeryLow ? (
          <span className="font-semibold text-red-400">Only {displaySpots} spot{displaySpots !== 1 ? "s" : ""} left!</span>
        ) : isLow ? (
          <span className="font-semibold text-accentGold">Only {displaySpots} spots left</span>
        ) : (
          <span>{displaySpots} spots left</span>
        )}
      </p>
      {isLow && (
        <div className="mt-1 flex items-center gap-2">
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              isVeryLow ? "bg-red-400" : "bg-accentGold"
            } animate-pulse`}
            aria-hidden
          />
          <span className="text-[0.65rem] text-white/50">
            {isVeryLow ? "Hurry!" : "Limited availability"}
          </span>
        </div>
      )}
    </div>
  );
}
