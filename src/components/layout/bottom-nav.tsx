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
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", auth: true },
  { href: "/profile", icon: User, label: "Profile", auth: true },
];

export function BottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const visibleItems = navItems.filter((item) => !item.auth || session);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden backdrop-blur-surface border-t border-border-light safe-area-bottom">
      <div className="flex items-center justify-around h-14 px-2">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 rounded-xl transition-all duration-200 press-effect",
                isActive ? "text-brand" : "text-muted-foreground"
              )}
            >
              <item.icon className="w-[22px] h-[22px]" strokeWidth={isActive ? 2.5 : 1.8} />
              <span className="text-[11px] font-semibold leading-none">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
