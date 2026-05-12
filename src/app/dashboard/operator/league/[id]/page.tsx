export const dynamic = "force-dynamic";

import { requireRole } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, MapPin, Swords, UserPlus, Check, X, Trophy } from "lucide-react";
import { LeagueActions } from "./league-actions";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlayerLink, PlayerAvatar } from "@/components/player-link";

export default async function LeagueManagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireRole("TOURNAMENT_OPERATOR");
  const { id } = await params;

  const league = await db.league.findUnique({
    where: { id },
    include: {
      sport: true,
      divisions: {
        include: {
          teams: {
            include: {
              captain: { select: { id: true, name: true } },
              _count: { select: { players: true } },
            },
          },
          _count: { select: { ties: true } },
        },
        orderBy: { order: "asc" },
      },
      registrations: {
        include: {
          player: { select: { id: true, name: true, email: true, city: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!league) notFound();
  if (league.operatorId !== session.user.id && session.user.role !== "SUPER_ADMIN") notFound();

  const accepted = league.registrations.filter((r) => r.status === "APPROVED");
  const pending = league.registrations.filter((r) => r.status === "PENDING");
  const declined = league.registrations.filter((r) => r.status === "REJECTED");

  const statusColor = (s: string) => {
    switch (s) {
      case "IN_PROGRESS": return "success" as const;
      case "REGISTRATION_OPEN": return "info" as const;
      case "DRAFT": return "warning" as const;
      default: return "default" as const;
    }
  };

  return (
    <div className="px-4 py-5 pb-20 max-w-2xl mx-auto space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant={statusColor(league.status)}>{league.status.replace(/_/g, " ")}</Badge>
          <Badge variant={league.mode === "INDIVIDUAL" ? "info" : "default"}>{league.mode}</Badge>
          <Badge>{league.genderRestriction.replace(/_/g, " ")}</Badge>
        </div>
        <h1 className="text-2xl font-bold">{league.name}</h1>
        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
          <span>{league.sport.name}</span>
          {league.city && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> {league.city}, {league.state}
            </span>
          )}
          {league.currentRound > 0 && (
            <span>Round {league.currentRound}/{league.totalRounds}</span>
          )}
        </div>
      </div>

      <LeagueActions leagueId={league.id} currentStatus={league.status} />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Link href={`/dashboard/operator/league/${league.id}/registrations`}>
          <Button variant="outline" size="sm" className="w-full">
            <UserPlus className="w-4 h-4 mr-1.5" /> Registrations
          </Button>
        </Link>
        {league.mode === "TEAM" && (
          <Link href={`/dashboard/operator/league/${league.id}/teams`}>
            <Button variant="outline" size="sm" className="w-full">
              <Users className="w-4 h-4 mr-1.5" /> Teams
            </Button>
          </Link>
        )}
        <Link href={`/dashboard/operator/league/${league.id}/matches`}>
          <Button variant="outline" size="sm" className="w-full">
            <Swords className="w-4 h-4 mr-1.5" /> Matches
          </Button>
        </Link>
        <Link href={`/leagues/${league.slug}/standings`}>
          <Button variant="outline" size="sm" className="w-full">
            <Trophy className="w-4 h-4 mr-1.5" /> Leaderboard
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center py-3">
          <p className="text-2xl font-bold text-green-600">{accepted.length}</p>
          <p className="text-xs text-muted-foreground">Accepted</p>
        </Card>
        <Card className="text-center py-3">
          <p className="text-2xl font-bold text-yellow-600">{pending.length}</p>
          <p className="text-xs text-muted-foreground">Pending</p>
        </Card>
        <Card className="text-center py-3">
          <p className="text-2xl font-bold text-red-500">{declined.length}</p>
          <p className="text-xs text-muted-foreground">Declined</p>
        </Card>
      </div>

      {accepted.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Check className="w-5 h-5 text-green-600" /> Accepted ({accepted.length})
          </h2>
          <Card>
            <div className="space-y-2">
              {accepted.map((reg) => (
                <div key={reg.id} className="flex items-center justify-between py-2 px-3 bg-green-50 rounded-[8px]">
                  <div className="flex items-center gap-2">
                    <PlayerAvatar id={reg.player.id} name={reg.player.name} size="sm" className="!bg-green-600" />
                    <div>
                      <p className="text-sm font-medium"><PlayerLink id={reg.player.id} name={reg.player.name} /></p>
                      <p className="text-xs text-muted-foreground">{reg.player.email}</p>
                    </div>
                  </div>
                  <Badge variant="success">Accepted</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {declined.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <X className="w-5 h-5 text-red-500" /> Declined ({declined.length})
          </h2>
          <Card>
            <div className="space-y-2">
              {declined.map((reg) => (
                <div key={reg.id} className="flex items-center justify-between py-2 px-3 bg-red-50 rounded-[8px]">
                  <div>
                    <p className="text-sm font-medium"><PlayerLink id={reg.player.id} name={reg.player.name} /></p>
                    <p className="text-xs text-muted-foreground">{reg.player.email}</p>
                  </div>
                  <Badge variant="danger">Declined</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {league.mode === "TEAM" && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Divisions ({league.divisions.length})</h2>
          <div className="space-y-4">
            {league.divisions.map((div) => (
              <Card key={div.id}>
                <div className="flex items-center justify-between mb-3">
                  <CardTitle className="text-base">{div.name}</CardTitle>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {div.teams.length} teams</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {div._count.ties} ties</span>
                  </div>
                </div>
                {div.teams.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No teams yet</p>
                ) : (
                  <div className="space-y-2">
                    {div.teams.map((team) => (
                      <div key={team.id} className="flex items-center justify-between py-2 px-3 bg-muted rounded-[8px]">
                        <div>
                          <p className="text-sm font-medium">{team.name}</p>
                          <p className="text-xs text-muted-foreground">Captain: <PlayerLink id={team.captain.id} name={team.captain.name} /></p>
                        </div>
                        <span className="text-xs text-muted-foreground">{team._count.players} players</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {pending.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 text-yellow-600">Pending ({pending.length})</h2>
          <Card className="border-yellow-200">
            <div className="space-y-2">
              {pending.slice(0, 5).map((reg) => (
                <div key={reg.id} className="flex items-center justify-between py-2 px-3 bg-yellow-50 rounded-[8px]">
                  <div>
                    <p className="text-sm font-medium"><PlayerLink id={reg.player.id} name={reg.player.name} /></p>
                    <p className="text-xs text-muted-foreground">{reg.player.email}</p>
                  </div>
                  <Badge variant="warning">Pending</Badge>
                </div>
              ))}
              {pending.length > 5 && (
                <Link href={`/dashboard/operator/league/${league.id}/registrations`} className="block text-center text-sm text-brand font-medium hover:underline py-2">
                  View all {pending.length} pending
                </Link>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
