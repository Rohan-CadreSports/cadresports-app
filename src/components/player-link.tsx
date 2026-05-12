import Link from "next/link";
import { cn } from "@/lib/utils";

interface PlayerLinkProps {
  id: string;
  name: string;
  className?: string;
}

export function PlayerLink({ id, name, className }: PlayerLinkProps) {
  return (
    <Link
      href={`/players/${id}`}
      className={cn(
        "inline-action text-inherit hover:text-brand transition-colors duration-150 underline decoration-brand/0 hover:decoration-brand/40 underline-offset-2",
        className
      )}
    >
      {name}
    </Link>
  );
}

export function PlayerAvatar({ id, name, size = "sm", className }: PlayerLinkProps & { size?: "xs" | "sm" | "md" }) {
  const sizes = {
    xs: "w-6 h-6 text-xs",
    sm: "w-7 h-7 text-xs",
    md: "w-9 h-9 text-sm",
  };

  return (
    <Link
      href={`/players/${id}`}
      className={cn(
        "inline-action rounded-full flex items-center justify-center font-bold text-white bg-brand shrink-0 hover:ring-2 hover:ring-brand/30 transition-all duration-150",
        sizes[size],
        className
      )}
      title={name}
    >
      {name[0]?.toUpperCase() ?? "?"}
    </Link>
  );
}
