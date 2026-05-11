export const dynamic = "force-dynamic";

import { requireRole } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { GenerateNextRoundButton } from "./generate-next-round-button";
import { MatchScoreEntry } from "./match-score-entry";
import { WalkoverButton } from "./walkover-button";

export default async function MatchesPage({
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
          teams: { select: { id: true, name: true } },
          ties: {
            include: {
              homeTeam: { select: { id: true, name: true } },
              awayTeam: { select: { id: true, name: true } },
              winner: { select: { id: true, name: true } },
              matches: {
                include: {
                  scores: { orderBy: { createdAt: "desc" }, take: 1 },
                },
                orderBy: { matchNumber: "asc" },
              },
              lineups: {
                include: {
                  entries: {
                    include: { player: { select: { id: true, name: true } } },
                  },
                },
              },
            },
            orderBy: [{ round: "asc" }, { tieNumber: "asc" }],
          },
        },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!league) notFound();
  if (league.operatorId !== session.user.id && session.user.role !== "SUPER_ADMIN") notFound();

  const statusColor = (s: string) => {
    switch (s) {
      case "COMPLETED": return "success" as const;
      case "WALKOVER": return "warning" as const;
      case "SCHEDULED": return "default" as const;
      default: return "danger" as const;
    }
  };

  return (
    <div className="px-4 py-5 pb-20 max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href={`/dashboard/operator/league/${id}`} className="p-2 hover:bg-muted rounded-xl">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Matches & Scores</h1>
          <p className="text-sm text-muted-foreground">
            {league.name} &middot; Round {league.currentRound}/{league.totalRounds || "?"}
          </p>
        </div>
      </div>

      {league.divisions.map((div) => {
        const allTiesComplete = div.ties.length > 0 && div.ties.every(
          (t) => t.status === "COMPLETED" || t.status === "WALKOVER"
        );
        const hasTeams = div.teams.length >= 2;
        const canGenerateNext = league.status === "IN_PROGRESS" && hasTeams && (div.ties.length === 0 || allTiesComplete);

        return (
          <div key={div.id} className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{div.name}</h2>
              {canGenerateNext && (
                <GenerateNextRoundButton leagueId={league.id} divisionId={div.id} />
              )}
            </div>

            {div.ties.length === 0 ? (
              <Card>
                <p className="text-sm text-muted-foreground text-center py-6">
                  {!hasTeams
                    ? "Need at least 2 teams to generate fixtures"
                    : league.status !== "IN_PROGRESS"
                    ? "League must be IN PROGRESS to generate rounds"
                    : "Click 'Generate Next Round' to create Round 1 fixtures"}
                </p>
              </Card>
            ) : (
              Array.from(new Set(div.ties.map((t) => t.round)))
                .sort((a, b) => a - b)
                .map((round) => {
                  const roundTies = div.ties.filter((t) => t.round === round);
                  return (
                    <div key={round} className="space-y-3">
                      <h3 className="text-sm font-medium text-muted-foreground">Round {round}</h3>
                      {roundTies.map((tie) => {
                        const homeLineup = tie.lineups.find((l) => l.teamId === tie.homeTeam.id);
                        const awayLineup = tie.lineups.find((l) => l.teamId === tie.awayTeam.id);
                        const lineupsReady = homeLineup?.submitted && awayLineup?.submitted;

                        return (
                          <Card key={tie.id} className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs text-muted-foreground">Tie #{tie.tieNumber}</span>
                              <Badge variant={statusColor(tie.status)}>{tie.status}</Badge>
                            </div>

                            <div className="flex items-center justify-between mb-3">
                              <span className={`text-sm font-medium ${tie.winnerId === tie.homeTeam.id ? "text-brand font-bold" : ""}`}>
                                {tie.homeTeam.name}
                              </span>
                              <div className="text-center px-3">
                                {tie.status === "COMPLETED" || tie.status === "WALKOVER" ? (
                                  <span className="text-sm font-bold">{tie.homePoints} - {tie.awayPoints}</span>
                                ) : (
                                  <span className="text-xs text-muted-foreground">vs</span>
                                )}
                              </div>
                              <span className={`text-sm font-medium ${tie.winnerId === tie.awayTeam.id ? "text-brand font-bold" : ""}`}>
                                {tie.awayTeam.name}
                              </span>
                            </div>

                            {!lineupsReady && tie.status === "SCHEDULED" && (
                              <p className="text-xs text-yellow-600 bg-yellow-50 px-3 py-2 rounded-lg mb-2">
                                Waiting for lineups: {!homeLineup?.submitted ? tie.homeTeam.name : ""} {!homeLineup?.submitted && !awayLineup?.submitted ? "& " : ""}{!awayLineup?.submitted ? tie.awayTeam.name : ""}
                              </p>
                            )}

                            {/* Sub-matches */}
                            {tie.status !== "WALKOVER" && tie.matches.length > 0 && (
                              <div className="space-y-1.5 mt-2 pt-2 border-t border-border">
                                {tie.matches.map((match) => (
                                  <div key={match.id} className="flex items-center justify-between py-1 px-2 bg-muted/50 rounded-lg text-xs">
                                    <span className="text-muted-foreground">
                                      {league.sport.slug === "football" ? "Match" : `${match.format === "SINGLES" ? "S" : "D"}${match.matchNumber}`}
                                    </span>
                                    {match.status === "COMPLETED" && match.scores[0] ? (
                                      <span className="font-medium">
                                        {formatScore(match.scores[0].scoreData, league.sport.slug)}
                                        {match.scores[0].editCount > 0 && (
                                          <span className="text-yellow-600 ml-1">(edited)</span>
                                        )}
                                      </span>
                                    ) : match.status === "SCHEDULED" && lineupsReady ? (
                                      <MatchScoreEntry
                                        matchId={match.id}
                                        sportSlug={league.sport.slug}
                                        matchLabel={league.sport.slug === "football" ? "Match Score" : `${match.format === "SINGLES" ? "Singles" : "Doubles"} ${match.matchNumber}`}
                                        teams={league.sport.slug === "football" ? [
                                          { id: tie.homeTeam.id, name: tie.homeTeam.name, players: tie.lineups.find(l => l.teamId === tie.homeTeam.id)?.entries.map(e => ({ id: e.player.id, name: e.player.name })) || [] },
                                          { id: tie.awayTeam.id, name: tie.awayTeam.name, players: tie.lineups.find(l => l.teamId === tie.awayTeam.id)?.entries.map(e => ({ id: e.player.id, name: e.player.name })) || [] },
                                        ] : undefined}
                                      />
                                    ) : (
                                      <span className="text-muted-foreground">
                                        {match.status === "WALKOVER" ? "W/O" : "Pending"}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            {tie.isWalkover && (
                              <p className="text-xs text-red-500 mt-2">Walkover</p>
                            )}

                            {/* Walkover button for scheduled ties */}
                            {tie.status === "SCHEDULED" && (
                              <WalkoverButton tieId={tie.id} homeTeam={tie.homeTeam} awayTeam={tie.awayTeam} />
                            )}
                          </Card>
                        );
                      })}
                    </div>
                  );
                })
            )}
          </div>
        );
      })}
    </div>
  );
}

function formatScore(scoreData: unknown, sportSlug: string): string {
  const data = scoreData as Record<string, unknown>;
  if (sportSlug === "badminton") {
    const bd = data as { sets?: { home: number; away: number }[] };
    if (bd.sets) return bd.sets.map((s) => `${s.home}-${s.away}`).join(", ");
  }
  if (sportSlug === "football") {
    const fb = data as { home?: number; away?: number };
    return `${fb.home ?? 0}-${fb.away ?? 0}`;
  }
  return "-";
}
