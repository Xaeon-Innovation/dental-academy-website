import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["firebase-admin"],
  turbopack: {
    // Use web folder as root so Next doesn't get confused by root package-lock.json
    root: __dirname,
  },
  async rewrites() {
    return [
      // Search engines (Google, Bing) often request /favicon.ico; serve our icon so they show it in results
      { source: "/favicon.ico", destination: "/logoicoB.png" },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
