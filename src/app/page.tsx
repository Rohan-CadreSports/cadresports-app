export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowRight, Shield, Zap, MapPin, Users, UserPlus, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { HomeLeagues } from "@/components/home-leagues";

export default async function HomePage() {
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
      <section className="w-full py-20 sm:py-28 px-6 sm:px-10 bg-white">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-bold leading-[1.2] tracking-tight text-foreground">
            Play. Compete.<br />
            <span className="text-brand">Connect.</span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-md leading-relaxed">
            Join sports leagues near you. Compete in tournaments and connect with players who share your passion.
          </p>
          <div className="mt-8 flex gap-3">
            <Link href="/auth/register">
              <Button size="lg">
                Get Started
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
            <Link href="/leagues">
              <Button variant="outline" size="lg">
                Browse Leagues
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Leagues */}
      <HomeLeagues allLeagues={allLeagues.map((l) => ({
        ...l,
        startDate: l.startDate?.toISOString() ?? null,
        endDate: l.endDate?.toISOString() ?? null,
        registrationEnd: l.registrationEnd?.toISOString() ?? null,
      }))} />

      {/* Features */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-2">Everything You Need</h2>
          <p className="text-muted-foreground mb-8">One platform for all your sports league management</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { icon: Trophy, title: "Leagues", desc: "Join organized leagues in your city" },
              { icon: Shield, title: "Leaderboards", desc: "Real-time standings and results" },
              { icon: MapPin, title: "Local", desc: "Discover leagues near you" },
              { icon: Zap, title: "Multi-Sport", desc: "Badminton, Football and more" },
              { icon: Users, title: "Teams", desc: "Build your squad, compete together" },
              { icon: UserPlus, title: "Connect", desc: "Find players. Coming soon" },
            ].map((f) => (
              <div key={f.title} className="rounded-[8px] bg-white p-5 border border-border shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:border-brand transition-all duration-200">
                <f.icon className="w-5 h-5 text-brand mb-3" strokeWidth={2} />
                <h3 className="text-sm font-semibold mb-1">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 bg-teal-light">
        <div className="max-w-lg mx-auto text-center">
          <h2 className="text-3xl font-bold tracking-tight mb-4">Ready to play?</h2>
          <p className="text-muted-foreground mb-8 leading-relaxed">
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
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="CadreSports" className="w-7 h-7 rounded-md" />
            <span className="text-base font-semibold tracking-tight text-foreground">CadreSports</span>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} CadreSports. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
