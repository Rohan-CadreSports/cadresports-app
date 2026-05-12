export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronRight } from "lucide-react";
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
    <div className="pb-20">
      {/* Card — full bleed on mobile, no padding */}
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
        />
      </div>

      <div className="px-4 mt-5 space-y-5">
        {/* Bio */}
        {user.bio && (
          <p className="text-sm text-muted-foreground leading-relaxed">{user.bio}</p>
        )}

        {/* Tags row — role, gender, sports */}
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="info">{user.role.replace(/_/g, " ")}</Badge>
          {user.gender && <Badge>{user.gender}</Badge>}
          {user.favoriteSports.map((sport) => (
            <Badge key={sport}>{sport}</Badge>
          ))}
        </div>

        {/* Sign Up CTA — only for visitors not logged in */}
        {!session && (
          <Link href="/auth/register" className="block">
            <div className="bg-accent text-accent-foreground p-5 flex items-center justify-between active:scale-[0.98] transition-transform">
              <div>
                <p className="text-[10px] tracking-soho font-sans font-medium uppercase opacity-60 mb-1">Join the Club</p>
                <p className="font-serif text-lg tracking-tight">Want to compete?</p>
              </div>
              <div className="w-10 h-10 bg-brand rounded-full flex items-center justify-center shrink-0">
                <ArrowRight className="w-5 h-5 text-white" />
              </div>
            </div>
          </Link>
        )}

        {/* Recent Leagues */}
        {recentLeagues.length > 0 && (
          <div>
            <p className="text-[10px] tracking-soho font-sans font-medium uppercase text-muted-foreground mb-3">Leagues</p>
            <div className="space-y-1.5">
              {recentLeagues.map((reg) => (
                <Link key={reg.league.id} href={`/leagues/${reg.league.slug}`}>
                  <div className="flex items-center justify-between py-3 px-3.5 bg-surface border border-border-light active:scale-[0.98] transition-transform">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold font-sans truncate">{reg.league.name}</p>
                      <p className="text-xs text-muted-foreground">{reg.league.sport.name}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <Badge variant={reg.league.status === "IN_PROGRESS" ? "success" : reg.league.status === "COMPLETED" ? "default" : "info"}>
                        {reg.league.status.replace(/_/g, " ")}
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
