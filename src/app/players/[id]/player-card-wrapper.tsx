"use client";

import { PlayerCard } from "@/components/player-card";

interface Props {
  player: {
    id: string;
    name: string;
    city?: string | null;
    gender?: string | null;
    role: string;
    createdAt: string;
    favoriteSports?: string[];
    image?: string | null;
  };
  stats: {
    leaguesPlayed: number;
    matchesPlayed: number;
    wins: number;
  };
}

export function PlayerCardWrapper({ player, stats }: Props) {
  return <PlayerCard player={player} stats={stats} />;
}
