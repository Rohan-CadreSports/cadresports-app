"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ChevronDown } from "lucide-react";

interface MatchLineup {
  player: { name: string };
  lineup: { teamId: string };
}

interface MatchScore {
  scoreData: unknown;
}

interface Match {
  id: string;
  matchNumber: number;
  format: string;
  status: string;
  winnerId: string | null;
  scores: MatchScore[];
  lineup: MatchLineup[];
}

interface TieResult {
  id: string;
  round: number;
  tieNumber: number;
  status: string;
  homePoints: number;
  awayPoints: number;
  homeTeam: { id: string; name: string };
  awayTeam: { id: string; name: string };
  winner: { id: string; name: string } | null;
  matches: Match[];
}

function formatScore(scoreData: unknown, sportSlug: string): string {
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

export function ResultCard({ tie, sportSlug }: { tie: TieResult; sportSlug: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
        open ? "border-border shadow-[var(--shadow-md)]" : "border-border-light bg-surface shadow-[var(--shadow-xs)] hover:shadow-[var(--shadow-sm)]"
      }`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-3 sm:p-4 flex items-center justify-between text-left press-effect"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs text-muted-foreground">Round {tie.round}</span>
            <Badge variant="success">
              {tie.status === "WALKOVER" ? "W/O" : "Completed"}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className={`text-sm font-semibold flex-1 ${tie.winner?.id === tie.homeTeam.id ? "text-brand" : ""}`}>
              {tie.homeTeam.name}
            </span>
            <span className="text-base font-bold px-4 tabular-nums">
              {tie.homePoints} - {tie.awayPoints}
            </span>
            <span className={`text-sm font-semibold flex-1 text-right ${tie.winner?.id === tie.awayTeam.id ? "text-brand" : ""}`}>
              {tie.awayTeam.name}
            </span>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground ml-3 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && tie.matches.length > 0 && (
        <div className="border-t border-border-light bg-muted/30 px-4 py-3 space-y-2">
          {tie.matches.map((match) => {
            const score = match.scores[0];
            const isWonByHome = match.winnerId === tie.homeTeam.id;
            const isWonByAway = match.winnerId === tie.awayTeam.id;

            // Group players by team
            const homePlayers = match.lineup
              .filter((l) => l.lineup.teamId === tie.homeTeam.id)
              .map((l) => l.player.name);
            const awayPlayers = match.lineup
              .filter((l) => l.lineup.teamId === tie.awayTeam.id)
              .map((l) => l.player.name);

            return (
              <div key={match.id} className="bg-surface rounded-xl p-3">
                {/* Match type label */}
                <div className="flex items-center justify-center mb-2">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                    match.format === "DOUBLES" ? "bg-blue-50 text-blue-700" : "bg-muted text-muted-foreground"
                  }`}>
                    {match.format === "SINGLES" ? "Singles" : "Doubles"} {match.matchNumber}
                  </span>
                </div>

                {/* Players + score in center (same layout as tie header) */}
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium mb-0.5 ${isWonByHome ? "text-brand" : "text-muted-foreground"}`}>
                      {tie.homeTeam.name}
                    </p>
                    {homePlayers.map((name, i) => (
                      <p key={i} className={`text-sm ${isWonByHome ? "font-semibold" : ""}`}>{name}</p>
                    ))}
                  </div>
                  <div className="text-center px-3 shrink-0">
                    {score ? (
                      <span className="text-sm font-bold tabular-nums">
                        {formatScore(score.scoreData, sportSlug)}
                      </span>
                    ) : match.status === "WALKOVER" ? (
                      <span className="text-xs text-red-500 font-semibold">W/O</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">vs</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-right">
                    <p className={`text-xs font-medium mb-0.5 ${isWonByAway ? "text-brand" : "text-muted-foreground"}`}>
                      {tie.awayTeam.name}
                    </p>
                    {awayPlayers.map((name, i) => (
                      <p key={i} className={`text-sm ${isWonByAway ? "font-semibold" : ""}`}>{name}</p>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
