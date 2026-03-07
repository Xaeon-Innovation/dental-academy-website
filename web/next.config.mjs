/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["firebase-admin"],
  // Skip TypeScript check during build to save memory and time; run `npm run typecheck` in CI or pre-push
  typescript: { ignoreBuildErrors: true },
  // Disable source maps to reduce build memory usage (avoids OOM on default Vercel build machine)
  productionBrowserSourceMaps: false,
  enablePrerenderSourceMaps: false,
  experimental: {
    serverActions: { bodySizeLimit: "100mb" },
    webpackMemoryOptimizations: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "img.youtube.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
