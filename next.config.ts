import type { NextConfig } from "next";

function mediaRemotePatterns(): NonNullable<NextConfig["images"]>["remotePatterns"] {
  const patterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [
    {
      hostname: "images.unsplash.com",
      pathname: "/**",
      protocol: "https",
    },
    {
      hostname: "*.amazonaws.com",
      pathname: "/**",
      protocol: "https",
    },
    {
      hostname: "*.r2.dev",
      pathname: "/**",
      protocol: "https",
    },
    {
      hostname: "*.cloudflarestorage.com",
      pathname: "/**",
      protocol: "https",
    },
  ];

  const publicBase = process.env.S3_PUBLIC_BASE_URL?.trim();
  if (publicBase) {
    try {
      const url = new URL(publicBase);
      if (url.hostname && url.protocol.startsWith("http")) {
        patterns.push({
          hostname: url.hostname,
          pathname: "/**",
          protocol: url.protocol.replace(":", "") as "http" | "https",
        });
      }
    } catch {
      // ignore invalid S3_PUBLIC_BASE_URL at build time
    }
  }

  return patterns;
}

const nextConfig: NextConfig = {
  serverExternalPackages: ["pg"],
  compress: true,
  devIndicators: {
    position: "bottom-right",
  },
  experimental: {
    optimizePackageImports: ["zod"],
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
  images: {
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    formats: ["image/avif", "image/webp"],
    imageSizes: [64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    qualities: [70, 75, 78],
    remotePatterns: mediaRemotePatterns(),
  },
  async headers() {
    return [
      {
        source: "/brand/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
          {
            key: "Service-Worker-Allowed",
            value: "/",
          },
        ],
      },
      {
        source: "/icon.svg",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
