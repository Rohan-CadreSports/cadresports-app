"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { PlayerLink } from "@/components/player-link";

interface MatchLineup {
  player: { id: string; name: string };
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
    const fb = data as { home?: number; away?: number; extraTime?: boolean; homeET?: number; awayET?: number };
    let score = `${fb.home ?? 0}-${fb.away ?? 0}`;
    if (fb.extraTime && (fb.homeET || fb.awayET)) {
      score += ` (ET: ${fb.homeET ?? 0}-${fb.awayET ?? 0})`;
    }
    return score;
  }
  return "-";
}

export function ResultCard({ tie, sportSlug }: { tie: TieResult; sportSlug: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`rounded-[10px] overflow-hidden transition-all duration-200 ${
      open ? "bg-accent text-accent-foreground" : "bg-accent/90 text-accent-foreground"
    }`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-4 flex items-center justify-between text-left active:scale-[0.99] transition-transform"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] uppercase tracking-wider text-accent-foreground/50 font-medium">Round {tie.round}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand/20 text-brand-light font-medium">
              {tie.status === "WALKOVER" ? "W/O" : "FT"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className={`text-sm font-medium flex-1 ${tie.winner?.id === tie.homeTeam.id ? "text-brand-light" : "text-accent-foreground/80"}`}>
              {tie.homeTeam.name}
            </span>
            <span className="text-xl font-bold px-4 tabular-nums tracking-tight">
              {tie.homePoints} - {tie.awayPoints}
            </span>
            <span className={`text-sm font-medium flex-1 text-right ${tie.winner?.id === tie.awayTeam.id ? "text-brand-light" : "text-accent-foreground/80"}`}>
              {tie.awayTeam.name}
            </span>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-accent-foreground/40 ml-3 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && tie.matches.length > 0 && (
        <div className="border-t border-white/[0.08] px-4 py-3 space-y-2">
          {tie.matches.map((match) => {
            const score = match.scores[0];
            const isWonByHome = match.winnerId === tie.homeTeam.id;
            const isWonByAway = match.winnerId === tie.awayTeam.id;

            const homePlayers = match.lineup
              .filter((l) => l.lineup.teamId === tie.homeTeam.id)
              .map((l) => l.player);
            const awayPlayers = match.lineup
              .filter((l) => l.lineup.teamId === tie.awayTeam.id)
              .map((l) => l.player);

            return (
              <div key={match.id} className="rounded-[8px] bg-white/[0.06] p-3">
                <div className="flex items-center justify-center mb-2">
                  <span className={`text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    match.format === "DOUBLES" ? "bg-blue-500/20 text-blue-300" : "bg-white/10 text-accent-foreground/50"
                  }`}>
                    {match.format === "SINGLES" ? "Singles" : "Doubles"} {match.matchNumber}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className={`text-[11px] font-medium mb-0.5 ${isWonByHome ? "text-brand-light" : "text-accent-foreground/50"}`}>
                      {tie.homeTeam.name}
                    </p>
                    {homePlayers.map((player) => (
                      <p key={player.id} className={`text-[13px] ${isWonByHome ? "font-medium text-accent-foreground" : "text-accent-foreground/70"}`}>
                        <PlayerLink id={player.id} name={player.name} className="!text-inherit hover:!text-brand-light" />
                      </p>
                    ))}
                  </div>
                  <div className="text-center px-3 shrink-0">
                    {score ? (
                      <span className="text-sm font-bold tabular-nums text-accent-foreground">
                        {formatScore(score.scoreData, sportSlug)}
                      </span>
                    ) : match.status === "WALKOVER" ? (
                      <span className="text-[11px] text-red-400 font-medium">W/O</span>
                    ) : (
                      <span className="text-[11px] text-accent-foreground/40">vs</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-right">
                    <p className={`text-[11px] font-medium mb-0.5 ${isWonByAway ? "text-brand-light" : "text-accent-foreground/50"}`}>
                      {tie.awayTeam.name}
                    </p>
                    {awayPlayers.map((player) => (
                      <p key={player.id} className={`text-[13px] ${isWonByAway ? "font-medium text-accent-foreground" : "text-accent-foreground/70"}`}>
                        <PlayerLink id={player.id} name={player.name} className="!text-inherit hover:!text-brand-light" />
                      </p>
                    ))}
                  </div>
                </div>

                {sportSlug === "football" && score && (() => {
                  const fb = score.scoreData as { homeCards?: { playerName: string; type: string; minute?: number }[]; awayCards?: { playerName: string; type: string; minute?: number }[] };
                  const allCards = [
                    ...(fb.homeCards || []).map((c) => ({ ...c, team: tie.homeTeam.name })),
                    ...(fb.awayCards || []).map((c) => ({ ...c, team: tie.awayTeam.name })),
                  ];
                  if (allCards.length === 0) return null;
                  return (
                    <div className="mt-2 pt-2 border-t border-white/[0.08] space-y-1">
                      {allCards.map((c, i) => (
                        <p key={i} className="text-[11px] text-accent-foreground/50">
                          {c.type === "red" ? "🔴" : "🟡"} {c.playerName} ({c.team}){c.minute ? ` ${c.minute}'` : ""}
                        </p>
                      ))}
                    </div>
                  );
                })()}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
