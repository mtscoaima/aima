import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://aima.one";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login", "/signup", "/terms", "/privacy", "/support"],
        disallow: [
          "/admin/*",
          "/api/*",
          "/my-site/*",
          "/messages/*",
          "/reservations/*",
          "/credit-management",
          "/target-marketing",
          "/salesperson/*",
          "/payment/*",
          "/auth/inicis/*",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
