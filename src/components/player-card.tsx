"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Share2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PlayerCardProps {
  player: {
    id: string;
    name: string;
    city?: string | null;
    gender?: string | null;
    role: string;
    createdAt: string;
    favoriteSports?: string[];
    image?: string | null;
  };
  stats?: {
    leaguesPlayed: number;
    matchesPlayed: number;
    wins: number;
  };
}

export function PlayerCard({ player, stats }: PlayerCardProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const cardRef = useRef<HTMLDivElement>(null);

  const profileUrl = typeof window !== "undefined"
    ? `${window.location.origin}/players/${player.id}`
    : `/players/${player.id}`;

  useEffect(() => {
    QRCode.toDataURL(profileUrl, {
      width: 120,
      margin: 1,
      color: { dark: "#1A1A1A", light: "#F9F8F4" },
      errorCorrectionLevel: "M",
    }).then(setQrDataUrl);
  }, [profileUrl]);

  const memberSince = new Date(player.createdAt).toLocaleDateString("en-IN", {
    month: "short",
    year: "numeric",
  });

  async function handleShare() {
    const shareData = {
      title: `${player.name} — CadreSports`,
      text: `Check out ${player.name}'s player profile on CadreSports`,
      url: profileUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // user cancelled
      }
    } else {
      await navigator.clipboard.writeText(profileUrl);
      alert("Profile link copied!");
    }
  }

  async function handleDownload() {
    if (!cardRef.current) return;
    // Dynamically import html2canvas only when needed
    const html2canvas = (await import("html2canvas-pro")).default;
    const canvas = await html2canvas(cardRef.current, {
      scale: 3,
      backgroundColor: "#F9F8F4",
      useCORS: true,
    });
    const link = document.createElement("a");
    link.download = `${player.name.replace(/\s+/g, "-")}-cadresports-card.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  return (
    <div className="space-y-4">
      {/* The Card */}
      <div
        ref={cardRef}
        className="relative w-full max-w-[380px] mx-auto bg-[#F9F8F4] border border-border overflow-hidden"
        style={{ aspectRatio: "1.586" }}
      >
        {/* Top accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-brand" />

        {/* Content */}
        <div className="flex flex-col justify-between h-full p-5 pt-5">
          {/* Header row */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              {/* Logo + brand */}
              <div className="flex items-center gap-1.5 mb-3">
                <img src="/logo.png" alt="" className="w-5 h-5 rounded" />
                <span className="text-[10px] tracking-soho font-sans font-semibold uppercase text-muted-foreground">
                  CadreSports
                </span>
              </div>
              {/* Player name */}
              <h2 className="font-serif text-2xl leading-tight tracking-tight truncate">{player.name}</h2>
              {player.city && (
                <p className="text-xs text-muted-foreground font-sans mt-0.5">{player.city}</p>
              )}
            </div>

            {/* QR Code */}
            {qrDataUrl && (
              <div className="shrink-0 ml-3">
                <img src={qrDataUrl} alt="QR Code" className="w-[72px] h-[72px]" />
              </div>
            )}
          </div>

          {/* Stats row */}
          <div className="flex items-end justify-between mt-auto">
            <div className="flex gap-5">
              {stats && (
                <>
                  <div>
                    <p className="text-xl font-bold tabular-nums">{stats.leaguesPlayed}</p>
                    <p className="text-[9px] tracking-soho font-sans uppercase text-muted-foreground">Leagues</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold tabular-nums">{stats.matchesPlayed}</p>
                    <p className="text-[9px] tracking-soho font-sans uppercase text-muted-foreground">Matches</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold tabular-nums">{stats.wins}</p>
                    <p className="text-[9px] tracking-soho font-sans uppercase text-muted-foreground">Wins</p>
                  </div>
                </>
              )}
            </div>
            <div className="text-right">
              <p className="text-[9px] tracking-soho font-sans uppercase text-muted-foreground">Member since</p>
              <p className="text-xs font-semibold font-sans">{memberSince}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 max-w-[380px] mx-auto">
        <Button variant="outline" size="sm" className="flex-1" onClick={handleShare}>
          <Share2 className="w-4 h-4 mr-1.5" />
          Share
        </Button>
        <Button variant="outline" size="sm" className="flex-1" onClick={handleDownload}>
          <Download className="w-4 h-4 mr-1.5" />
          Save Card
        </Button>
      </div>
    </div>
  );
}
