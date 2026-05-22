"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, User, LogOut, LayoutDashboard, Trophy, UserPlus, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

function NavLink({ href, icon: Icon, label }: { href: string; icon: LucideIcon; label: string }) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + "/");
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-all duration-200",
        isActive
          ? "text-white border-b-[3px] border-brand"
          : "text-white/80 hover:text-white border-b-[3px] border-transparent"
      )}
    >
      <Icon className="w-4 h-4" strokeWidth={2} />
      {label}
    </Link>
  );
}

export function Navbar() {
  const { data: session, status } = useSession();
  const isLoggedOut = status === "unauthenticated";
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-dark shadow-[0_2px_8px_rgba(0,0,0,0.15)]">
      {/* Teal accent line */}
      <div className="h-[2px] w-full bg-brand" />

      <div className="max-w-7xl mx-auto px-5 sm:px-6">
        <div className="flex items-center justify-between h-[70px]">
          <Link href="/" className="flex items-center gap-2.5 press-effect shrink-0">
            <img src="/logo.png" alt="CadreSports" className="w-8 h-8 rounded-lg" />
            <span className="text-[17px] font-semibold text-white tracking-tight">CadreSports</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            <div className="flex items-center gap-1 mr-4">
              <NavLink href="/leagues" icon={Trophy} label="Leagues" />
              {session && <NavLink href="/dashboard" icon={LayoutDashboard} label="Dashboard" />}
              <NavLink href="/connect" icon={UserPlus} label="Connect" />
            </div>
            {session ? (
              <div className="relative group">
                <button className="flex items-center gap-2 h-9 px-3 rounded-[6px] hover:bg-white/10 transition-all duration-200">
                  <div className="w-7 h-7 bg-brand rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-white">{session.user.name?.[0]?.toUpperCase()}</span>
                  </div>
                  <span className="text-sm font-medium text-white hidden lg:inline">{session.user.name}</span>
                </button>
                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-border rounded-[8px] shadow-[var(--shadow-lg)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 overflow-hidden">
                  <Link href="/profile" className="flex items-center gap-2.5 px-4 py-3 text-sm text-foreground hover:bg-teal-light transition-colors">
                    <User className="w-4 h-4 text-muted-foreground" /> Profile
                  </Link>
                  <button
                    onClick={() => signOut()}
                    className="flex items-center gap-2.5 px-4 py-3 text-sm hover:bg-red-50 w-full text-left text-red-600 transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              </div>
            ) : isLoggedOut ? (
              <div className="flex items-center gap-2 ml-2">
                <Link href="/auth/signin">
                  <Button variant="ghost" size="sm" className="text-white/80 hover:text-white no-underline">Sign In</Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="sm">Get Started</Button>
                </Link>
              </div>
            ) : null}
          </div>

          {/* Mobile */}
          <div className="md:hidden flex items-center gap-2">
            {isLoggedOut && (
              <Link href="/auth/register">
                <Button size="sm" className="h-9 px-4 text-sm">Sign Up</Button>
              </Link>
            )}
            <button
              className="p-2 -mr-2 rounded-[6px] text-white hover:bg-white/10 transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden pb-5 pt-2 space-y-1 border-t border-white/10">
            <Link href="/leagues" className="block px-4 py-3 text-[15px] font-medium text-white rounded-[6px] hover:bg-white/10 transition-colors" onClick={() => setMenuOpen(false)}>
              Leagues
            </Link>
            <Link href="/connect" className="block px-4 py-3 text-[15px] font-medium text-white rounded-[6px] hover:bg-white/10 transition-colors" onClick={() => setMenuOpen(false)}>
              Connect
            </Link>
            {session ? (
              <>
                <Link href="/dashboard" className="block px-4 py-3 text-[15px] font-medium text-white rounded-[6px] hover:bg-white/10 transition-colors" onClick={() => setMenuOpen(false)}>
                  Dashboard
                </Link>
                <Link href="/profile" className="block px-4 py-3 text-[15px] font-medium text-white rounded-[6px] hover:bg-white/10 transition-colors" onClick={() => setMenuOpen(false)}>
                  Profile
                </Link>
                <button
                  onClick={() => { signOut(); setMenuOpen(false); }}
                  className="block w-full text-left px-4 py-3 text-[15px] font-medium text-red-400 rounded-[6px] hover:bg-red-500/10 transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2 pt-4 px-1">
                <Link href="/auth/signin" onClick={() => setMenuOpen(false)}>
                  <Button variant="outline" className="w-full border-white/30 text-white hover:bg-white hover:text-dark">Sign In</Button>
                </Link>
                <Link href="/auth/register" onClick={() => setMenuOpen(false)}>
                  <Button className="w-full">Get Started</Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
