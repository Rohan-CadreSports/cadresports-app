import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, Calendar } from "lucide-react";
import { getSportImage } from "@/lib/sport-images";

interface LeagueCardData {
  id: string;
  slug: string;
  name: string;
  city: string | null;
  status: string;
  imageUrl?: string | null;
  startDate: string | null;
  endDate: string | null;
  registrationEnd?: string | null;
  genderRestriction: string;
  sport: { name: string; icon?: string | null };
  _count: { registrations: number };
}

function formatShortDate(date: string | null): string {
  if (!date) return "";
  const d = new Date(date);
  const day = d.getDate();
  const suffix = day === 1 || day === 21 || day === 31 ? "st" : day === 2 || day === 22 ? "nd" : day === 3 || day === 23 ? "rd" : "th";
  const month = d.toLocaleString("en-IN", { month: "short" });
  const year = `'${String(d.getFullYear()).slice(2)}`;
  return `${day}${suffix} ${month} ${year}`;
}

interface LeagueCardProps {
  league: LeagueCardData;
  index?: number;
  variant?: "carousel" | "grid";
  isYourCity?: boolean;
}

export function LeagueCard({ league, index = 0, variant = "carousel", isYourCity }: LeagueCardProps) {
  const isLive = league.status === "IN_PROGRESS";
  const isOpen = league.status === "REGISTRATION_OPEN";
  const imageUrl = league.imageUrl || getSportImage(league.sport.name, index);

  const card = (
    <div className={`rounded-[8px] border border-border bg-white overflow-hidden hover:shadow-[var(--shadow-md)] hover:border-brand transition-all duration-200 ${
      variant === "carousel" ? "min-w-[75vw] sm:min-w-[320px] snap-start" : "w-full"
    }`}>
      {/* Image */}
      <div className={`relative ${variant === "carousel" ? "aspect-[3/2]" : "aspect-[2.5/1]"} bg-gray-100 overflow-hidden`}>
        <Image
          src={imageUrl}
          alt={league.name}
          fill
          className="object-cover"
          sizes={variant === "carousel" ? "(max-width: 640px) 75vw, 320px" : "(max-width: 640px) 100vw, 600px"}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        <div className="absolute top-3 right-3">
          <Badge
            variant={isLive ? "success" : isOpen ? "info" : "default"}
          >
            {isLive ? "Live" : isOpen ? "Open" : "Completed"}
          </Badge>
        </div>
        <p className="absolute bottom-3 left-4 text-xs font-semibold uppercase text-white/90 tracking-wide">
          {league.sport.name}
        </p>
      </div>

      {/* Details */}
      <div className="p-4">
        <h3 className="text-[15px] font-semibold leading-snug truncate">{league.name}</h3>

        {(league.startDate || league.endDate) && (
          <div className="flex items-center gap-1.5 mt-2 text-muted-foreground">
            <Calendar className="w-3.5 h-3.5 text-brand" />
            <span className="text-sm">
              {formatShortDate(league.startDate)}
              {league.endDate && <> — {formatShortDate(league.endDate)}</>}
            </span>
          </div>
        )}

        {isOpen && league.registrationEnd && (
          <p className="text-xs text-amber-600 font-semibold mt-1.5">
            Register by {formatShortDate(league.registrationEnd)}
          </p>
        )}

        <div className="flex items-center gap-3 mt-2.5 text-sm text-muted-foreground">
          {league.city && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> {league.city}
              {isYourCity && <span className="text-brand font-medium text-xs ml-0.5">Your city</span>}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" /> {league._count.registrations}
          </span>
          {league.genderRestriction !== "OPEN" && (
            <Badge variant={league.genderRestriction === "WOMENS_ONLY" ? "danger" : "info"}>
              {league.genderRestriction === "WOMENS_ONLY" ? "Women's" : "Men's"}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <Link href={`/leagues/${league.slug}`} className={variant === "carousel" ? "min-w-[75vw] sm:min-w-[320px] snap-start" : "block"}>
      {card}
    </Link>
  );
}
