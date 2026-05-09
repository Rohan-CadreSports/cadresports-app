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
    return { valid: true };
  },

  determineWinner(scoreData: unknown): "home" | "away" | "draw" {
    const data = scoreData as FootballScore;
    if (data.home > data.away) return "home";
    if (data.away > data.home) return "away";
    return "draw";
  },

  getDisplayScore(scoreData: unknown): string {
    const data = scoreData as FootballScore;
    return `${data.home}-${data.away}`;
  },

  getDetailedScore(scoreData: unknown): string {
    const data = scoreData as FootballScore;
    return `${data.home}-${data.away}`;
  },
};
