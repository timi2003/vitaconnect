/** @type {import('next').NextConfig} */
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  fallbacks: {
    document: "/offline",
  },
  buildExcludes: [/middleware-manifest\.json$/],
});

const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      "uploadthing.com",
      "utfs.io",
      "lh3.googleusercontent.com",
      "avatars.githubusercontent.com",
      "ui-avatars.com",
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ["*"],
    },
  },
};

module.exports = withPWA(nextConfig);
