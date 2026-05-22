import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://cadresports.vercel.app";

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${baseUrl}/leagues`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/sports`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/connect`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
    { url: `${baseUrl}/auth/signin`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/auth/register`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ];

  // Dynamic league pages
  const leagues = await db.league.findMany({
    select: { slug: true, updatedAt: true },
  });

  const leaguePages: MetadataRoute.Sitemap = leagues.flatMap((league) => [
    {
      url: `${baseUrl}/leagues/${league.slug}`,
      lastModified: league.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/leagues/${league.slug}/standings`,
      lastModified: league.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/leagues/${league.slug}/matches`,
      lastModified: league.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.7,
    },
  ]);

  // Public player profiles
  const players = await db.user.findMany({
    where: { onboardingDone: true },
    select: { id: true, updatedAt: true },
    take: 500,
  });

  const playerPages: MetadataRoute.Sitemap = players.map((player) => ({
    url: `${baseUrl}/players/${player.id}`,
    lastModified: player.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  return [...staticPages, ...leaguePages, ...playerPages];
}
