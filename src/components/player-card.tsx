"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Share2, ImageDown, Loader2 } from "lucide-react";

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
  const [busy, setBusy] = useState<"share" | "save" | null>(null);
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

  async function generateCardDataUrl(): Promise<string> {
    if (!cardRef.current) throw new Error("Card not rendered");
    const html2canvas = (await import("html2canvas-pro")).default;
    const canvas = await html2canvas(cardRef.current, {
      scale: 3,
      backgroundColor: "#F9F8F4",
      useCORS: true,
    });
    return canvas.toDataURL("image/jpeg", 0.92);
  }

  async function handleShare() {
    setBusy("share");
    try {
      const dataUrl = await generateCardDataUrl();
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File(
        [blob],
        `${player.name.replace(/\s+/g, "-")}-cadresports.jpg`,
        { type: "image/jpeg" }
      );

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `${player.name} — CadreSports`,
          text: `Check out ${player.name}'s profile on CadreSports\n${profileUrl}`,
        });
      } else if (navigator.share) {
        await navigator.share({
          title: `${player.name} — CadreSports`,
          text: `Check out ${player.name}'s profile on CadreSports`,
          url: profileUrl,
        });
      } else {
        await navigator.clipboard.writeText(profileUrl);
        alert("Profile link copied!");
      }
    } catch {
      // user cancelled
    } finally {
      setBusy(null);
    }
  }

  async function handleSave() {
    setBusy("save");
    try {
      const dataUrl = await generateCardDataUrl();
      // Open the image in a new tab — user can long-press to save on mobile
      // or right-click save on desktop. This is the most reliable cross-browser method.
      const w = window.open("");
      if (w) {
        w.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta name="viewport" content="width=device-width,initial-scale=1">
            <title>${player.name} — CadreSports Card</title>
            <style>
              body { margin: 0; background: #1A1A1A; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
              img { max-width: 100%; height: auto; display: block; }
              p { color: #888; text-align: center; font-family: system-ui; font-size: 14px; padding: 16px; }
            </style>
          </head>
          <body>
            <div>
              <img src="${dataUrl}" alt="${player.name} Card" />
              <p>Long press the image to save</p>
            </div>
          </body>
          </html>
        `);
        w.document.close();
      }
    } catch {
      // fallback
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="w-full">
      {/* The Card */}
      <div
        ref={cardRef}
        className="relative w-full bg-[#F9F8F4] border border-border overflow-hidden"
        style={{ aspectRatio: "1.586" }}
      >
        {/* Top accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-brand" />

        {/* Content */}
        <div className="flex flex-col justify-between h-full p-4 sm:p-5 pt-4 sm:pt-5">
          {/* Header row */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-2">
                <img src="/logo.png" alt="" className="w-4 h-4 sm:w-5 sm:h-5 rounded" />
                <span className="text-[9px] sm:text-[10px] tracking-soho font-sans font-semibold uppercase text-muted-foreground">
                  CadreSports
                </span>
              </div>
              <h2 className="font-serif text-xl sm:text-2xl leading-tight tracking-tight truncate">{player.name}</h2>
              {player.city && (
                <p className="text-[11px] sm:text-xs text-muted-foreground font-sans mt-0.5">{player.city}</p>
              )}
            </div>

            {qrDataUrl && (
              <a
                href={profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 ml-2 inline-action"
              >
                <img src={qrDataUrl} alt="QR" className="w-14 h-14 sm:w-[72px] sm:h-[72px]" />
              </a>
            )}
          </div>

          {/* Stats row */}
          <div className="flex items-end justify-between mt-auto">
            <div className="flex gap-4 sm:gap-5">
              {stats && (
                <>
                  <div>
                    <p className="text-lg sm:text-xl font-bold tabular-nums">{stats.leaguesPlayed}</p>
                    <p className="text-[8px] sm:text-[9px] tracking-soho font-sans uppercase text-muted-foreground">Leagues</p>
                  </div>
                  <div>
                    <p className="text-lg sm:text-xl font-bold tabular-nums">{stats.matchesPlayed}</p>
                    <p className="text-[8px] sm:text-[9px] tracking-soho font-sans uppercase text-muted-foreground">Matches</p>
                  </div>
                  <div>
                    <p className="text-lg sm:text-xl font-bold tabular-nums">{stats.wins}</p>
                    <p className="text-[8px] sm:text-[9px] tracking-soho font-sans uppercase text-muted-foreground">Wins</p>
                  </div>
                </>
              )}
            </div>
            <div className="text-right">
              <p className="text-[8px] sm:text-[9px] tracking-soho font-sans uppercase text-muted-foreground">Since</p>
              <p className="text-[11px] sm:text-xs font-semibold font-sans">{memberSince}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons — full width, big touch targets */}
      <div className="grid grid-cols-2 gap-2 mt-3">
        <button
          onClick={handleShare}
          disabled={busy !== null}
          className="flex items-center justify-center gap-2 h-12 bg-brand text-white font-sans text-sm font-semibold active:scale-[0.97] transition-all duration-150 disabled:opacity-50"
        >
          {busy === "share" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
          Share
        </button>
        <button
          onClick={handleSave}
          disabled={busy !== null}
          className="flex items-center justify-center gap-2 h-12 border border-border text-foreground font-sans text-sm font-semibold active:scale-[0.97] transition-all duration-150 disabled:opacity-50"
        >
          {busy === "save" ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageDown className="w-4 h-4" />}
          Save Card
        </button>
      </div>
    </div>
  );
}
