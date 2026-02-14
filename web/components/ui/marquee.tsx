"use client";

import { type ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

interface MarqueeProps extends ComponentPropsWithoutRef<"div"> {
  className?: string;
  reverse?: boolean;
  pauseOnHover?: boolean;
  children: React.ReactNode;
  vertical?: boolean;
  repeat?: number;
}

export function Marquee({
  className,
  reverse = false,
  pauseOnHover = false,
  children,
  vertical = false,
  repeat = 2,
  ...props
}: MarqueeProps) {
  return (
    <div
      {...props}
      className={cn(
        "group flex overflow-hidden p-2 [--duration:40s] [--gap:1rem]",
        {
          "flex-row": !vertical,
          "flex-col": vertical,
        },
        className
      )}
    >
      <div
        className={cn(
          "flex shrink-0 [gap:var(--gap)]",
          vertical ? "marquee-track-vertical" : "marquee-track",
          pauseOnHover && "group-hover:[animation-play-state:paused]",
          reverse && "[animation-direction:reverse]",
          !vertical && "flex-row",
          vertical && "flex-col"
        )}
      >
        {Array(repeat)
          .fill(null)
          .map((_, i) => (
            <div
              key={i}
              className={cn("flex shrink-0 [gap:var(--gap)]", !vertical && "flex-row", vertical && "flex-col")}
            >
              {children}
            </div>
          ))}
      </div>
    </div>
  );
}
