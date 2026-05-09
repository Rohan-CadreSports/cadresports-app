"use client";

import { useState } from "react";

interface StandingItem {
  id: string;
  rank: number;
  tiesPlayed: number;
  tiesWon: number;
  tiesLost: number;
  matchesWon: number;
  totalPoints: number;
  team: { id: string; name: string };
}

function Th({ tip, children, className }: { tip: string; children: React.ReactNode; className?: string }) {
  const [show, setShow] = useState(false);

  return (
    <th
      className={`relative ${className || ""}`}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-[#1a1a1a] text-white text-[11px] font-normal rounded-lg whitespace-nowrap z-50 shadow-lg pointer-events-none">
          {tip}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-[#1a1a1a]" />
        </div>
      )}
    </th>
  );
}

export function StandingsTable({ standings }: { standings: StandingItem[] }) {
  return (
    <div className="overflow-x-auto mobile-scroll rounded-2xl bg-surface border border-border-light shadow-[var(--shadow-sm)]">
      <table className="w-full text-sm min-w-[500px]">
        <thead>
          <tr className="text-xs font-semibold text-muted-foreground border-b-2 border-brand/10 bg-brand/[0.03]">
            <th className="text-left py-3.5 px-3 w-10">#</th>
            <th className="text-left py-3.5 px-3">Team</th>
            <Th tip="Total team matches played" className="text-center py-3.5 px-2">Total</Th>
            <Th tip="Total team matches won" className="text-center py-3.5 px-2">Wins</Th>
            <Th tip="Total team matches lost" className="text-center py-3.5 px-2">Losses</Th>
            <Th tip="Individual matches won inside team matches" className="text-center py-3.5 px-2">Matches Won</Th>
            <Th tip="Matches won + bonus for clean sweep" className="text-center py-3.5 px-3">Points</Th>
          </tr>
        </thead>
        <tbody>
          {standings.map((s, idx) => (
            <tr key={s.id} className={`border-b border-border-light last:border-0 transition-colors ${idx === 0 ? "bg-brand/[0.04]" : "hover:bg-muted/50"}`}>
              <td className="py-4 px-3">
                {s.rank === 1 ? (
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-brand text-white text-xs font-bold">{s.rank}</span>
                ) : s.rank === 2 ? (
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-muted text-foreground text-xs font-bold">{s.rank}</span>
                ) : (
                  <span className="text-muted-foreground font-medium pl-2">{s.rank}</span>
                )}
              </td>
              <td className="py-4 px-3 font-semibold text-base">{s.team.name}</td>
              <td className="py-4 px-2 text-center text-sm">{s.tiesPlayed}</td>
              <td className="py-4 px-2 text-center text-emerald-600 font-semibold text-sm">{s.tiesWon}</td>
              <td className="py-4 px-2 text-center text-red-500 text-sm">{s.tiesLost}</td>
              <td className="py-4 px-2 text-center font-medium text-sm">{s.matchesWon}</td>
              <td className="py-4 px-3 text-center">
                <span className="inline-flex items-center justify-center min-w-[36px] h-8 rounded-xl bg-brand/10 text-brand font-bold text-base">{s.totalPoints}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
