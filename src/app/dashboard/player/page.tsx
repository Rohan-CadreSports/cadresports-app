export const dynamic = "force-dynamic";

import { requireAuth } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Trophy, MapPin, Calendar, ChevronRight, Swords } from "lucide-react";

function formatShortDate(date: Date | null): string {
  if (!date) return "";
  const d = new Date(date);
  const day = d.getDate();
  const suffix = day === 1 || day === 21 || day === 31 ? "st" : day === 2 || day === 22 ? "nd" : day === 3 || day === 23 ? "rd" : "th";
  const month = d.toLocaleString("en-IN", { month: "short" });
  return `${day}${suffix} ${month}`;
}

export default async function PlayerDashboard() {
  const session = await requireAuth();

  if (!session.user.id) {
    const { redirect } = await import("next/navigation");
    redirect("/auth/signin");
  }

  const userId = session.user.id;

  // First get team IDs, then use them for all queries
  const myTeamPlayers = await db.teamPlayer.findMany({
    where: { playerId: userId, isActive: true },
    select: { teamId: true },
  });
  const myTeamIds = myTeamPlayers.map((t) => t.teamId);

  const [teamMemberships, upcomingTies, registrations] = await Promise.all([
    db.teamPlayer.findMany({
      where: { playerId: userId, isActive: true },
      include: {
        team: {
          include: {
            captain: { select: { id: true, name: true } },
            _count: { select: { players: true } },
            division: {
              include: {
                league: {
                  select: { name: true, slug: true, city: true, status: true, sport: { select: { name: true } } },
                },
              },
            },
          },
        },
      },
    }),
    myTeamIds.length > 0 ? db.tie.findMany({
      where: {
        status: "SCHEDULED",
        OR: [
          { homeTeamId: { in: myTeamIds } },
          { awayTeamId: { in: myTeamIds } },
        ],
      },
      include: {
        homeTeam: { select: { id: true, name: true } },
        awayTeam: { select: { id: true, name: true } },
        division: { include: { league: { select: { name: true, slug: true } } } },
      },
      orderBy: [{ round: "asc" }, { tieNumber: "asc" }],
      take: 5,
    }) : Promise.resolve([]),
    db.playerRegistration.findMany({
      where: { playerId: userId, status: "PENDING" },
      include: { league: { select: { name: true, slug: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const teamIds = myTeamIds;
  const isCaptain = teamMemberships.some(t => t.team.captain.id === userId);

  const leagueMap = new Map<string, { leagueName: string; slug: string; city: string | null; sport: string; status: string; teams: typeof teamMemberships }>();
  for (const tm of teamMemberships) {
    const league = tm.team.division.league;
    const existing = leagueMap.get(league.slug) ?? { leagueName: league.name, slug: league.slug, city: league.city, sport: league.sport.name, status: league.status, teams: [] };
    existing.teams.push(tm);
    leagueMap.set(league.slug, existing);
  }

  return (
    <div className="px-4 py-5 pb-20 max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight">Hi, {session.user.name?.split(" ")[0]}</h1>
        <p className="text-sm text-muted-foreground">
          {isCaptain ? "Captain" : "Player"} · {teamMemberships.length} team{teamMemberships.length !== 1 ? "s" : ""} · {leagueMap.size} league{leagueMap.size !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Pending registrations */}
      {registrations.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="text-sm font-semibold text-amber-800 mb-2">Pending Registrations</p>
          {registrations.map((reg) => (
            <Link key={reg.id} href={`/leagues/${reg.league.slug}`} className="flex items-center justify-between py-1.5">
              <span className="text-sm text-amber-700">{reg.league.name}</span>
              <Badge variant="warning">Pending</Badge>
            </Link>
          ))}
        </div>
      )}

      {/* Upcoming Matches */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Swords className="w-4 h-4 text-brand" /> Upcoming Matches
          </h2>
          {upcomingTies.length > 0 && (
            <Link href="/dashboard/player/matches" className="inline-action text-sm text-brand font-semibold">
              View all
            </Link>
          )}
        </div>

        {upcomingTies.length === 0 ? (
          <div className="bg-surface border border-border-light rounded-2xl p-6 text-center shadow-[var(--shadow-xs)]">
            <p className="text-sm text-muted-foreground">No upcoming matches</p>
          </div>
        ) : (
          <div className="space-y-2">
            {upcomingTies.map((tie) => {
              const isHome = teamIds.includes(tie.homeTeamId);
              const myTeam = isHome ? tie.homeTeam.name : tie.awayTeam.name;
              const opponent = isHome ? tie.awayTeam.name : tie.homeTeam.name;

              return (
                <Link key={tie.id} href={`/leagues/${tie.division.league.slug}/my-matches`}>
                  <div className="relative rounded-2xl border border-border-light bg-surface p-4 pl-5 press-effect mb-2 shadow-[var(--shadow-xs)]">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand rounded-l-2xl" />
                    <p className="text-xs text-muted-foreground">{tie.division.league.name} · Round {tie.round}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-sm font-semibold">{myTeam}</span>
                      <span className="text-xs text-muted-foreground">vs</span>
                      <span className="text-sm font-semibold">{opponent}</span>
                    </div>
                    {tie.scheduledAt && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {formatShortDate(tie.scheduledAt)}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* My Leagues */}
      <div>
        <h2 className="text-base font-semibold flex items-center gap-2 mb-3">
          <Trophy className="w-4 h-4 text-brand" /> My Leagues
        </h2>

        {leagueMap.size === 0 ? (
          <div className="bg-surface border border-border-light rounded-2xl p-8 text-center shadow-[var(--shadow-xs)]">
            <p className="text-muted-foreground">No leagues joined yet</p>
            <Link href="/leagues" className="text-brand text-sm font-semibold mt-2 block">
              Browse leagues
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {Array.from(leagueMap.entries()).map(([slug, league]) => {
              const isLive = league.status === "IN_PROGRESS";

              return (
                <Link key={slug} href={`/leagues/${slug}`}>
                  <div className={`relative rounded-2xl border overflow-hidden press-effect mb-2 shadow-[var(--shadow-xs)] ${
                    isLive ? "border-border bg-surface" : "border-border-light bg-surface"
                  }`}>
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${isLive ? "bg-brand" : "bg-blue-500"}`} />
                    <div className="p-4 pl-5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-[15px] truncate">{league.leagueName}</p>
                          <p className="text-sm text-muted-foreground">{league.sport}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Badge variant={isLive ? "success" : "info"}>
                            {isLive ? "Live" : league.status.replace(/_/g, " ")}
                          </Badge>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </div>

                      {league.city && (
                        <p className="text-sm text-muted-foreground mt-1.5 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" /> {league.city}
                        </p>
                      )}

                      {league.teams.map((tm) => (
                        <div key={tm.id} className="flex items-center justify-between mt-2 py-1.5 px-3 bg-muted/50 rounded-xl">
                          <span className="text-sm font-medium">{tm.team.name}</span>
                          <div className="flex items-center gap-2">
                            {tm.team.captain.id === userId && (
                              <Badge variant="warning">Captain</Badge>
                            )}
                            <span className="text-xs text-muted-foreground">{tm.team._count.players}p</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
