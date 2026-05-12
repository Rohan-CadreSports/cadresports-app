export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowLeft, Calendar, Crown } from "lucide-react";
import { LineupButton } from "./lineup-button";
import { ResultCard } from "../standings/result-card";

export default async function MyMatchesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  const { slug } = await params;

  const league = await db.league.findUnique({
    where: { slug },
    include: { sport: true },
  });
  if (!league) notFound();

  // Find user's teams in THIS league only
  const teamMemberships = await db.teamPlayer.findMany({
    where: {
      playerId: session.user.id,
      isActive: true,
      team: { division: { leagueId: league.id } },
    },
    include: {
      team: {
        select: {
          id: true,
          name: true,
          captainId: true,
          divisionId: true,
          players: {
            where: { isActive: true },
            include: { player: { select: { id: true, name: true } } },
          },
        },
      },
    },
  });

  const teamIds = teamMemberships.map((t) => t.teamId);
  const isCaptainOfAny = teamMemberships.some((t) => t.team.captainId === session.user.id);

  // Build a map: teamId -> roster (only that team's players)
  const teamRosterMap = new Map<string, { id: string; name: string }[]>();
  const teamCaptainMap = new Map<string, boolean>();
  for (const tm of teamMemberships) {
    teamRosterMap.set(tm.teamId, tm.team.players.map((p) => p.player));
    teamCaptainMap.set(tm.teamId, tm.team.captainId === session.user.id);
  }

  const displayTeamName = teamMemberships.length === 1 ? teamMemberships[0].team.name : null;

  if (teamIds.length === 0) {
    return (
      <div className="px-4 py-5 pb-20 max-w-2xl mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <Link href={`/leagues/${slug}`} className="p-2 hover:bg-muted rounded-[8px]">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold">My Matches</h1>
        </div>
        <Card>
          <p className="text-sm text-muted-foreground text-center py-8">
            You are not part of any team in this league.
          </p>
        </Card>
      </div>
    );
  }

  // Get ties involving user's teams
  const ties = await db.tie.findMany({
    where: {
      OR: [
        { homeTeamId: { in: teamIds } },
        { awayTeamId: { in: teamIds } },
      ],
    },
    include: {
      homeTeam: { select: { id: true, name: true } },
      awayTeam: { select: { id: true, name: true } },
      winner: { select: { id: true, name: true } },
      matches: {
        orderBy: { matchNumber: "asc" },
        include: {
          scores: { orderBy: { createdAt: "desc" }, take: 1 },
          lineup: {
            include: {
              player: { select: { id: true, name: true } },
              lineup: { select: { teamId: true } },
            },
          },
        },
      },
      lineups: {
        select: { teamId: true, submitted: true },
      },
    },
    orderBy: [{ round: "asc" }, { tieNumber: "asc" }],
  });

  const upcoming = ties.filter((t) => t.status === "SCHEDULED");
  const completed = ties.filter((t) => t.status === "COMPLETED" || t.status === "WALKOVER");

  return (
    <div className="px-4 py-5 pb-20 max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href={`/leagues/${slug}`} className="p-2 hover:bg-muted rounded-[8px]">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">My Matches</h1>
          <p className="text-sm text-muted-foreground">
            {league.name}
            {displayTeamName && ` · ${displayTeamName}`}
            {isCaptainOfAny && (
              <span className="text-yellow-600 ml-1 inline-flex items-center gap-0.5">
                <Crown className="w-3 h-3" /> Captain
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Upcoming */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Upcoming ({upcoming.length})</h2>
        {upcoming.length === 0 ? (
          <Card>
            <p className="text-sm text-muted-foreground text-center py-4">No upcoming matches</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {upcoming.map((tie) => {
              const isHome = teamIds.includes(tie.homeTeamId);
              const myTeamId = isHome ? tie.homeTeamId : tie.awayTeamId;
              const myTeamName = isHome ? tie.homeTeam.name : tie.awayTeam.name;
              const opponent = isHome ? tie.awayTeam.name : tie.homeTeam.name;
              const myLineup = tie.lineups.find((l) => l.teamId === myTeamId);
              const lineupSubmitted = myLineup?.submitted ?? false;
              const isCaptainOfThisTeam = teamCaptainMap.get(myTeamId) ?? false;
              const thisTeamRoster = teamRosterMap.get(myTeamId) ?? [];

              return (
                <Card key={tie.id}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">
                      Round {tie.round} · Tie #{tie.tieNumber}
                    </span>
                    <Badge variant={lineupSubmitted ? "success" : "warning"}>
                      {lineupSubmitted ? "Lineup Ready" : "Lineup Pending"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-brand">{myTeamName}</span>
                    <span className="text-xs text-muted-foreground">vs</span>
                    <span className="text-sm font-medium">{opponent}</span>
                  </div>
                  {league.sport.slug !== "football" && (
                    <p className="text-xs text-muted-foreground mb-2">
                      {tie.matches.length} match{tie.matches.length !== 1 ? "es" : ""}:{" "}
                      {tie.matches.filter((m) => m.format === "SINGLES").length}S +{" "}
                      {tie.matches.filter((m) => m.format === "DOUBLES").length}D
                    </p>
                  )}
                  {tie.scheduledAt && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                      <Calendar className="w-3 h-3" />
                      {new Date(tie.scheduledAt).toLocaleDateString("en-IN", {
                        weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                  )}

                  {/* Lineup submission — only for captain of THIS specific team */}
                  {isCaptainOfThisTeam && !lineupSubmitted && (
                    <LineupButton
                      tieId={tie.id}
                      teamId={myTeamId}
                      matches={tie.matches}
                      roster={thisTeamRoster}
                      sportSlug={league.sport.slug}
                      matchConfig={league.matchConfig as Record<string, number>}
                    />
                  )}
                  {isCaptainOfThisTeam && lineupSubmitted && (
                    <p className="text-xs text-green-600 font-medium mt-1">Lineup submitted</p>
                  )}
                  {!isCaptainOfThisTeam && !lineupSubmitted && (
                    <p className="text-xs text-yellow-600 mt-1">Waiting for captain to submit lineup</p>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Completed — expandable with match details */}
      {completed.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Completed (tap to expand)</h2>
          <div className="space-y-2">
            {completed.map((tie) => (
              <ResultCard key={tie.id} tie={tie} sportSlug={league.sport.slug} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
