"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Home, Trophy, UserPlus, User, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/leagues", icon: Trophy, label: "Leagues" },
  { href: "/connect", icon: UserPlus, label: "Connect" },
  { href: "/dashboard", icon: LayoutDashboard, label: "Dash", auth: true },
  { href: "/profile", icon: User, label: "Account", auth: true },
];

export function BottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const visibleItems = navItems.filter((item) => !item.auth || session);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-border safe-area-bottom shadow-[0_-1px_3px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-around h-14 px-2">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 py-1.5 transition-colors duration-200",
                isActive ? "text-brand" : "text-muted-foreground"
              )}
            >
              <item.icon className="w-5 h-5" strokeWidth={isActive ? 2.2 : 2} />
              <span className="text-[10px] font-medium leading-none">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
