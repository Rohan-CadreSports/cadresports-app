export const dynamic = "force-dynamic";

import { requireAuth } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowLeft, Calendar } from "lucide-react";

export default async function PlayerMatchesPage() {
  const session = await requireAuth();

  const teamMemberships = await db.teamPlayer.findMany({
    where: { playerId: session.user.id, isActive: true },
    select: { teamId: true },
  });

  const teamIds = teamMemberships.map((t) => t.teamId);

  if (teamIds.length === 0) {
    return (
      <div className="px-4 py-5 pb-20 max-w-2xl mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/player" className="p-2 hover:bg-muted rounded-xl">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold">My Matches</h1>
        </div>
        <Card>
          <p className="text-sm text-muted-foreground text-center py-8">
            You&apos;re not part of any team yet. Join a league to see your matches.
          </p>
        </Card>
      </div>
    );
  }

  // Find ties involving player's teams
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
      division: {
        include: {
          league: {
            select: { name: true, slug: true, sport: { select: { name: true, icon: true } } },
          },
        },
      },
    },
    orderBy: [{ scheduledAt: "asc" }, { round: "asc" }],
  });

  const upcoming = ties.filter((t) => t.status === "SCHEDULED");
  const completed = ties.filter((t) => t.status === "COMPLETED" || t.status === "WALKOVER");

  return (
    <div className="px-4 py-5 pb-20 max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/player" className="p-2 hover:bg-muted rounded-xl">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold">My Matches</h1>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Upcoming ({upcoming.length})</h2>
        {upcoming.length === 0 ? (
          <Card>
            <p className="text-sm text-muted-foreground text-center py-4">No upcoming matches</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {upcoming.map((tie) => {
              const isHome = teamIds.includes(tie.homeTeamId);
              const myTeam = isHome ? tie.homeTeam.name : tie.awayTeam.name;
              const opponent = isHome ? tie.awayTeam.name : tie.homeTeam.name;

              return (
                <Card key={tie.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">
                      {tie.division.league.name} &middot; R{tie.round}
                    </span>
                    <Badge>Scheduled</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-brand">{myTeam}</span>
                    <span className="text-xs text-muted-foreground">vs</span>
                    <span className="text-sm font-medium">{opponent}</span>
                  </div>
                  {tie.scheduledAt && (
                    <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(tie.scheduledAt).toLocaleDateString("en-IN", {
                        weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {completed.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Past Results ({completed.length})</h2>
          <div className="space-y-2">
            {completed.map((tie) => {
              const isHome = teamIds.includes(tie.homeTeamId);
              const myTeamId = isHome ? tie.homeTeamId : tie.awayTeamId;
              const myTeam = isHome ? tie.homeTeam.name : tie.awayTeam.name;
              const opponent = isHome ? tie.awayTeam.name : tie.homeTeam.name;
              const won = tie.winnerId === myTeamId;
              const myPoints = isHome ? tie.homePoints : tie.awayPoints;
              const oppPoints = isHome ? tie.awayPoints : tie.homePoints;

              return (
                <Card key={tie.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">
                      {tie.division.league.name} &middot; R{tie.round}
                    </span>
                    <Badge variant={won ? "success" : "danger"}>{won ? "WON" : "LOST"}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${won ? "text-brand font-bold" : ""}`}>{myTeam}</span>
                    <span className="text-sm font-bold">{myPoints} - {oppPoints}</span>
                    <span className="text-sm font-medium">{opponent}</span>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
