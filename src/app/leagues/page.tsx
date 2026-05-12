export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { LeagueCard } from "@/components/league-card";


export default async function LeaguesPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string; q?: string; sport?: string }>;
}) {
  const { city: queryCity, q: searchQuery, sport: sportFilter } = await searchParams;
  const session = await auth();

  let userCity: string | null = null;
  let userGender: string | null = null;
  if (session?.user) {
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { city: true, gender: true },
    });
    userCity = user?.city ?? null;
    userGender = user?.gender ?? null;
  }

  // Everyone sees all leagues. Gender restriction enforced only at registration.
  const genderFilter: string[] = ["OPEN", "MENS_ONLY", "WOMENS_ONLY"];

  const filterCity = queryCity || null;

  const where: Record<string, unknown> = {
    status: { in: ["REGISTRATION_OPEN", "IN_PROGRESS", "COMPLETED"] },
    genderRestriction: { in: genderFilter as ("OPEN" | "MENS_ONLY" | "WOMENS_ONLY")[] },
  };
  if (filterCity) {
    where.city = { equals: filterCity, mode: "insensitive" };
  }
  if (searchQuery) {
    where.name = { contains: searchQuery, mode: "insensitive" };
  }
  if (sportFilter) {
    where.sport = { slug: sportFilter };
  }

  const sports = await db.sport.findMany({ where: { isActive: true }, select: { slug: true, name: true } });

  const leagues = await db.league.findMany({
    where,
    include: {
      sport: { select: { name: true, slug: true } },
      _count: { select: { registrations: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const sortedLeagues = userCity
    ? [
        ...leagues.filter((l) => l.city?.toLowerCase() === userCity!.toLowerCase()),
        ...leagues.filter((l) => l.city?.toLowerCase() !== userCity!.toLowerCase()),
      ]
    : leagues;

  return (
    <div className="px-4 pt-6 py-5 pb-20 max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-medium tracking-tight">Leagues</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {searchQuery ? `Results for "${searchQuery}"` :
           filterCity ? `Showing leagues in ${filterCity}` :
           userCity ? `Showing leagues in ${userCity} first` :
           "Find and join leagues near you"}
        </p>
      </div>

      {/* Search + Sport Filter */}
      <form action="/leagues" className="space-y-2">
        {filterCity && <input type="hidden" name="city" value={filterCity} />}
        <div className="flex gap-2">
          <input
            name="q"
            type="text"
            defaultValue={searchQuery || ""}
            placeholder="Search leagues..."
            className="flex-1 h-10 px-3.5 rounded-[8px] bg-surface border border-border text-foreground text-[14px] placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
          />
          <button type="submit" className="h-10 px-5 bg-brand text-white rounded-[8px] font-medium text-[14px] hover:opacity-90 inline-action">
            Search
          </button>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <Link href={`/leagues${filterCity ? `?city=${filterCity}` : ""}`}>
            <span className={`inline-action text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${!sportFilter ? "bg-brand text-white border-brand" : "bg-surface border-border-light hover:border-brand"}`}>
              All Sports
            </span>
          </Link>
          {sports.map((s) => (
            <Link key={s.slug} href={`/leagues?sport=${s.slug}${filterCity ? `&city=${filterCity}` : ""}`}>
              <span className={`inline-action text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${sportFilter === s.slug ? "bg-brand text-white border-brand" : "bg-surface border-border-light hover:border-brand"}`}>
                {s.name}
              </span>
            </Link>
          ))}
        </div>
      </form>

      {sortedLeagues.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No leagues available yet</p>
            <p className="text-sm text-muted-foreground mt-1">Check back soon!</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {sortedLeagues.map((league, i) => {
            const isYourCity = !!(userCity && league.city?.toLowerCase() === userCity.toLowerCase());
            return (
              <LeagueCard
                key={league.id}
                league={{
                  ...league,
                  startDate: league.startDate?.toISOString() ?? null,
                  endDate: league.endDate?.toISOString() ?? null,
                  registrationEnd: league.registrationEnd?.toISOString() ?? null,
                }}
                index={i}
                variant="grid"
                isYourCity={isYourCity}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
