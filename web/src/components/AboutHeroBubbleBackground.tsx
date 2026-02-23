"use client";

import { BubbleBackground } from "@/components/animate-ui/components/backgrounds/bubble";

const THEME_BUBBLE_COLORS = {
  first: "201,168,110",   // accentGold #c9a86e
  second: "180,150,100",  // darker gold
  third: "220,195,140",   // lighter gold
  fourth: "160,130,80",   // amber
  fifth: "190,160,110",   // mid gold
  sixth: "201,168,110",   // accentGold
};

type AboutHeroBubbleBackgroundProps = {
  interactive?: boolean;
};

export function AboutHeroBubbleBackground({
  interactive = false,
}: AboutHeroBubbleBackgroundProps) {
  return (
    <BubbleBackground
      interactive={interactive}
      colors={THEME_BUBBLE_COLORS}
      gradientOpacity={0.2}
      className="absolute inset-0 flex items-center justify-center"
    />
  );
}
