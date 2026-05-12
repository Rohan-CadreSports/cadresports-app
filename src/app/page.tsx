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
    <div className="flex flex-col animate-in fade-in duration-700">
      {/* Hero — editorial, full-bleed */}
      <section className="relative w-full aspect-[4/5] sm:aspect-[16/7] bg-accent overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1461896836934-bd45ba8fcb67?auto=format&fit=crop&w=1600&q=80"
          alt="Athletes competing"
          fill
          priority
          className="object-cover soho-img"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-8 sm:bottom-12 left-5 sm:left-10 right-5 text-white">
          <p className="text-[10px] sm:text-xs tracking-soho font-sans font-medium uppercase mb-2 sm:mb-3 opacity-80">
            Wellness & Sport
          </p>
          <h1 className="font-serif text-4xl sm:text-6xl leading-[1.05] tracking-tight max-w-lg">
            Play. Compete.{" "}
            <span className="text-brand-light">Connect.</span>
          </h1>
          <p className="mt-3 sm:mt-4 text-sm sm:text-base text-white/70 font-sans max-w-md leading-relaxed">
            Join exclusive sports leagues near you. Compete in tournaments and connect with players who share your passion.
          </p>
          <div className="mt-5 sm:mt-6 flex gap-3">
            <Link href="/auth/register">
              <Button size="lg" className="shadow-lg">
                Get Started
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
            <Link href="/leagues">
              <Button variant="outline" size="lg" className="border-white/20 text-white hover:bg-white/10 hover:text-white backdrop-blur-sm">
                Browse Leagues
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* City Selector + League Cards */}
      <HomeLeagues allLeagues={allLeagues.map((l) => ({
        ...l,
        startDate: l.startDate?.toISOString() ?? null,
        endDate: l.endDate?.toISOString() ?? null,
        registrationEnd: l.registrationEnd?.toISOString() ?? null,
      }))} />

      {/* Features — editorial grid */}
      <section className="py-14 px-5 sm:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-[10px] tracking-soho font-sans font-medium uppercase text-muted-foreground mb-2">The Experience</p>
            <h2 className="font-serif text-3xl sm:text-4xl tracking-tight">Everything You Need</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Trophy, title: "Compete in Leagues", desc: "Join organized leagues and tournaments in your city." },
              { icon: Shield, title: "Live Leaderboards", desc: "Real-time standings and match results updated instantly." },
              { icon: MapPin, title: "Local to You", desc: "Discover leagues happening near you." },
              { icon: Zap, title: "Multiple Sports", desc: "Badminton, Football, and more sports being added." },
              { icon: Users, title: "Play with Friends", desc: "Build your team, compete together, track your progress." },
              { icon: UserPlus, title: "Connect", desc: "Find players to play with. Coming Soon!" },
            ].map((f) => (
              <div key={f.title} className="bg-surface p-6 border border-border-light transition-shadow duration-200 hover:shadow-[var(--shadow-md)]">
                <div className="w-10 h-10 bg-brand/8 rounded-full flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-brand" />
                </div>
                <h3 className="font-sans font-semibold text-sm mb-1.5 tracking-tight">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-5 sm:px-8 bg-accent text-accent-foreground">
        <div className="max-w-lg mx-auto text-center">
          <p className="text-[10px] tracking-soho font-sans font-medium uppercase opacity-60 mb-3">Join the Club</p>
          <h2 className="font-serif text-3xl sm:text-4xl tracking-tight mb-4">Ready to play?</h2>
          <p className="text-sm opacity-70 font-sans mb-8 leading-relaxed">
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
      <footer className="border-t border-border-light py-8 px-5 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="CadreSports" className="w-6 h-6 rounded-md" />
            <span className="font-serif text-lg tracking-tight">CadreSports</span>
          </div>
          <p className="text-xs text-muted-foreground tracking-soho uppercase">
            &copy; {new Date().getFullYear()} CadreSports. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
