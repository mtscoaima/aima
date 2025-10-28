import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: [
      "oaidalleapiprodscus.blob.core.windows.net",
      "images.unsplash.com",
      "via.placeholder.com",
      "picsum.photos",
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "oaidalleapiprodscus.blob.core.windows.net",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.windows.net",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.supabase.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "plulovyzbvlmqdzmlnbp.supabase.co",
        pathname: "/**",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/reservations",
        destination: "/messages/send?tab=reservations",
        permanent: true,
      },
      {
        source: "/reservations/:path*",
        destination: "/messages/reservations/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
