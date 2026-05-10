export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { MapPin, Users, Calendar, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";

function formatShortDate(date: Date | null): string {
  if (!date) return "";
  const d = new Date(date);
  const day = d.getDate();
  const suffix = day === 1 || day === 21 || day === 31 ? "st" : day === 2 || day === 22 ? "nd" : day === 3 || day === 23 ? "rd" : "th";
  const month = d.toLocaleString("en-IN", { month: "short" });
  const year = `'${String(d.getFullYear()).slice(2)}`;
  return `${day}${suffix} ${month} ${year}`;
}

export default async function LeaguesPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string }>;
}) {
  const { city: queryCity } = await searchParams;
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

  const leagues = await db.league.findMany({
    where,
    include: {
      sport: { select: { name: true } },
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
    <div className="px-4 py-5 pb-20 max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Leagues</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {filterCity
            ? `Showing leagues in ${filterCity}`
            : userCity
            ? `Showing leagues in ${userCity} first`
            : "Find and join leagues near you"}
        </p>
      </div>

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
          {sortedLeagues.map((league) => {
            const isLive = league.status === "IN_PROGRESS";
            const isOpen = league.status === "REGISTRATION_OPEN";
            const isYourCity = userCity && league.city?.toLowerCase() === userCity.toLowerCase();

            return (
              <Link key={league.id} href={`/leagues/${league.slug}`}>
                <div
                  className={`relative rounded-2xl overflow-hidden border transition-all duration-200 cursor-pointer press-effect mb-3 ${
                    isLive
                      ? "border-border bg-surface shadow-[var(--shadow-sm)]"
                      : "border-border-light bg-surface shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-sm)]"
                  }`}
                >
                  {/* Brand accent bar */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${isLive ? "bg-brand" : isOpen ? "bg-blue-500" : "bg-muted-foreground/30"}`} />

                  <div className="p-5 pl-6">
                    {/* Top row: name + status */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-base font-semibold tracking-tight truncate">{league.name}</h3>
                        <p className="text-sm text-muted-foreground mt-0.5">{league.sport.name}</p>
                      </div>
                      <Badge variant={isLive ? "success" : isOpen ? "info" : "default"} className="shrink-0">
                        {isLive ? "Live" : isOpen ? "Open" : "Completed"}
                      </Badge>
                    </div>

                    {/* Dates */}
                    {(league.startDate || league.endDate) && (
                      <div className="flex items-center gap-1.5 mt-3 text-sm text-foreground">
                        <Calendar className="w-3.5 h-3.5 text-brand" />
                        <span className="font-medium">
                          {formatShortDate(league.startDate)}
                          {league.endDate && <> — {formatShortDate(league.endDate)}</>}
                        </span>
                      </div>
                    )}

                    {/* Registration deadline */}
                    {isOpen && league.registrationEnd && (
                      <p className="text-xs text-amber-600 font-medium mt-1.5">
                        Register by {formatShortDate(league.registrationEnd)}
                      </p>
                    )}

                    {/* Bottom row: city, players, gender */}
                    <div className="flex items-center gap-3 mt-3 text-sm text-muted-foreground">
                      {league.city && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {league.city}
                          {isYourCity && (
                            <span className="text-brand font-semibold text-xs ml-0.5">Your city</span>
                          )}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {league._count.registrations} player{league._count.registrations !== 1 ? "s" : ""}
                      </span>
                      {league.genderRestriction !== "OPEN" && (
                        <Badge variant={league.genderRestriction === "WOMENS_ONLY" ? "danger" : "info"} className="text-xs">
                          {league.genderRestriction === "WOMENS_ONLY" ? "Women's Only" : "Men's Only"}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
