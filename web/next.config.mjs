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
};

export default nextConfig;
