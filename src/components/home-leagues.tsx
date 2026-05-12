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

      {/* Active Leagues */}
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
              <LeagueCard key={league.id} league={league} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* Upcoming */}
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
    <Link href={`/leagues/${league.slug}`} className="min-w-[75vw] sm:min-w-[320px] snap-start">
      <div className="rounded-[10px] border border-border-light bg-surface overflow-hidden press-effect hover:shadow-[var(--shadow-md)] transition-shadow">
        {/* Image — generous height */}
        <div className="relative aspect-[3/2] bg-muted overflow-hidden">
          <Image
            src={imageUrl}
            alt={league.sport.name}
            fill
            className="object-cover soho-img"
            sizes="(max-width: 640px) 75vw, 320px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          <div className="absolute top-3 right-3">
            <Badge variant={isLive ? "success" : "info"} className="bg-white/90 backdrop-blur-sm">
              {isLive ? "Live" : "Open"}
            </Badge>
          </div>
          <p className="absolute bottom-3 left-4 text-[10px] tracking-soho font-medium uppercase text-white/80">
            {league.sport.name}
          </p>
        </div>

        {/* Details — generous padding */}
        <div className="p-5">
          <h3 className="text-base font-medium leading-snug tracking-tight truncate">{league.name}</h3>

          {(league.startDate || league.endDate) && (
            <div className="flex items-center gap-1.5 mt-2.5 text-muted-foreground">
              <Calendar className="w-3.5 h-3.5 text-brand" />
              <span className="text-[13px]">
                {formatShortDate(league.startDate)}
                {league.endDate && <> — {formatShortDate(league.endDate)}</>}
              </span>
            </div>
          )}

          {isLive === false && league.registrationEnd && (
            <p className="text-[12px] text-amber-600 font-medium mt-2">
              Register by {formatShortDate(league.registrationEnd)}
            </p>
          )}

          <div className="flex items-center gap-3 mt-3 text-[13px] text-muted-foreground">
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
                {league.genderRestriction === "WOMENS_ONLY" ? "Women's" : "Men's"}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
