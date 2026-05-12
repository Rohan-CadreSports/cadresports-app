export const dynamic = "force-dynamic";

import Link from "next/link";
import Image from "next/image";
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
      {/* Hero — full screen on mobile */}
      <section className="relative w-full min-h-[85vh] sm:min-h-[70vh] flex flex-col justify-end">
        <Image
          src="/hero-sports.jpg"
          alt="Luxury sports facility"
          fill
          priority
          className="object-cover soho-img"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/5" />
        <div className="relative px-6 pb-10 sm:pb-14 sm:px-10 text-white">
          <h1 className="font-serif text-[42px] sm:text-6xl leading-[1.05] tracking-tight">
            Play.<br />
            Compete.<br />
            <span className="text-brand-light">Connect.</span>
          </h1>
          <p className="mt-4 text-[15px] sm:text-base text-white/70 max-w-sm leading-relaxed">
            Join exclusive sports leagues near you. Compete in tournaments and connect with players who share your passion.
          </p>
          <div className="mt-7 flex gap-3">
            <Link href="/auth/register">
              <Button size="md">
                Get Started
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
            <Link href="/leagues">
              <Button variant="outline" size="md" className="border-white/25 text-white hover:bg-white/10 hover:text-white">
                Browse
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
      <section className="py-14 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-[11px] tracking-soho font-medium uppercase text-muted-foreground mb-2">The Experience</p>
          <h2 className="text-2xl sm:text-3xl font-medium tracking-tight mb-8">Everything You Need</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { icon: Trophy, title: "Leagues", desc: "Join organized leagues in your city" },
              { icon: Shield, title: "Leaderboards", desc: "Real-time standings and results" },
              { icon: MapPin, title: "Local", desc: "Discover leagues near you" },
              { icon: Zap, title: "Multi-Sport", desc: "Badminton, Football and more" },
              { icon: Users, title: "Teams", desc: "Build your squad, compete together" },
              { icon: UserPlus, title: "Connect", desc: "Find players. Coming soon" },
            ].map((f) => (
              <div key={f.title} className="rounded-[10px] bg-surface p-5 border border-border-light">
                <f.icon className="w-5 h-5 text-brand mb-3" strokeWidth={1.5} />
                <h3 className="text-sm font-medium mb-1">{f.title}</h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 bg-accent text-accent-foreground">
        <div className="max-w-sm mx-auto text-center">
          <p className="text-[11px] tracking-soho font-medium uppercase opacity-50 mb-3">Join the Club</p>
          <h2 className="font-serif text-3xl tracking-tight mb-5">Ready to play?</h2>
          <p className="text-sm opacity-60 mb-8 leading-relaxed">
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
      <footer className="border-t border-border-light py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="CadreSports" className="w-6 h-6 rounded-md" />
            <span className="text-base font-medium tracking-tight">CadreSports</span>
          </div>
          <p className="text-[11px] text-muted-foreground tracking-soho uppercase">
            &copy; {new Date().getFullYear()} CadreSports
          </p>
        </div>
      </footer>
    </div>
  );
}
