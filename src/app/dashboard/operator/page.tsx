export const dynamic = "force-dynamic";

import { requireRole } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Trophy, ChevronRight } from "lucide-react";

export default async function OperatorDashboard() {
  const session = await requireRole("TOURNAMENT_OPERATOR");

  const leagues = await db.league.findMany({
    where: { operatorId: session.user.id },
    include: {
      sport: { select: { name: true } },
      _count: { select: { registrations: true, divisions: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const leagueIds = leagues.map((l) => l.id);
  const regCounts = leagueIds.length > 0
    ? await db.playerRegistration.groupBy({
        by: ["leagueId", "status"],
        where: { leagueId: { in: leagueIds } },
        _count: true,
      })
    : [];

  const regCountMap = new Map<string, { approved: number; pending: number }>();
  for (const r of regCounts) {
    const entry = regCountMap.get(r.leagueId) ?? { approved: 0, pending: 0 };
    if (r.status === "APPROVED") entry.approved = r._count;
    else if (r.status === "PENDING") entry.pending = r._count;
    regCountMap.set(r.leagueId, entry);
  }

  return (
    <div className="px-4 py-5 pb-20 max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight">My Leagues</h1>
        <p className="text-sm text-muted-foreground">{leagues.length} assigned league{leagues.length !== 1 ? "s" : ""}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Assigned", value: leagues.length, color: "text-brand" },
          { label: "Live", value: leagues.filter((l) => l.status === "IN_PROGRESS").length, color: "text-emerald-600" },
          { label: "Players", value: leagues.reduce((sum, l) => sum + l._count.registrations, 0), color: "text-blue-600" },
        ].map((stat) => (
          <div key={stat.label} className="bg-surface border border-border-light rounded-2xl p-3 text-center shadow-[var(--shadow-xs)]">
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* League list */}
      {leagues.length === 0 ? (
        <div className="bg-surface border border-border-light rounded-2xl p-8 text-center shadow-[var(--shadow-xs)]">
          <Trophy className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">No leagues assigned yet</p>
          <p className="text-sm text-muted-foreground mt-1">The admin will assign leagues to you</p>
        </div>
      ) : (
        <div className="space-y-2">
          {leagues.map((league) => {
            const counts = regCountMap.get(league.id) ?? { approved: 0, pending: 0 };
            const isLive = league.status === "IN_PROGRESS";
            const isOpen = league.status === "REGISTRATION_OPEN";

            return (
              <Link key={league.id} href={`/dashboard/operator/league/${league.id}`}>
                <div className={`relative rounded-2xl border overflow-hidden press-effect mb-2 ${
                  isLive
                    ? "border-border bg-surface"
                    : "border-border-light bg-surface"
                } shadow-[var(--shadow-xs)]`}>
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${isLive ? "bg-brand" : isOpen ? "bg-blue-500" : "bg-muted-foreground/30"}`} />
                  <div className="p-4 pl-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-[15px] truncate">{league.name}</p>
                        <p className="text-sm text-muted-foreground mt-0.5">{league.sport.name}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Badge variant={isLive ? "success" : isOpen ? "info" : league.status === "DRAFT" ? "warning" : "default"}>
                          {isLive ? "Live" : isOpen ? "Open" : league.status === "DRAFT" ? "Draft" : league.status.replace(/_/g, " ")}
                        </Badge>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                    {(counts.approved > 0 || counts.pending > 0) && (
                      <div className="flex items-center gap-3 mt-2 text-xs">
                        <span className="text-emerald-600 font-medium">{counts.approved} approved</span>
                        {counts.pending > 0 && <span className="text-amber-600 font-medium">{counts.pending} pending</span>}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
