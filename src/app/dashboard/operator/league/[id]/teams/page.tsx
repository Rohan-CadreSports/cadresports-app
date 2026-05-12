export const dynamic = "force-dynamic";

import { requireRole } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { Card, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft, Users, Crown } from "lucide-react";
import { AddTeamForm } from "./add-team-form";
import { PlayerActions, DeleteTeamButton, AssignPlayerButton } from "./team-player-actions";
import { PlayerLink, PlayerAvatar } from "@/components/player-link";

export default async function TeamsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireRole("TOURNAMENT_OPERATOR");
  const { id } = await params;

  const league = await db.league.findUnique({
    where: { id },
    include: {
      divisions: {
        include: {
          teams: {
            include: {
              captain: { select: { id: true, name: true } },
              players: {
                where: { isActive: true },
                include: { player: { select: { id: true, name: true } } },
              },
            },
          },
        },
        orderBy: { order: "asc" },
      },
      registrations: {
        where: { status: "APPROVED" },
        include: { player: { select: { id: true, name: true } } },
      },
    },
  });

  if (!league) notFound();
  if (league.operatorId !== session.user.id && session.user.role !== "SUPER_ADMIN") notFound();

  // All teams for move dropdown
  const allTeams = league.divisions.flatMap((d) =>
    d.teams.map((t) => ({ id: t.id, name: `${t.name} (${d.name})` }))
  );

  // Players already in some team
  const assignedPlayerIds = new Set(
    league.divisions.flatMap((d) => d.teams.flatMap((t) => t.players.map((p) => p.playerId)))
  );

  // Approved players not yet in any team
  const unassignedPlayers = league.registrations
    .filter((r) => !assignedPlayerIds.has(r.playerId))
    .map((r) => r.player);

  return (
    <div className="px-4 py-5 pb-20 max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href={`/dashboard/operator/league/${id}`} className="p-2 hover:bg-muted rounded-xl">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Team Management</h1>
          <p className="text-sm text-muted-foreground">{league.name}</p>
        </div>
      </div>

      {/* Unassigned Players */}
      {unassignedPlayers.length > 0 && (
        <Card className="bg-yellow-50 border-yellow-200">
          <p className="text-sm font-medium text-yellow-800 mb-2">
            {unassignedPlayers.length} approved player{unassignedPlayers.length !== 1 ? "s" : ""} not assigned to a team:
          </p>
          <div className="flex flex-wrap gap-2">
            {unassignedPlayers.map((p) => (
              <span key={p.id} className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-lg">
                <PlayerLink id={p.id} name={p.name} />
              </span>
            ))}
          </div>
        </Card>
      )}

      {league.divisions.map((div) => (
        <div key={div.id} className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{div.name}</h2>
            <span className="text-sm text-muted-foreground">{div.teams.length} / {league.maxTeamsPerDiv} teams</span>
          </div>

          {div.teams.map((team) => (
            <Card key={team.id}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <CardTitle className="text-base">{team.name}</CardTitle>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Crown className="w-3 h-3 text-yellow-500" /> Captain: <PlayerLink id={team.captain.id} name={team.captain.name} />
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Users className="w-3 h-3" /> {team.players.length}/{league.maxTeamSize}
                  </span>
                  <DeleteTeamButton teamId={team.id} teamName={team.name} />
                </div>
              </div>
              <div className="space-y-1">
                {team.players.map((tp) => (
                  <div key={tp.id} className="flex items-center gap-2 py-1.5 px-2 bg-muted rounded-lg">
                    <PlayerAvatar id={tp.player.id} name={tp.player.name} size="xs" />
                    <span className="text-sm"><PlayerLink id={tp.player.id} name={tp.player.name} /></span>
                    {tp.playerId === team.captainId && (
                      <Crown className="w-3 h-3 text-yellow-500 shrink-0" />
                    )}
                    <PlayerActions
                      playerId={tp.playerId}
                      playerName={tp.player.name}
                      teamId={team.id}
                      isCaptain={tp.playerId === team.captainId}
                      allTeams={allTeams}
                      leagueId={league.id}
                    />
                  </div>
                ))}
              </div>
              {/* Add player to this team */}
              <AssignPlayerButton teamId={team.id} unassignedPlayers={unassignedPlayers} />
            </Card>
          ))}

          {/* Create new team */}
          {div.teams.length < league.maxTeamsPerDiv && (
            <AddTeamForm
              divisionId={div.id}
              availablePlayers={unassignedPlayers}
            />
          )}
        </div>
      ))}
    </div>
  );
}
