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
        "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200",
        isActive
          ? "bg-surface text-foreground shadow-[var(--shadow-xs)]"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </Link>
  );
}

export function Navbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-surface border-b border-border-light">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-13 sm:h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 press-effect shrink-0">
            <img src="/logo.png" alt="CadreSports" className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl" />
            <span className="text-base sm:text-lg font-bold tracking-tight text-dark">CadreSports</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            <div className="flex items-center bg-muted/60 rounded-xl p-0.5 mr-2">
              <NavLink href="/leagues" icon={Trophy} label="Leagues" />
              {session && <NavLink href="/dashboard" icon={LayoutDashboard} label="Dashboard" />}
              <NavLink href="/connect" icon={UserPlus} label="Connect" />
            </div>
            {session ? (
              <div className="flex items-center gap-2">
                <div className="relative group">
                  <button className="flex items-center gap-2 h-9 px-2.5 rounded-xl hover:bg-muted transition-all duration-200">
                    <div className="w-7 h-7 bg-gradient-to-br from-brand to-brand-dark rounded-full flex items-center justify-center shadow-[var(--shadow-xs)]">
                      <span className="text-xs font-bold text-white">
                        {session.user.name?.[0]?.toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm font-medium hidden lg:inline">{session.user.name}</span>
                  </button>
                  <div className="absolute right-0 top-full mt-1 w-48 bg-surface border border-border-light rounded-2xl shadow-[var(--shadow-lg)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 overflow-hidden">
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
              </div>
            ) : (
              <div className="flex items-center gap-2 ml-2">
                <Link href="/auth/signin">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="sm">Get Started</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-xl hover:bg-muted transition-colors duration-200"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden pb-4 pt-2 space-y-1 animate-in slide-in-from-top-2 duration-200">
            <Link href="/leagues" className="block px-4 py-2.5 text-[15px] font-medium rounded-xl hover:bg-muted transition-colors" onClick={() => setMenuOpen(false)}>
              Leagues
            </Link>
            <Link href="/connect" className="block px-4 py-2.5 text-[15px] font-medium rounded-xl hover:bg-muted transition-colors" onClick={() => setMenuOpen(false)}>
              Connect
            </Link>
            {session ? (
              <>
                <Link href="/dashboard" className="block px-4 py-2.5 text-[15px] font-medium rounded-xl hover:bg-muted transition-colors" onClick={() => setMenuOpen(false)}>
                  Dashboard
                </Link>
                <Link href="/profile" className="block px-4 py-2.5 text-[15px] font-medium rounded-xl hover:bg-muted transition-colors" onClick={() => setMenuOpen(false)}>
                  Profile
                </Link>
                <button
                  onClick={() => { signOut(); setMenuOpen(false); }}
                  className="block w-full text-left px-4 py-2.5 text-[15px] font-medium text-red-600 rounded-xl hover:bg-red-50 transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2 pt-3 px-1">
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
