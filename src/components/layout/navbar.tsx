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
        "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
        isActive
          ? "bg-surface text-foreground shadow-[var(--shadow-xs)]"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      <Icon className="w-4 h-4" strokeWidth={1.8} />
      {label}
    </Link>
  );
}

export function Navbar() {
  const { data: session, status } = useSession();
  const isLoggedOut = status === "unauthenticated";
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-surface border-b border-border-light">
      <div className="max-w-7xl mx-auto px-5 sm:px-6">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2.5 press-effect shrink-0">
            <img src="/logo.png" alt="CadreSports" className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg" />
            <span className="text-[17px] font-medium tracking-tight text-foreground">CadreSports</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            <div className="flex items-center bg-muted/50 rounded-full p-0.5 mr-3">
              <NavLink href="/leagues" icon={Trophy} label="Leagues" />
              {session && <NavLink href="/dashboard" icon={LayoutDashboard} label="Dashboard" />}
              <NavLink href="/connect" icon={UserPlus} label="Connect" />
            </div>
            {session ? (
              <div className="relative group">
                <button className="flex items-center gap-2 h-9 px-3 rounded-full hover:bg-muted transition-all duration-200">
                  <div className="w-7 h-7 bg-brand rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-white">{session.user.name?.[0]?.toUpperCase()}</span>
                  </div>
                  <span className="text-sm font-medium hidden lg:inline">{session.user.name}</span>
                </button>
                <div className="absolute right-0 top-full mt-1 w-48 bg-surface border border-border-light rounded-[10px] shadow-[var(--shadow-lg)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 overflow-hidden">
                  <Link href="/profile" className="flex items-center gap-2.5 px-4 py-3 text-sm hover:bg-muted transition-colors">
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
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="sm">Get Started</Button>
                </Link>
              </div>
            ) : null}
          </div>

          {/* Mobile: show Sign Up when not logged in, hamburger always */}
          <div className="md:hidden flex items-center gap-2">
            {isLoggedOut && (
              <Link href="/auth/register">
                <Button size="sm" className="h-9 px-4 text-[13px]">Sign Up</Button>
              </Link>
            )}
            <button
              className="p-2 -mr-2 rounded-full hover:bg-muted transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden pb-5 pt-2 space-y-1">
            <Link href="/leagues" className="block px-4 py-3 text-[15px] font-medium rounded-[10px] hover:bg-muted transition-colors" onClick={() => setMenuOpen(false)}>
              Leagues
            </Link>
            <Link href="/connect" className="block px-4 py-3 text-[15px] font-medium rounded-[10px] hover:bg-muted transition-colors" onClick={() => setMenuOpen(false)}>
              Connect
            </Link>
            {session ? (
              <>
                <Link href="/dashboard" className="block px-4 py-3 text-[15px] font-medium rounded-[10px] hover:bg-muted transition-colors" onClick={() => setMenuOpen(false)}>
                  Dashboard
                </Link>
                <Link href="/profile" className="block px-4 py-3 text-[15px] font-medium rounded-[10px] hover:bg-muted transition-colors" onClick={() => setMenuOpen(false)}>
                  Profile
                </Link>
                <button
                  onClick={() => { signOut(); setMenuOpen(false); }}
                  className="block w-full text-left px-4 py-3 text-[15px] font-medium text-red-600 rounded-[10px] hover:bg-red-50 transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2 pt-4 px-1">
                <Link href="/auth/signin" onClick={() => setMenuOpen(false)}>
                  <Button variant="outline" className="w-full">Sign In</Button>
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
