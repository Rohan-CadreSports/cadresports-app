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
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-white text-accent text-[11px] font-normal rounded-lg whitespace-nowrap z-50 shadow-lg pointer-events-none">
          {tip}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white" />
        </div>
      )}
    </th>
  );
}

export function StandingsTable({ standings }: { standings: StandingItem[] }) {
  return (
    <div className="overflow-x-auto mobile-scroll rounded-[10px] bg-accent text-accent-foreground overflow-hidden">
      <table className="w-full text-sm min-w-[500px]">
        <thead>
          <tr className="text-[11px] font-medium uppercase tracking-wider text-accent-foreground/40 border-b border-white/10">
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
              className={`border-b border-white/[0.06] last:border-0 ${
                idx === 0 ? "bg-white/[0.07]" : ""
              }`}
            >
              <td className="py-3.5 px-3">
                {s.rank === 1 ? (
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-400 text-accent text-xs font-bold">
                    {s.rank}
                  </span>
                ) : s.rank === 2 ? (
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white/20 text-white text-xs font-bold">
                    {s.rank}
                  </span>
                ) : s.rank === 3 ? (
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-700/40 text-amber-200 text-xs font-bold">
                    {s.rank}
                  </span>
                ) : (
                  <span className="text-accent-foreground/40 font-medium pl-2">{s.rank}</span>
                )}
              </td>
              <td className="py-3.5 px-3 font-medium text-[15px]">{s.team.name}</td>
              <td className="py-3.5 px-2 text-center text-accent-foreground/50">{s.tiesPlayed}</td>
              <td className="py-3.5 px-2 text-center text-emerald-300 font-semibold">{s.tiesWon}</td>
              <td className="py-3.5 px-2 text-center text-red-400/80">{s.tiesLost}</td>
              <td className="py-3.5 px-2 text-center text-accent-foreground/60">{s.matchesWon}</td>
              <td className="py-3.5 px-3 text-center">
                <span className="inline-flex items-center justify-center min-w-[36px] h-8 rounded-full bg-white/15 text-white font-bold text-[15px]">
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
