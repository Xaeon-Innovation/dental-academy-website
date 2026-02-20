/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["firebase-admin"],
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
        hostname: "**.public.blob.vercel-storage.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
