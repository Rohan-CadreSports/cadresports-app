export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft, Trophy } from "lucide-react";
import { ResultCard } from "./result-card";
import { StandingsTable } from "./standings-table";

export default async function StandingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const league = await db.league.findUnique({
    where: { slug },
    include: {
      sport: true,
      divisions: {
        include: {
          teams: { select: { id: true, name: true } },
          ties: {
            where: { status: { in: ["COMPLETED", "WALKOVER"] } },
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
            take: 20,
          },
        },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!league) notFound();

  const standings = await db.standing.findMany({
    where: { divisionId: { in: league.divisions.map((d) => d.id) } },
    include: { team: { select: { id: true, name: true } } },
    orderBy: [{ divisionId: "asc" }, { rank: "asc" }],
  });

  const standingsByDiv = new Map<string, typeof standings>();
  for (const s of standings) {
    const arr = standingsByDiv.get(s.divisionId) || [];
    arr.push(s);
    standingsByDiv.set(s.divisionId, arr);
  }

  return (
    <div className="pb-20">
      {/* Dark header */}
      <div className="bg-accent text-accent-foreground px-4 pt-5 pb-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <Link href={`/leagues/${slug}`} className="p-2 hover:bg-white/10 rounded-[8px] transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-medium tracking-tight">Leaderboard</h1>
              <p className="text-sm text-accent-foreground/60">{league.name}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 max-w-2xl mx-auto space-y-6 -mt-1">
        {league.divisions.map((div) => {
          const divStandings = standingsByDiv.get(div.id) || [];

          return (
            <div key={div.id} className="space-y-3">
              <h2 className="text-base font-medium flex items-center gap-2 pt-4">
                <Trophy className="w-4 h-4 text-brand" /> {div.name}
              </h2>

              {divStandings.length > 0 ? (
                <StandingsTable standings={divStandings} />
              ) : (
                <Card>
                  <p className="text-sm text-muted-foreground text-center py-4">No standings yet</p>
                </Card>
              )}

              {div.ties.length > 0 && (
                <div>
                  <p className="text-[11px] tracking-soho font-medium uppercase text-muted-foreground mb-3 mt-4">Results</p>
                  <div className="space-y-2">
                    {div.ties.map((tie) => (
                      <ResultCard key={tie.id} tie={tie} sportSlug={league.sport.slug} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
