"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import QRCode from "qrcode";
import { Share2, Download, Loader2 } from "lucide-react";

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
  /** Pre-generated QR code data URL (from server) for instant render */
  qrDataUrl?: string;
}

export function PlayerCard({ player, stats, qrDataUrl: initialQr }: PlayerCardProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>(initialQr || "");
  const [busy, setBusy] = useState<"share" | "save" | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const profileUrl = typeof window !== "undefined"
    ? `${window.location.origin}/players/${player.id}`
    : `/players/${player.id}`;

  // Only generate client-side if not provided by server
  useEffect(() => {
    if (!initialQr) {
      QRCode.toDataURL(profileUrl, {
        width: 120,
        margin: 1,
        color: { dark: "#1A1A1A", light: "#FFFEF7" },
        errorCorrectionLevel: "M",
      }).then(setQrDataUrl);
    }
  }, [profileUrl, initialQr]);

  const memberSince = new Date(player.createdAt).toLocaleDateString("en-IN", {
    month: "short",
    year: "numeric",
  });

  const renderCanvas = useCallback(async () => {
    if (!cardRef.current) throw new Error("Card not rendered");
    const html2canvas = (await import("html2canvas-pro")).default;
    return html2canvas(cardRef.current, {
      scale: 3,
      backgroundColor: "#FFFEF7",
      useCORS: true,
    });
  }, []);

  async function handleShare() {
    setBusy("share");
    try {
      const canvas = await renderCanvas();
      const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
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

  async function handleSave(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setBusy("save");
    try {
      const canvas = await renderCanvas();
      // Convert to blob for reliable download
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), "image/png");
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `${player.name.replace(/\s+/g, "-")}-cadresports-card.png`;
      a.target = "_self";
      document.body.appendChild(a);
      a.click();
      // Delay cleanup so browser has time to process
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 3000);
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
        className="relative w-full bg-[#FFFEF7] rounded-[10px] border border-border overflow-hidden"
        style={{ aspectRatio: "1.586" }}
      >
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-brand" />

        <div className="flex flex-col justify-between h-full p-4 sm:p-5 pt-4 sm:pt-5">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-2">
                <img src="/logo.png" alt="" className="w-4 h-4 sm:w-5 sm:h-5 rounded" />
                <span className="text-[9px] sm:text-[10px] tracking-soho font-semibold uppercase text-muted-foreground">
                  CadreSports
                </span>
              </div>
              <h2 className="font-serif text-xl sm:text-2xl leading-tight tracking-tight truncate">{player.name}</h2>
              {player.city && (
                <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">{player.city}</p>
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

          <div className="flex items-end justify-between mt-auto">
            <div className="flex gap-4 sm:gap-5">
              {stats && (
                <>
                  <div>
                    <p className="text-lg sm:text-xl font-bold tabular-nums">{stats.leaguesPlayed}</p>
                    <p className="text-[8px] sm:text-[9px] tracking-soho uppercase text-muted-foreground">Leagues</p>
                  </div>
                  <div>
                    <p className="text-lg sm:text-xl font-bold tabular-nums">{stats.matchesPlayed}</p>
                    <p className="text-[8px] sm:text-[9px] tracking-soho uppercase text-muted-foreground">Matches</p>
                  </div>
                  <div>
                    <p className="text-lg sm:text-xl font-bold tabular-nums">{stats.wins}</p>
                    <p className="text-[8px] sm:text-[9px] tracking-soho uppercase text-muted-foreground">Wins</p>
                  </div>
                </>
              )}
            </div>
            <div className="text-right">
              <p className="text-[8px] sm:text-[9px] tracking-soho uppercase text-muted-foreground">Since</p>
              <p className="text-[11px] sm:text-xs font-semibold">{memberSince}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-2 mt-3">
        <button
          type="button"
          onClick={handleShare}
          disabled={busy !== null}
          className="flex items-center justify-center gap-2 h-10 bg-brand text-white text-[13px] font-medium rounded-[8px] active:scale-[0.97] transition-all disabled:opacity-50"
        >
          {busy === "share" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
          Share
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={busy !== null}
          className="flex items-center justify-center gap-2 h-10 border border-border text-foreground text-[13px] font-medium rounded-[8px] active:scale-[0.97] transition-all disabled:opacity-50"
        >
          {busy === "save" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Download PNG
        </button>
      </div>
    </div>
  );
}
