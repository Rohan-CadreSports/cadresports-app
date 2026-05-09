export const dynamic = "force-dynamic";

import Link from "next/link";
import { Trophy, ArrowRight, Shield, Zap, MapPin, Users, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { HomeLeagues } from "@/components/home-leagues";

export default async function HomePage() {
  // Everyone sees all leagues. Gender enforced at registration only.
  const allLeagues = await db.league.findMany({
    where: {
      status: { in: ["IN_PROGRESS", "REGISTRATION_OPEN"] },
    },
    include: {
      sport: { select: { name: true, icon: true } },
      _count: { select: { registrations: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 12,
  });

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden bg-dark text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-brand/20 via-transparent to-brand/5" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
          <div className="max-w-xl">
            <h1 className="text-3xl sm:text-5xl font-bold leading-[1.1] tracking-tight">
              Play. Compete.{" "}
              <span className="text-brand">Connect.</span>
            </h1>
            <p className="mt-4 text-[15px] text-gray-400 leading-relaxed max-w-md">
              Join sports leagues near you, compete in tournaments, and connect with players who share your passion.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
              <Link href="/auth/register">
                <Button size="lg" className="w-full sm:w-auto">
                  Get Started Free
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
              <Link href="/leagues">
                <Button variant="outline" size="lg" className="w-full sm:w-auto border-white/15 text-white hover:bg-white/10 hover:text-white">
                  Browse Leagues
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* City Selector + Leagues */}
      <HomeLeagues allLeagues={allLeagues.map((l) => ({
        ...l,
        startDate: l.startDate?.toISOString() ?? null,
        endDate: l.endDate?.toISOString() ?? null,
        registrationEnd: l.registrationEnd?.toISOString() ?? null,
      }))} />

      {/* Features */}
      <section className="py-12 px-4 sm:px-6 bg-muted/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-xl font-bold tracking-tight text-center mb-8">Everything You Need</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { icon: Trophy, title: "Compete in Leagues", desc: "Join organized leagues and tournaments in your city." },
              { icon: Shield, title: "Live Leaderboards", desc: "Real-time standings and match results updated instantly." },
              { icon: MapPin, title: "Local to You", desc: "Discover leagues happening near you." },
              { icon: Zap, title: "Multiple Sports", desc: "Badminton, Football, and more sports being added." },
              { icon: Users, title: "Play with Friends", desc: "Build your team, compete together, track your progress." },
              { icon: UserPlus, title: "Connect", desc: "Find players to play with. Coming Soon!" },
            ].map((f) => (
              <div key={f.title} className="bg-surface p-5 rounded-2xl border border-border-light shadow-[var(--shadow-xs)]">
                <div className="w-9 h-9 bg-brand/10 rounded-xl flex items-center justify-center mb-3">
                  <f.icon className="w-5 h-5 text-brand" />
                </div>
                <h3 className="font-semibold text-sm mb-1">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 px-4 sm:px-6">
        <div className="max-w-lg mx-auto text-center">
          <h2 className="text-2xl font-bold tracking-tight mb-3">Ready to play?</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Join thousands of players competing in leagues across the country.
          </p>
          <Link href="/auth/register">
            <Button size="lg">
              Create Free Account
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border-light py-6 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="CadreSports" className="w-6 h-6 rounded-md" />
            <span className="font-semibold text-sm">CadreSports</span>
          </div>
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} CadreSports. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
