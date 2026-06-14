/** @type {import('next').NextConfig} */
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",

  // Better fallbacks
  fallbacks: {
    document: "/offline",
    image: "/icons/icon-192x192.png",   // fallback for images
  },

  // Better caching strategy
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.(?:gstatic|googleapis)\.com\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "google-fonts",
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 365 days
        },
      },
    },
    {
      urlPattern: /\.(?:eot|otf|ttc|ttf|woff|woff2|font\.css)$/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "static-font-assets",
      },
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif)$/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "static-image-assets",
      },
    },
  ],

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