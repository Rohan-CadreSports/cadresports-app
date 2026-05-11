import type { ScoreAdapter, FootballScore } from "./types";

export const footballScorer: ScoreAdapter = {
  sportSlug: "football",

  validateScore(scoreData: unknown): { valid: boolean; error?: string } {
    const data = scoreData as FootballScore;
    if (data.home == null || data.away == null) {
      return { valid: false, error: "Missing home or away score" };
    }
    if (data.home < 0 || data.away < 0) {
      return { valid: false, error: "Scores cannot be negative" };
    }
    if (!Number.isInteger(data.home) || !Number.isInteger(data.away)) {
      return { valid: false, error: "Scores must be whole numbers" };
    }
    if (data.home > 50 || data.away > 50) {
      return { valid: false, error: "Score seems unrealistic (max 50)" };
    }
    if (data.extraTime) {
      if ((data.homeET ?? 0) < 0 || (data.awayET ?? 0) < 0) {
        return { valid: false, error: "Extra time goals cannot be negative" };
      }
    }
    return { valid: true };
  },

  determineWinner(scoreData: unknown): "home" | "away" | "draw" {
    const data = scoreData as FootballScore;
    const homeTotal = data.home + (data.extraTime ? (data.homeET ?? 0) : 0);
    const awayTotal = data.away + (data.extraTime ? (data.awayET ?? 0) : 0);
    if (homeTotal > awayTotal) return "home";
    if (awayTotal > homeTotal) return "away";
    return "draw";
  },

  getDisplayScore(scoreData: unknown): string {
    const data = scoreData as FootballScore;
    let score = `${data.home}-${data.away}`;
    if (data.extraTime && (data.homeET || data.awayET)) {
      score += ` (ET: ${data.homeET ?? 0}-${data.awayET ?? 0})`;
    }
    return score;
  },

  getDetailedScore(scoreData: unknown): string {
    const data = scoreData as FootballScore;
    let score = `${data.home}-${data.away}`;
    if (data.extraTime) {
      score += ` | ET: ${data.homeET ?? 0}-${data.awayET ?? 0}`;
    }
    const totalCards = (data.homeCards?.length ?? 0) + (data.awayCards?.length ?? 0);
    if (totalCards > 0) {
      score += ` | ${totalCards} card${totalCards !== 1 ? "s" : ""}`;
    }
    return score;
  },
};
