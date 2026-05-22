export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { Trophy } from "lucide-react";

export const metadata: Metadata = {
  title: "Sports",
  description: "Explore sports available on CadreSports. Join badminton leagues, football tournaments, and more across Indian cities.",
};

export default async function SportsPage() {
  const sports = await db.sport.findMany({
    where: { isActive: true },
    include: {
      _count: { select: { leagues: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="px-4 py-5 pb-20 max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Sports</h1>
        <p className="text-muted-foreground text-sm mt-1">Explore sports available on CadreSports</p>
      </div>

      {sports.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Trophy className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No sports added yet</p>
            <p className="text-sm text-muted-foreground mt-1">Coming soon!</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {sports.map((sport) => (
            <Link key={sport.id} href={`/leagues?sport=${sport.slug}`}>
              <Card className="hover:border-brand transition-colors cursor-pointer text-center py-8">
                <div className="w-12 h-12 bg-brand/10 rounded-[10px] flex items-center justify-center mx-auto mb-3">
                  <Trophy className="w-6 h-6 text-brand" />
                </div>
                <h3 className="font-semibold">{sport.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {sport._count.leagues} league{sport._count.leagues !== 1 ? "s" : ""}
                </p>
                {sport.description && (
                  <p className="text-xs text-muted-foreground mt-2">{sport.description}</p>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
