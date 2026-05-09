"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, Calendar } from "lucide-react";
import { CitySelector } from "@/components/city-selector";

interface LeagueItem {
  id: string;
  slug: string;
  name: string;
  city: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  registrationEnd: string | null;
  genderRestriction: string;
  sport: { name: string; icon: string | null };
  _count: { registrations: number };
}

function formatShortDate(date: string | null): string {
  if (!date) return "";
  const d = new Date(date);
  const day = d.getDate();
  const suffix = day === 1 || day === 21 || day === 31 ? "st" : day === 2 || day === 22 ? "nd" : day === 3 || day === 23 ? "rd" : "th";
  const month = d.toLocaleString("en-IN", { month: "short" });
  const year = `'${String(d.getFullYear()).slice(2)}`;
  return `${day}${suffix} ${month} ${year}`;
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
      <section className="py-6 px-4 sm:px-6 border-b border-border-light">
        <div className="max-w-3xl mx-auto">
          <CitySelector selectedCity={selectedCity} onCityChange={setSelectedCity} />
        </div>
      </section>

      {/* No results */}
      {selectedCity && active.length === 0 && upcoming.length === 0 && (
        <section className="py-12 px-4 text-center">
          <p className="text-muted-foreground">No leagues found in {selectedCity}</p>
          <button
            onClick={() => setSelectedCity("")}
            className="inline-action text-sm text-brand font-medium mt-2 hover:underline"
          >
            Show all leagues
          </button>
        </section>
      )}

      {/* Active Leagues */}
      {active.length > 0 && (
        <section className="py-8 px-4 sm:px-6 max-w-7xl mx-auto w-full">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold tracking-tight">Live Leagues</h2>
            <Link href="/leagues" className="inline-action text-sm text-brand font-semibold hover:underline">View all</Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {active.map((league) => (
              <LeagueCard key={league.id} league={league} />
            ))}
          </div>
        </section>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <section className="py-8 px-4 sm:px-6 max-w-7xl mx-auto w-full">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold tracking-tight">Open for Registration</h2>
            <Link href="/leagues" className="inline-action text-sm text-brand font-semibold hover:underline">View all</Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {upcoming.map((league) => (
              <LeagueCard key={league.id} league={league} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

function LeagueCard({ league }: { league: LeagueItem }) {
  const isLive = league.status === "IN_PROGRESS";
  const isOpen = league.status === "REGISTRATION_OPEN";

  return (
    <Link href={`/leagues/${league.slug}`}>
      <div
        className={`relative rounded-2xl overflow-hidden border transition-all duration-200 cursor-pointer h-full press-effect ${
          isLive
            ? "border-brand/40 bg-gradient-to-br from-brand/5 to-surface shadow-[0_0_20px_rgba(0,150,123,0.08)]"
            : "border-border-light bg-surface shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:border-brand/30"
        }`}
      >
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${isLive ? "bg-brand" : "bg-blue-500"}`} />

        <div className="p-5 pl-6">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base font-semibold tracking-tight truncate">{league.name}</h3>
            <Badge variant={isLive ? "success" : "info"} className="shrink-0">
              {isLive ? "Live" : "Open"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">{league.sport.name}</p>

          {(league.startDate || league.endDate) && (
            <div className="flex items-center gap-1.5 mt-2.5 text-sm text-foreground">
              <Calendar className="w-3.5 h-3.5 text-brand" />
              <span className="font-medium">
                {formatShortDate(league.startDate)}
                {league.endDate && <> — {formatShortDate(league.endDate)}</>}
              </span>
            </div>
          )}

          {isOpen && league.registrationEnd && (
            <p className="text-xs text-amber-600 font-medium mt-1">
              Register by {formatShortDate(league.registrationEnd)}
            </p>
          )}

          <div className="flex items-center gap-3 mt-2.5 text-sm text-muted-foreground">
            {league.city && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> {league.city}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" /> {league._count.registrations}
            </span>
            {league.genderRestriction !== "OPEN" && (
              <Badge variant={league.genderRestriction === "WOMENS_ONLY" ? "danger" : "info"}>
                {league.genderRestriction === "WOMENS_ONLY" ? "Women's Only" : "Men's Only"}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
