export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, Calendar, Trophy, Swords, ChevronRight } from "lucide-react";
import { RegisterButton } from "./register-button";
import { PlayerLink } from "@/components/player-link";

function formatShortDate(date: Date | null): string {
  if (!date) return "";
  const d = new Date(date);
  const day = d.getDate();
  const suffix = day === 1 || day === 21 || day === 31 ? "st" : day === 2 || day === 22 ? "nd" : day === 3 || day === 23 ? "rd" : "th";
  const month = d.toLocaleString("en-IN", { month: "short" });
  const year = `'${String(d.getFullYear()).slice(2)}`;
  return `${day}${suffix} ${month} ${year}`;
}

export default async function LeagueDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();

  const league = await db.league.findUnique({
    where: { slug },
    include: {
      sport: true,
      operator: { select: { name: true } },
      divisions: {
        include: {
          teams: {
            include: {
              captain: { select: { id: true, name: true } },
              _count: { select: { players: true } },
            },
          },
        },
        orderBy: { order: "asc" },
      },
      _count: { select: { registrations: true } },
    },
  });

  if (!league) notFound();

  let userRegistration = null;
  let alreadyInTeam = false;
  if (session?.user) {
    userRegistration = await db.playerRegistration.findUnique({
      where: { leagueId_playerId: { leagueId: league.id, playerId: session.user.id } },
    });
    const teamIds = league.divisions.flatMap((d) => d.teams.map((t) => t.id));
    if (teamIds.length > 0) {
      const membership = await db.teamPlayer.findFirst({
        where: { playerId: session.user.id, teamId: { in: teamIds } },
      });
      alreadyInTeam = !!membership;
    }
  }

  const totalTeams = league.divisions.reduce((sum, d) => sum + d.teams.length, 0);

  return (
    <div className="px-4 py-5 pb-20 max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <Badge
          variant={league.status === "REGISTRATION_OPEN" ? "info" : league.status === "IN_PROGRESS" ? "success" : "default"}
          className="mb-2"
        >
          {league.status === "REGISTRATION_OPEN" ? "Registration Open" : league.status.replace(/_/g, " ")}
        </Badge>
        <h1 className="text-xl font-bold tracking-tight">{league.name}</h1>
        <div className="flex flex-wrap items-center gap-2 mt-1.5 text-sm text-muted-foreground">
          <span>{league.sport.name}</span>
          {league.city && (
            <span className="flex items-center gap-1">
              · <MapPin className="w-3.5 h-3.5" /> {league.city}
            </span>
          )}
          {league.genderRestriction !== "OPEN" && (
            <Badge variant={league.genderRestriction === "WOMENS_ONLY" ? "danger" : "info"}>
              {league.genderRestriction === "WOMENS_ONLY" ? "Women's Only" : "Men's Only"}
            </Badge>
          )}
        </div>
        {(league.startDate || league.endDate) && (
          <p className="text-sm text-foreground mt-2 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-brand" />
            <span className="font-medium">
              {formatShortDate(league.startDate)}
              {league.endDate && <> — {formatShortDate(league.endDate)}</>}
            </span>
          </p>
        )}
        {league.description && (
          <p className="text-sm text-muted-foreground mt-2">{league.description}</p>
        )}
        <p className="text-xs text-muted-foreground mt-1.5">by {league.operator.name}</p>
      </div>

      {/* Register / deadline */}
      {league.status === "REGISTRATION_OPEN" && (() => {
        const deadlinePassed = league.registrationEnd && new Date() > new Date(league.registrationEnd);
        const isPlayer = !session?.user?.role || session.user.role === "PLAYER";

        if (deadlinePassed) {
          return (
            <div className="p-4 bg-red-50 border border-red-100 rounded-[10px] text-center">
              <p className="text-sm font-semibold text-red-700">Registration deadline has passed</p>
              <p className="text-xs text-red-600 mt-0.5">
                Deadline was {formatShortDate(league.registrationEnd)}
              </p>
            </div>
          );
        }

        if (isPlayer) {
          return (
            <RegisterButton
              leagueId={league.id}
              isLoggedIn={!!session}
              alreadyRegistered={!!userRegistration || alreadyInTeam}
              registrationStatus={alreadyInTeam ? "APPROVED" : userRegistration?.status}
            />
          );
        }
        return null;
      })()}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-surface border border-border-light rounded-[10px] p-3 text-center shadow-[var(--shadow-xs)]">
          <p className="text-2xl font-bold text-foreground">{league._count.registrations}</p>
          <p className="text-xs text-muted-foreground">Players</p>
        </div>
        <div className="bg-surface border border-border-light rounded-[10px] p-3 text-center shadow-[var(--shadow-xs)]">
          <p className="text-2xl font-bold text-foreground">{league.divisions.length}</p>
          <p className="text-xs text-muted-foreground">Divisions</p>
        </div>
        <div className="bg-surface border border-border-light rounded-[10px] p-3 text-center shadow-[var(--shadow-xs)]">
          <p className="text-2xl font-bold text-foreground">{totalTeams}</p>
          <p className="text-xs text-muted-foreground">Teams</p>
        </div>
      </div>

      {/* Quick Nav */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { href: `/leagues/${slug}/matches`, icon: Calendar, label: "Schedule" },
          { href: `/leagues/${slug}/standings`, icon: Trophy, label: "Leaderboard" },
          ...(session && alreadyInTeam ? [{ href: `/leagues/${slug}/my-matches`, icon: Swords, label: "My Matches" }] : []),
          ...(session ? [{ href: `/leagues/${slug}/my-results`, icon: Users, label: "My Results" }] : []),
        ].map((nav) => (
          <Link key={nav.href} href={nav.href}>
            <div className="bg-surface border border-border-light rounded-[10px] p-3 flex items-center gap-3 press-effect shadow-[var(--shadow-xs)]">
              <div className="w-9 h-9 bg-neutral-100 rounded-[8px] flex items-center justify-center shrink-0">
                <nav.icon className="w-4 h-4 text-brand" />
              </div>
              <span className="text-sm font-medium flex-1">{nav.label}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </Link>
        ))}
      </div>

      {/* Divisions & Teams */}
      {league.divisions.map((div) => (
        <div key={div.id}>
          <h2 className="text-base font-semibold mb-2">{div.name}</h2>
          <div className="space-y-1.5">
            {div.teams.map((team) => (
              <div key={team.id} className="flex items-center justify-between py-2.5 px-3 bg-surface border border-border-light rounded-[8px] shadow-[var(--shadow-xs)]">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{team.name}</p>
                  <p className="text-xs text-muted-foreground"><PlayerLink id={team.captain.id} name={team.captain.name} /></p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">{team._count.players}p</span>
              </div>
            ))}
            {div.teams.length === 0 && (
              <p className="text-sm text-muted-foreground py-3 text-center">No teams yet</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
