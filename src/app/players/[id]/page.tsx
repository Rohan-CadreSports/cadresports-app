export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronRight } from "lucide-react";
import Link from "next/link";
import QRCode from "qrcode";
import { headers } from "next/headers";
import { PlayerCardWrapper } from "./player-card-wrapper";
import { PlayedMatches } from "./played-matches";

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

  // Fetch leagues — all approved registrations
  const allRegs = await db.playerRegistration.findMany({
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
  });

  // Sort: upcoming first, then live, then completed
  const statusOrder: Record<string, number> = {
    REGISTRATION_OPEN: 0,
    DRAFT: 1,
    REGISTRATION_CLOSED: 2,
    IN_PROGRESS: 3,
    COMPLETED: 4,
    CANCELLED: 5,
  };
  const sortedLeagues = allRegs
    .map((r) => r.league)
    .sort((a, b) => (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99));

  // Fetch played matches for this player
  const playedMatchEntries = await db.lineupEntry.findMany({
    where: { playerId: id },
    select: {
      match: {
        select: {
          id: true,
          matchNumber: true,
          format: true,
          status: true,
          winnerId: true,
          scores: { orderBy: { createdAt: "desc" }, take: 1 },
          tie: {
            select: {
              round: true,
              homeTeam: { select: { id: true, name: true } },
              awayTeam: { select: { id: true, name: true } },
              division: {
                select: {
                  league: {
                    select: { name: true, slug: true, sport: { select: { slug: true } } },
                  },
                },
              },
            },
          },
        },
      },
      lineup: { select: { teamId: true } },
    },
    orderBy: { match: { createdAt: "desc" } },
  });

  const playedMatches = playedMatchEntries.map((entry) => ({
    matchId: entry.match.id,
    matchNumber: entry.match.matchNumber,
    format: entry.match.format,
    status: entry.match.status,
    playerTeamId: entry.lineup.teamId,
    winnerId: entry.match.winnerId,
    round: entry.match.tie.round,
    homeTeam: entry.match.tie.homeTeam,
    awayTeam: entry.match.tie.awayTeam,
    leagueName: entry.match.tie.division.league.name,
    leagueSlug: entry.match.tie.division.league.slug,
    sportSlug: entry.match.tie.division.league.sport.slug,
    scoreData: entry.match.scores[0]?.scoreData ?? null,
  }));

  // Generate QR code server-side
  const headersList = await headers();
  const host = headersList.get("host") || "cadresports-app.vercel.app";
  const protocol = host.includes("localhost") ? "http" : "https";
  const profileUrl = `${protocol}://${host}/players/${id}`;
  const qrDataUrl = await QRCode.toDataURL(profileUrl, {
    width: 120,
    margin: 1,
    color: { dark: "#1A1A1A", light: "#FFFEF7" },
    errorCorrectionLevel: "M",
  });

  return (
    <div className="pb-20">
      {/* Card */}
      <div className="px-3 pt-4">
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
          qrDataUrl={qrDataUrl}
        />
      </div>

      <div className="px-4 mt-5 space-y-5">
        {/* Bio */}
        {user.bio && (
          <p className="text-sm text-muted-foreground leading-relaxed">{user.bio}</p>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="info">{user.role.replace(/_/g, " ")}</Badge>
          {user.gender && <Badge>{user.gender}</Badge>}
          {user.favoriteSports.map((sport) => (
            <Badge key={sport}>{sport}</Badge>
          ))}
        </div>

        {/* Played Matches */}
        {playedMatches.length > 0 && (
          <PlayedMatches matches={playedMatches} playerName={user.name} />
        )}

        {/* Sign Up CTA */}
        {!session && (
          <Link href="/auth/register" className="block">
            <div className="rounded-[10px] bg-accent text-accent-foreground p-5 flex items-center justify-between active:scale-[0.98] transition-transform">
              <div>
                <p className="text-[10px] tracking-wide font-medium uppercase opacity-60 mb-1">Join the Club</p>
                <p className="text-lg font-semibold tracking-tight">Want to compete?</p>
              </div>
              <div className="w-10 h-10 bg-brand rounded-full flex items-center justify-center shrink-0">
                <ArrowRight className="w-5 h-5 text-white" />
              </div>
            </div>
          </Link>
        )}

        {/* Leagues — sorted: upcoming → live → completed */}
        {sortedLeagues.length > 0 && (
          <div>
            <p className="text-[10px] tracking-wide font-medium uppercase text-muted-foreground mb-3">Leagues</p>
            <div className="space-y-1.5">
              {sortedLeagues.map((league) => (
                <Link key={league.id} href={`/leagues/${league.slug}`}>
                  <div className="flex items-center justify-between py-3 px-3.5 rounded-[10px] bg-surface border border-border-light active:scale-[0.98] transition-transform">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{league.name}</p>
                      <p className="text-xs text-muted-foreground">{league.sport.name}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <Badge variant={
                        league.status === "IN_PROGRESS" ? "success" :
                        league.status === "REGISTRATION_OPEN" ? "info" :
                        league.status === "COMPLETED" ? "default" :
                        "warning"
                      }>
                        {league.status === "REGISTRATION_OPEN" ? "Upcoming" :
                         league.status.replace(/_/g, " ")}
                      </Badge>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
