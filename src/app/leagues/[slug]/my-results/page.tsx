export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ResultCard } from "../standings/result-card";
import { ArrowLeft, Trophy } from "lucide-react";

export default async function MyResultsPage({
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

  // Find which teams the user is in for this league
  const teamMemberships = await db.teamPlayer.findMany({
    where: {
      playerId: session.user.id,
      isActive: true,
      team: { division: { leagueId: league.id } },
    },
    select: { teamId: true, team: { select: { name: true } } },
  });

  const teamIds = teamMemberships.map((t) => t.teamId);
  const teamName = teamMemberships[0]?.team.name ?? "N/A";

  if (teamIds.length === 0) {
    return (
      <div className="px-4 py-5 pb-20 max-w-2xl mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <Link href={`/leagues/${slug}`} className="p-2 hover:bg-muted rounded-[8px]">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold">My Results</h1>
        </div>
        <Card>
          <p className="text-sm text-muted-foreground text-center py-8">
            You are not part of any team in this league.
          </p>
        </Card>
      </div>
    );
  }

  // Get all ties involving this player's teams
  const ties = await db.tie.findMany({
    where: {
      OR: [
        { homeTeamId: { in: teamIds } },
        { awayTeamId: { in: teamIds } },
      ],
      status: { in: ["COMPLETED", "WALKOVER"] },
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
    },
    orderBy: [{ round: "desc" }, { tieNumber: "asc" }],
  });

  let totalTies = 0;
  let tiesWon = 0;
  let tiesLost = 0;
  let totalPointsEarned = 0;

  for (const tie of ties) {
    totalTies++;
    const isHome = teamIds.includes(tie.homeTeamId);
    const myTeamId = isHome ? tie.homeTeamId : tie.awayTeamId;
    const myPoints = isHome ? tie.homePoints : tie.awayPoints;
    totalPointsEarned += myPoints;
    if (tie.winnerId === myTeamId) tiesWon++;
    else tiesLost++;
  }

  return (
    <div className="pb-20">
      {/* Dark header with stats — Strava-style */}
      <div className="bg-accent text-accent-foreground px-4 pt-5 pb-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-5">
            <Link href={`/leagues/${slug}`} className="p-2 hover:bg-white/10 rounded-[8px] transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-medium tracking-tight">My Results</h1>
              <p className="text-sm text-accent-foreground/60">{league.name} &middot; {teamName}</p>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-4 gap-3">
            <div className="text-center">
              <p className="text-2xl font-bold tabular-nums">{totalTies}</p>
              <p className="text-[10px] tracking-wide uppercase text-accent-foreground/50 mt-0.5">Played</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold tabular-nums text-brand-light">{tiesWon}</p>
              <p className="text-[10px] tracking-wide uppercase text-accent-foreground/50 mt-0.5">Won</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold tabular-nums text-red-400">{tiesLost}</p>
              <p className="text-[10px] tracking-wide uppercase text-accent-foreground/50 mt-0.5">Lost</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold tabular-nums text-brand-light">{totalPointsEarned}</p>
              <p className="text-[10px] tracking-wide uppercase text-accent-foreground/50 mt-0.5">Points</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 max-w-2xl mx-auto space-y-5 pt-4">
      {/* Match History */}
      <div>
        <p className="text-[11px] tracking-wide font-medium uppercase text-muted-foreground mb-3">Match History</p>
        {ties.length === 0 ? (
          <Card>
            <p className="text-sm text-muted-foreground text-center py-6">No completed matches yet</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {ties.map((tie) => (
              <ResultCard key={tie.id} tie={tie} sportSlug={league.sport.slug} />
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
