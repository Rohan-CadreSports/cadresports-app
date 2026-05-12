"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, Swords } from "lucide-react";
import Link from "next/link";

interface PlayedMatch {
  matchId: string;
  matchNumber: number;
  format: string;
  status: string;
  playerTeamId: string;
  winnerId: string | null;
  round: number;
  homeTeam: { id: string; name: string };
  awayTeam: { id: string; name: string };
  leagueName: string;
  leagueSlug: string;
  sportSlug: string;
  scoreData: unknown;
}

function formatScore(scoreData: unknown, sportSlug: string): string {
  if (!scoreData) return "-";
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

export function PlayedMatches({ matches, playerName }: { matches: PlayedMatch[]; playerName: string }) {
  const [open, setOpen] = useState(false);

  const completed = matches.filter((m) => m.status === "COMPLETED" || m.status === "WALKOVER");
  if (completed.length === 0) return null;

  const winsCount = completed.filter((m) => m.winnerId === m.playerTeamId).length;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between h-11 px-4 rounded-[10px] bg-brand text-white text-[14px] font-medium active:scale-[0.98] transition-all"
      >
        <span className="flex items-center gap-2">
          <Swords className="w-4 h-4" />
          View Played Matches ({completed.length})
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="mt-2 space-y-1.5 animate-in slide-in-from-top-2 duration-200">
          {/* Summary */}
          <div className="flex gap-3 px-1 py-2 text-[13px] text-muted-foreground">
            <span>{completed.length} played</span>
            <span className="text-brand font-medium">{winsCount} won</span>
            <span>{completed.length - winsCount} lost</span>
          </div>

          {completed.map((match) => {
            const isWin = match.winnerId === match.playerTeamId;
            const isHome = match.playerTeamId === match.homeTeam.id;
            const playerTeam = isHome ? match.homeTeam : match.awayTeam;
            const opponent = isHome ? match.awayTeam : match.homeTeam;

            return (
              <Link key={match.matchId} href={`/leagues/${match.leagueSlug}/standings`}>
                <div className={`rounded-[10px] border px-3.5 py-3 active:scale-[0.98] transition-transform ${
                  isWin ? "border-brand/20 bg-brand/5" : "border-border-light bg-surface"
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] text-muted-foreground">
                      {match.leagueName} · R{match.round}
                    </span>
                    <Badge variant={isWin ? "success" : "default"} className="text-[10px]">
                      {match.status === "WALKOVER" ? "W/O" : isWin ? "Won" : "Lost"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className={`text-[13px] truncate ${isWin ? "font-medium text-brand" : ""}`}>
                        {playerTeam.name}
                      </p>
                    </div>
                    <span className="text-sm font-bold tabular-nums px-3">
                      {formatScore(match.scoreData, match.sportSlug)}
                    </span>
                    <div className="flex-1 min-w-0 text-right">
                      <p className="text-[13px] text-muted-foreground truncate">{opponent.name}</p>
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {match.format === "SINGLES" ? "Singles" : "Doubles"} #{match.matchNumber}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
