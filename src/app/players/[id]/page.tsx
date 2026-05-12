export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { MapPin, Trophy, Swords, Award } from "lucide-react";
import Link from "next/link";
import { PlayerCardWrapper } from "./player-card-wrapper";

export default async function PlayerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

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

  const memberSince = user.createdAt.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="px-4 py-6 pb-20 max-w-md mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-20 h-20 bg-brand rounded-full flex items-center justify-center mx-auto mb-3">
          {user.image ? (
            <img src={user.image} alt="" className="w-20 h-20 rounded-full object-cover" />
          ) : (
            <span className="text-2xl font-bold text-white font-serif">
              {user.name[0]?.toUpperCase()}
            </span>
          )}
        </div>
        <h1 className="font-serif text-2xl tracking-tight">{user.name}</h1>
        {user.city && (
          <p className="text-sm text-muted-foreground font-sans flex items-center justify-center gap-1 mt-1">
            <MapPin className="w-3.5 h-3.5" /> {user.city}{user.state ? `, ${user.state}` : ""}
          </p>
        )}
        <div className="flex items-center justify-center gap-2 mt-2">
          <Badge variant="info">{user.role.replace(/_/g, " ")}</Badge>
          {user.gender && <Badge>{user.gender}</Badge>}
        </div>
        {user.bio && (
          <p className="text-sm text-muted-foreground mt-3 max-w-xs mx-auto leading-relaxed">{user.bio}</p>
        )}
        <p className="text-xs text-muted-foreground mt-2">Member since {memberSince}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center py-4">
          <Trophy className="w-5 h-5 text-brand mx-auto mb-1" />
          <p className="text-2xl font-bold tabular-nums">{leaguesPlayed}</p>
          <p className="text-[9px] tracking-soho font-sans uppercase text-muted-foreground">Leagues</p>
        </Card>
        <Card className="text-center py-4">
          <Swords className="w-5 h-5 text-brand mx-auto mb-1" />
          <p className="text-2xl font-bold tabular-nums">{matchesPlayed}</p>
          <p className="text-[9px] tracking-soho font-sans uppercase text-muted-foreground">Matches</p>
        </Card>
        <Card className="text-center py-4">
          <Award className="w-5 h-5 text-brand mx-auto mb-1" />
          <p className="text-2xl font-bold tabular-nums">{wins}</p>
          <p className="text-[9px] tracking-soho font-sans uppercase text-muted-foreground">Wins</p>
        </Card>
      </div>

      {/* Player Card (QR + shareable) */}
      <div>
        <p className="text-[10px] tracking-soho font-sans font-medium uppercase text-muted-foreground mb-3">Player Card</p>
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
      </div>

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
