export const dynamic = "force-dynamic";

import { requireRole } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Trophy, Zap, Plus, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlayerLink, PlayerAvatar } from "@/components/player-link";

export default async function AdminDashboard() {
  const session = await requireRole("SUPER_ADMIN");

  const [userCount, leagueCount, activeLeagues, recentUsers, leagues] =
    await Promise.all([
      db.user.count(),
      db.league.count(),
      db.league.count({ where: { status: "IN_PROGRESS" } }),
      db.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, name: true, email: true, role: true },
      }),
      db.league.findMany({
        include: {
          sport: { select: { name: true } },
          operator: { select: { name: true } },
          _count: { select: { registrations: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

  const regCounts = leagues.length > 0
    ? await db.playerRegistration.groupBy({
        by: ["leagueId", "status"],
        where: { leagueId: { in: leagues.map((l) => l.id) } },
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
        <h1 className="text-xl font-bold tracking-tight">Admin</h1>
        <p className="text-sm text-muted-foreground">Hi, {session.user.name?.split(" ")[0]}</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-2">
        <Link href="/dashboard/admin/create-league">
          <div className="bg-brand text-white rounded-[10px] p-4 text-center press-effect shadow-[var(--shadow-sm)]">
            <Plus className="w-6 h-6 mx-auto mb-1" />
            <p className="text-xs font-semibold">New League</p>
          </div>
        </Link>
        <Link href="/dashboard/admin/create-operator">
          <div className="bg-surface border border-border-light rounded-[10px] p-4 text-center press-effect shadow-[var(--shadow-xs)]">
            <Users className="w-6 h-6 mx-auto mb-1 text-brand" />
            <p className="text-xs font-semibold">New TO</p>
          </div>
        </Link>
        <Link href="/dashboard/admin/create-federation">
          <div className="bg-surface border border-border-light rounded-[10px] p-4 text-center press-effect shadow-[var(--shadow-xs)]">
            <Trophy className="w-6 h-6 mx-auto mb-1 text-brand" />
            <p className="text-xs font-semibold">Federation</p>
          </div>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Users", value: userCount, color: "text-blue-600" },
          { label: "Leagues", value: leagueCount, color: "text-brand" },
          { label: "Live", value: activeLeagues, color: "text-emerald-600" },
        ].map((stat) => (
          <div key={stat.label} className="bg-surface border border-border-light rounded-[10px] p-3 text-center shadow-[var(--shadow-xs)]">
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Leagues */}
      <div>
        <h2 className="text-base font-semibold mb-3">Leagues</h2>
        {leagues.length === 0 ? (
          <Card className="text-center py-10">
            <p className="text-muted-foreground mb-3">No leagues yet</p>
            <Link href="/dashboard/admin/create-league">
              <Button>Create First League</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-2">
            {leagues.map((league) => {
              const counts = regCountMap.get(league.id) ?? { approved: 0, pending: 0 };
              const isLive = league.status === "IN_PROGRESS";
              const isOpen = league.status === "REGISTRATION_OPEN";

              return (
                <Link key={league.id} href={`/dashboard/operator/league/${league.id}`}>
                  <div className={`relative rounded-[10px] border overflow-hidden press-effect mb-2 ${
                    isLive
                      ? "border-border bg-surface"
                      : "border-border-light bg-surface"
                  } shadow-[var(--shadow-xs)]`}>
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${isLive ? "bg-brand" : isOpen ? "bg-blue-500" : "bg-muted-foreground/30"}`} />
                    <div className="p-4 pl-5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-[15px] truncate">{league.name}</p>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {league.sport.name} &middot; {league.operator.name}
                          </p>
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

      {/* Recent Users */}
      <div>
        <h2 className="text-base font-semibold mb-3">Recent Users</h2>
        <div className="space-y-1.5">
          {recentUsers.map((user) => (
            <div key={user.id} className="flex items-center justify-between py-2.5 px-3 bg-surface border border-border-light rounded-[8px]">
              <div className="flex items-center gap-2.5 min-w-0">
                <PlayerAvatar id={user.id} name={user.name} size="sm" className="!bg-brand/10 !text-brand" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate"><PlayerLink id={user.id} name={user.name} /></p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
              </div>
              <Badge className="shrink-0 ml-2">{user.role.replace(/_/g, " ")}</Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
