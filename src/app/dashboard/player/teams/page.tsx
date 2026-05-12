export const dynamic = "force-dynamic";

import { requireAuth } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowLeft, Users, Trophy } from "lucide-react";
import { PlayerLink, PlayerAvatar } from "@/components/player-link";

export default async function PlayerTeamsPage() {
  const session = await requireAuth();

  const teamMemberships = await db.teamPlayer.findMany({
    where: { playerId: session.user.id, isActive: true },
    include: {
      team: {
        include: {
          captain: { select: { id: true, name: true } },
          players: {
            include: {
              player: { select: { id: true, name: true, image: true } },
            },
          },
          division: {
            include: {
              league: {
                select: {
                  name: true,
                  slug: true,
                  status: true,
                  sport: { select: { name: true, icon: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  // Captaincy is per-team — check if user is captain of any team
  const isCaptain = teamMemberships.some((tm) => tm.team.captainId === session.user.id);

  return (
    <div className="px-4 py-5 pb-20 max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/player" className="p-2 hover:bg-muted rounded-xl">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold">My Teams</h1>
      </div>

      {teamMemberships.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Not part of any team yet</p>
            <Link href="/leagues" className="text-brand text-sm font-medium hover:underline mt-2 block">
              Browse leagues to join
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {teamMemberships.map((tm) => (
            <Card key={tm.id}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <CardTitle className="text-base">{tm.team.name}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {tm.team.division.league.name} · {tm.team.division.name}
                  </p>
                </div>
                {tm.team.captainId === session.user.id && (
                  <Badge variant="info">Captain</Badge>
                )}
              </div>

              <div className="space-y-1.5">
                {tm.team.players.map((tp) => (
                  <div key={tp.id} className="flex items-center gap-2 py-1.5 px-2 bg-muted rounded-lg">
                    <PlayerAvatar id={tp.player.id} name={tp.player.name} size="xs" />
                    <span className="text-sm"><PlayerLink id={tp.player.id} name={tp.player.name} /></span>
                    {tp.playerId === tm.team.captainId && (
                      <span className="text-xs bg-brand/10 text-brand px-1.5 py-0.5 rounded font-medium ml-auto">
                        Captain
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-3 pt-3 border-t border-border flex gap-2">
                <Link
                  href={`/leagues/${tm.team.division.league.slug}/matches`}
                  className="text-xs text-brand font-medium hover:underline"
                >
                  View Matches
                </Link>
                <Link
                  href={`/leagues/${tm.team.division.league.slug}/standings`}
                  className="text-xs text-brand font-medium hover:underline"
                >
                  Leaderboard
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
