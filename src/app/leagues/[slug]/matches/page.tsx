export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowLeft, Calendar } from "lucide-react";

export default async function PublicMatchesPage({
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
          ties: {
            include: {
              homeTeam: { select: { id: true, name: true } },
              awayTeam: { select: { id: true, name: true } },
              winner: { select: { id: true, name: true } },
            },
            orderBy: [{ round: "asc" }, { tieNumber: "asc" }],
          },
        },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!league) notFound();

  const statusColor = (s: string) => {
    switch (s) {
      case "COMPLETED": return "success" as const;
      case "WALKOVER": return "warning" as const;
      case "SCHEDULED": return "info" as const;
      default: return "default" as const;
    }
  };

  return (
    <div className="px-4 py-5 pb-20 max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href={`/leagues/${slug}`} className="p-2 hover:bg-muted rounded-[8px]">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Match Schedule</h1>
          <p className="text-sm text-muted-foreground">
            {league.name}
            {league.currentRound > 0 && ` — Round ${league.currentRound}/${league.totalRounds}`}
          </p>
        </div>
      </div>

      {league.divisions.map((div) => (
        <div key={div.id} className="space-y-3">
          <h2 className="text-lg font-semibold">{div.name}</h2>

          {div.ties.length === 0 ? (
            <Card>
              <p className="text-sm text-muted-foreground text-center py-6">Schedule not yet available</p>
            </Card>
          ) : (
            Array.from(new Set(div.ties.map((t) => t.round)))
              .sort((a, b) => a - b)
              .map((round) => {
                const roundTies = div.ties.filter((t) => t.round === round);
                return (
                  <div key={round} className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" /> Round {round}
                    </h3>
                    {roundTies.map((tie) => (
                      <Card key={tie.id} className="p-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs text-muted-foreground">#{tie.tieNumber}</span>
                          <Badge variant={statusColor(tie.status)} className="text-xs">{tie.status}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-medium flex-1 ${tie.winnerId === tie.homeTeam.id ? "text-brand font-bold" : ""}`}>
                            {tie.homeTeam.name}
                          </span>
                          <span className="text-sm font-bold px-3 text-center min-w-[60px]">
                            {tie.status === "COMPLETED" || tie.status === "WALKOVER"
                              ? `${tie.homePoints}-${tie.awayPoints}`
                              : "vs"}
                          </span>
                          <span className={`text-sm font-medium flex-1 text-right ${tie.winnerId === tie.awayTeam.id ? "text-brand font-bold" : ""}`}>
                            {tie.awayTeam.name}
                          </span>
                        </div>
                        {tie.scheduledAt && (
                          <p className="text-xs text-muted-foreground mt-1.5">
                            {new Date(tie.scheduledAt).toLocaleDateString("en-IN", {
                              day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                            })}
                            {tie.venue && ` · ${tie.venue}`}
                          </p>
                        )}
                      </Card>
                    ))}
                  </div>
                );
              })
          )}
        </div>
      ))}
    </div>
  );
}
