"use client";

import {
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  useRef,
  useState,
  useCallback,
} from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const ArrowIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="ml-1.5 inline-block shrink-0"
    aria-hidden
  >
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);

type BaseProps = {
  children: React.ReactNode;
  hoverText?: React.ReactNode;
  className?: string;
  variant?: "primary" | "secondary";
};

type ButtonProps = BaseProps & ButtonHTMLAttributes<HTMLButtonElement>;
type LinkProps = BaseProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

type InteractiveHoverButtonProps = ButtonProps | LinkProps;

function isLinkProps(props: InteractiveHoverButtonProps): props is LinkProps {
  return "href" in props && props.href !== undefined;
}

export function InteractiveHoverButton(props: InteractiveHoverButtonProps) {
  const {
    children,
    hoverText,
    className,
    variant = "primary",
    ...rest
  } = props;

  const ref = useRef<HTMLAnchorElement | HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setPosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    },
    []
  );

  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);

  const displayHoverText = hoverText ?? children;
  const showArrow = variant === "primary";

  const baseClasses =
    "relative overflow-hidden rounded-full border-2 px-8 py-3 text-sm font-semibold uppercase tracking-[0.16em] transition duration-300";

  const variantClasses = {
    primary:
      "border-accentGold bg-accentGold text-background hover:border-accentGold/90",
    secondary: "border-accentGold text-accentGold hover:bg-accentGold/10",
  };

  const content = (
    <>
      {/* Spotlight gradient following cursor (position via CSS vars) */}
      <span
        className={cn(
          "interactive-hover-button-spotlight pointer-events-none absolute inset-0 transition-opacity duration-300",
          isHovered ? "opacity-100" : "opacity-0"
        )}
        style={
          {
            "--spotlight-x": `${position.x}px`,
            "--spotlight-y": `${position.y}px`,
          } as React.CSSProperties
        }
        aria-hidden
      />
      {/* Text layers for slide animation */}
      <span className="relative z-10 flex items-center justify-center">
        <span
          className={cn(
            "inline-block transition-all duration-300",
            isHovered && "-translate-x-2 opacity-0"
          )}
        >
          {children}
        </span>
        <span
          className={cn(
            "absolute inline-flex items-center transition-all duration-300",
            isHovered ? "translate-x-0 opacity-100" : "translate-x-2 opacity-0"
          )}
        >
          {displayHoverText}
          {showArrow && <ArrowIcon />}
        </span>
      </span>
    </>
  );

  const shared = {
    ref,
    className: cn(baseClasses, variantClasses[variant], className),
    onMouseMove: handleMouseMove,
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
  };

  if (isLinkProps(props)) {
    const { href, ...linkRest } = rest as Omit<LinkProps, keyof BaseProps>;
    return (
      <Link
        href={href}
        {...shared}
        {...linkRest}
        ref={ref as React.Ref<HTMLAnchorElement>}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      {...shared}
      {...(rest as Omit<ButtonProps, keyof BaseProps>)}
      ref={ref as React.Ref<HTMLButtonElement>}
    >
      {content}
    </button>
  );
}
