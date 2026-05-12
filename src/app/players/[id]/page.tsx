export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { PlayerCardWrapper } from "./player-card-wrapper";

export default async function PlayerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const user = await db.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      image: true,
      bio: true,
      city: true,
      state: true,
      gender: true,
      role: true,
      favoriteSports: true,
      createdAt: true,
    },
  });

  if (!user) notFound();

  // Stats
  const leaguesPlayed = await db.playerRegistration.count({
    where: { playerId: id, status: "APPROVED" },
  });

  const matchesPlayed = await db.lineupEntry.count({
    where: { playerId: id },
  });

  const wonLineupEntries = await db.lineupEntry.findMany({
    where: { playerId: id },
    select: {
      lineup: { select: { teamId: true } },
      match: { select: { winnerId: true } },
    },
  });

  const wins = wonLineupEntries.filter(
    (entry) => entry.match.winnerId && entry.match.winnerId === entry.lineup.teamId
  ).length;

  // Recent leagues
  const recentLeagues = await db.playerRegistration.findMany({
    where: { playerId: id, status: "APPROVED" },
    include: {
      league: {
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          sport: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return (
    <div className="px-4 py-6 pb-20 max-w-md mx-auto space-y-6">
      {/* Player Card — single source of identity */}
      <PlayerCardWrapper
        player={{
          id: user.id,
          name: user.name,
          city: user.city,
          gender: user.gender,
          role: user.role,
          createdAt: user.createdAt.toISOString(),
          favoriteSports: user.favoriteSports,
          image: user.image,
        }}
        stats={{ leaguesPlayed, matchesPlayed, wins }}
      />

      {/* Bio */}
      {user.bio && (
        <p className="text-sm text-muted-foreground text-center max-w-xs mx-auto leading-relaxed">{user.bio}</p>
      )}

      {/* Sign Up CTA — shown to non-logged-in visitors */}
      {!session && (
        <div className="bg-accent text-accent-foreground p-5 text-center">
          <p className="text-[10px] tracking-soho font-sans font-medium uppercase opacity-60 mb-2">Join the Club</p>
          <h3 className="font-serif text-xl tracking-tight mb-3">Want to compete?</h3>
          <Link href="/auth/register">
            <Button size="md">
              Sign Up Free
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      )}

      {/* Favorite Sports */}
      {user.favoriteSports.length > 0 && (
        <div>
          <p className="text-[10px] tracking-soho font-sans font-medium uppercase text-muted-foreground mb-2">Sports</p>
          <div className="flex flex-wrap gap-1.5">
            {user.favoriteSports.map((sport) => (
              <Badge key={sport}>{sport}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Recent Leagues */}
      {recentLeagues.length > 0 && (
        <div>
          <p className="text-[10px] tracking-soho font-sans font-medium uppercase text-muted-foreground mb-3">Recent Leagues</p>
          <div className="space-y-2">
            {recentLeagues.map((reg) => (
              <Link key={reg.league.id} href={`/leagues/${reg.league.slug}`}>
                <Card className="flex items-center justify-between press-effect hover:shadow-[var(--shadow-md)]">
                  <div>
                    <p className="text-sm font-semibold font-sans">{reg.league.name}</p>
                    <p className="text-xs text-muted-foreground">{reg.league.sport.name}</p>
                  </div>
                  <Badge variant={reg.league.status === "IN_PROGRESS" ? "success" : reg.league.status === "COMPLETED" ? "default" : "info"}>
                    {reg.league.status.replace(/_/g, " ")}
                  </Badge>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
