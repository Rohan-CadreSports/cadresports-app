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
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-foreground text-background text-[11px] font-normal rounded-lg whitespace-nowrap z-50 shadow-lg pointer-events-none">
          {tip}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-foreground" />
        </div>
      )}
    </th>
  );
}

export function StandingsTable({ standings }: { standings: StandingItem[] }) {
  return (
    <div className="overflow-x-auto mobile-scroll rounded-[10px] bg-surface border border-border-light shadow-[var(--shadow-sm)]">
      <table className="w-full text-sm min-w-[500px]">
        <thead>
          <tr className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground border-b border-border-light">
            <th className="text-left py-3 px-3 w-10">#</th>
            <th className="text-left py-3 px-3">Team</th>
            <Th tip="Total team matches played" className="text-center py-3 px-2">P</Th>
            <Th tip="Total team matches won" className="text-center py-3 px-2">W</Th>
            <Th tip="Total team matches lost" className="text-center py-3 px-2">L</Th>
            <Th tip="Individual matches won" className="text-center py-3 px-2">MW</Th>
            <Th tip="Total points" className="text-center py-3 px-3">PTS</Th>
          </tr>
        </thead>
        <tbody>
          {standings.map((s, idx) => (
            <tr
              key={s.id}
              className={`border-b border-border-light last:border-0 ${
                idx === 0 ? "bg-amber-50/50" : "hover:bg-muted/50"
              }`}
            >
              <td className="py-3.5 px-3">
                {s.rank === 1 ? (
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-400 text-white text-xs font-bold">
                    {s.rank}
                  </span>
                ) : s.rank === 2 ? (
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-neutral-300 text-white text-xs font-bold">
                    {s.rank}
                  </span>
                ) : s.rank === 3 ? (
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-700/60 text-white text-xs font-bold">
                    {s.rank}
                  </span>
                ) : (
                  <span className="text-muted-foreground font-medium pl-2">{s.rank}</span>
                )}
              </td>
              <td className="py-3.5 px-3 font-medium text-[15px]">{s.team.name}</td>
              <td className="py-3.5 px-2 text-center text-muted-foreground">{s.tiesPlayed}</td>
              <td className="py-3.5 px-2 text-center text-emerald-600 font-semibold">{s.tiesWon}</td>
              <td className="py-3.5 px-2 text-center text-red-500">{s.tiesLost}</td>
              <td className="py-3.5 px-2 text-center text-foreground/70">{s.matchesWon}</td>
              <td className="py-3.5 px-3 text-center">
                <span className="inline-flex items-center justify-center min-w-[36px] h-8 rounded-full bg-neutral-100 text-foreground font-bold text-[15px]">
                  {s.totalPoints}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
