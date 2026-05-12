"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, Calendar } from "lucide-react";
import { CitySelector } from "@/components/city-selector";
import { getSportImage } from "@/lib/sport-images";

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
      <section className="py-8 px-5 sm:px-8 border-b border-border-light">
        <div className="max-w-3xl mx-auto">
          <CitySelector selectedCity={selectedCity} onCityChange={setSelectedCity} />
        </div>
      </section>

      {/* No results */}
      {selectedCity && active.length === 0 && upcoming.length === 0 && (
        <section className="py-16 px-5 text-center">
          <p className="text-muted-foreground font-sans">No leagues found in {selectedCity}</p>
          <button
            onClick={() => setSelectedCity("")}
            className="inline-action text-sm text-brand font-medium mt-2 hover:underline"
          >
            Show all leagues
          </button>
        </section>
      )}

      {/* Active Leagues — horizontal carousel */}
      {active.length > 0 && (
        <section className="py-10">
          <div className="px-5 sm:px-8 flex justify-between items-end mb-6 max-w-7xl mx-auto">
            <div>
              <p className="text-[10px] tracking-soho font-sans font-medium uppercase text-muted-foreground mb-1">Now Playing</p>
              <h2 className="font-serif text-2xl tracking-tight">Live Leagues</h2>
            </div>
            <Link href="/leagues" className="inline-action text-[10px] tracking-soho font-sans font-medium uppercase border-b border-foreground pb-0.5 hover:text-brand hover:border-brand transition-colors">
              View All
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto px-5 sm:px-8 no-scrollbar snap-x snap-mandatory pb-2">
            {active.map((league, i) => (
              <LeagueCard key={league.id} league={league} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* Upcoming — horizontal carousel */}
      {upcoming.length > 0 && (
        <section className="py-10 border-t border-border-light">
          <div className="px-5 sm:px-8 flex justify-between items-end mb-6 max-w-7xl mx-auto">
            <div>
              <p className="text-[10px] tracking-soho font-sans font-medium uppercase text-muted-foreground mb-1">Join Now</p>
              <h2 className="font-serif text-2xl tracking-tight">Open for Registration</h2>
            </div>
            <Link href="/leagues" className="inline-action text-[10px] tracking-soho font-sans font-medium uppercase border-b border-foreground pb-0.5 hover:text-brand hover:border-brand transition-colors">
              View All
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto px-5 sm:px-8 no-scrollbar snap-x snap-mandatory pb-2">
            {upcoming.map((league, i) => (
              <LeagueCard key={league.id} league={league} index={i} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

function LeagueCard({ league, index }: { league: LeagueItem; index: number }) {
  const isLive = league.status === "IN_PROGRESS";
  const imageUrl = getSportImage(league.sport.name, index);

  return (
    <Link href={`/leagues/${league.slug}`} className="min-w-[80%] sm:min-w-[340px] snap-start">
      <div className="border border-border-light bg-surface overflow-hidden transition-all duration-200 press-effect hover:shadow-[var(--shadow-md)]">
        {/* Sport image */}
        <div className="relative aspect-[16/9] bg-muted overflow-hidden">
          <Image
            src={imageUrl}
            alt={league.sport.name}
            fill
            className="object-cover soho-img"
            sizes="(max-width: 640px) 80vw, 340px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <div className="absolute top-3 right-3">
            <Badge variant={isLive ? "success" : "info"} className="backdrop-blur-sm bg-white/90">
              {isLive ? "Live" : "Open"}
            </Badge>
          </div>
          {/* Sport tag */}
          <div className="absolute bottom-3 left-3">
            <span className="text-[9px] tracking-soho font-sans font-medium uppercase text-white/80">
              {league.sport.name}
            </span>
          </div>
        </div>

        {/* Details */}
        <div className="p-4">
          <h3 className="font-serif text-lg leading-tight tracking-tight truncate">{league.name}</h3>

          {(league.startDate || league.endDate) && (
            <div className="flex items-center gap-1.5 mt-2 text-sm text-foreground">
              <Calendar className="w-3.5 h-3.5 text-brand" />
              <span className="font-sans text-xs font-medium">
                {formatShortDate(league.startDate)}
                {league.endDate && <> — {formatShortDate(league.endDate)}</>}
              </span>
            </div>
          )}

          {isLive === false && league.registrationEnd && (
            <p className="text-[11px] text-amber-600 font-sans font-medium mt-1.5">
              Register by {formatShortDate(league.registrationEnd)}
            </p>
          )}

          <div className="flex items-center gap-3 mt-2.5 text-xs text-muted-foreground font-sans">
            {league.city && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {league.city}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" /> {league._count.registrations}
            </span>
            {league.genderRestriction !== "OPEN" && (
              <Badge variant={league.genderRestriction === "WOMENS_ONLY" ? "danger" : "info"}>
                {league.genderRestriction === "WOMENS_ONLY" ? "Women's" : "Men's"}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
