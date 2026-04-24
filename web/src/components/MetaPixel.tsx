"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";

function getPixelId(): string {
  const raw = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() ?? "";
  return /^\d{10,20}$/.test(raw) ? raw : "";
}

/**
 * Meta Pixel base code (PageView). Loads site-wide when `NEXT_PUBLIC_META_PIXEL_ID` is a valid numeric ID.
 * Subsequent `PageView` on client-side navigations (App Router).
 */
export function MetaPixel() {
  const pixelId = useMemo(() => getPixelId(), []);
  const pathname = usePathname();
  /** Avoid double PageView on first load (bootstrap sends it); only fire on real client navigations. */
  const prevPathnameRef = useRef<string | null>(null);

  useEffect(() => {
    if (!pixelId) return;
    const prev = prevPathnameRef.current;
    if (prev !== null && prev !== pathname) {
      window.fbq?.("track", "PageView");
    }
    prevPathnameRef.current = pathname;
  }, [pathname, pixelId]);

  if (!pixelId) return null;

  const inlineBootstrap = `
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${pixelId}');
fbq('track', 'PageView');
`.trim();

  return (
    <>
      <Script
        id="meta-pixel-bootstrap"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: inlineBootstrap }}
      />
      <noscript>
        <img
          height="1"
          width="1"
          className="hidden"
          src={`https://www.facebook.com/tr?id=${encodeURIComponent(pixelId)}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}
