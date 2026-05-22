"use client";

import { useState } from "react";
import Link from "next/link";
import { CitySelector } from "@/components/city-selector";
import { LeagueCard } from "@/components/league-card";

interface LeagueItem {
  id: string;
  slug: string;
  name: string;
  city: string | null;
  status: string;
  imageUrl?: string | null;
  startDate: string | null;
  endDate: string | null;
  registrationEnd: string | null;
  genderRestriction: string;
  sport: { name: string; icon: string | null };
  _count: { registrations: number };
}

export function HomeLeagues({
  allLeagues,
}: {
  allLeagues: LeagueItem[];
}) {
  const [selectedCity, setSelectedCity] = useState("");

  const filtered = selectedCity
    ? allLeagues.filter((l) => l.city?.toLowerCase() === selectedCity.toLowerCase())
    : allLeagues;

  const active = filtered.filter((l) => l.status === "IN_PROGRESS");
  const upcoming = filtered.filter((l) => l.status === "REGISTRATION_OPEN");

  return (
    <>
      {/* City Selector */}
      <section className="py-8 px-6 border-b border-border-light">
        <div className="max-w-3xl mx-auto">
          <CitySelector selectedCity={selectedCity} onCityChange={setSelectedCity} />
        </div>
      </section>

      {selectedCity && active.length === 0 && upcoming.length === 0 && (
        <section className="py-16 px-6 text-center">
          <p className="text-muted-foreground">No leagues found in {selectedCity}</p>
          <button
            onClick={() => setSelectedCity("")}
            className="inline-action text-sm text-brand font-medium mt-2 hover:underline"
          >
            Show all leagues
          </button>
        </section>
      )}

      {active.length > 0 && (
        <section className="pt-10 pb-6">
          <div className="px-6 flex justify-between items-end mb-5 max-w-7xl mx-auto">
            <div>
              <p className="text-[11px] tracking-soho font-medium uppercase text-muted-foreground mb-1">Now Playing</p>
              <h2 className="text-xl font-medium tracking-tight">Live Leagues</h2>
            </div>
            <Link href="/leagues" className="inline-action text-[11px] tracking-soho font-medium uppercase text-muted-foreground hover:text-brand transition-colors">
              View All
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto px-6 no-scrollbar snap-x snap-mandatory pb-4">
            {active.map((league, i) => (
              <LeagueCard key={league.id} league={league} index={i} variant="carousel" />
            ))}
          </div>
        </section>
      )}

      {upcoming.length > 0 && (
        <section className="pt-8 pb-6 border-t border-border-light">
          <div className="px-6 flex justify-between items-end mb-5 max-w-7xl mx-auto">
            <div>
              <p className="text-[11px] tracking-soho font-medium uppercase text-muted-foreground mb-1">Join Now</p>
              <h2 className="text-xl font-medium tracking-tight">Open for Registration</h2>
            </div>
            <Link href="/leagues" className="inline-action text-[11px] tracking-soho font-medium uppercase text-muted-foreground hover:text-brand transition-colors">
              View All
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto px-6 no-scrollbar snap-x snap-mandatory pb-4">
            {upcoming.map((league, i) => (
              <LeagueCard key={league.id} league={league} index={i} variant="carousel" />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
