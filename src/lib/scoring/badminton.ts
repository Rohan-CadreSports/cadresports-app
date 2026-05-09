import type { ScoreAdapter, BadmintonScore, BadmintonSet } from "./types";

function isValidSet(set: BadmintonSet): boolean {
  const { home, away } = set;
  if (!Number.isInteger(home) || !Number.isInteger(away)) return false;
  if (home < 0 || away < 0) return false;

  const maxScore = Math.max(home, away);
  const minScore = Math.min(home, away);

  if (maxScore === 30) return minScore >= 29;
  if (maxScore >= 21) return maxScore - minScore >= 2;
  return false;
}

function setWinner(set: BadmintonSet): "home" | "away" {
  return set.home > set.away ? "home" : "away";
}

export const badmintonScorer: ScoreAdapter = {
  sportSlug: "badminton",

  validateScore(scoreData: unknown): { valid: boolean; error?: string } {
    const data = scoreData as BadmintonScore;
    if (!data?.sets || !Array.isArray(data.sets)) {
      return { valid: false, error: "Missing sets data" };
    }

    if (data.sets.length < 2 || data.sets.length > 3) {
      return { valid: false, error: "Best of 3: must have 2 or 3 sets" };
    }

    for (let i = 0; i < data.sets.length; i++) {
      if (!isValidSet(data.sets[i])) {
        return { valid: false, error: `Invalid score in set ${i + 1}. Must reach 21 (win by 2, max 30).` };
      }
    }

    let homeWins = 0;
    let awayWins = 0;
    for (const set of data.sets) {
      if (setWinner(set) === "home") homeWins++;
      else awayWins++;
    }

    if (data.sets.length === 3 && (homeWins === 0 || awayWins === 0)) {
      return { valid: false, error: "3rd set played but one side won both first sets" };
    }

    if (Math.max(homeWins, awayWins) < 2) {
      return { valid: false, error: "Match not complete: no player has won 2 sets" };
    }

    return { valid: true };
  },

  determineWinner(scoreData: unknown): "home" | "away" | "draw" {
    const data = scoreData as BadmintonScore;
    let homeWins = 0;
    let awayWins = 0;
    for (const set of data.sets) {
      if (setWinner(set) === "home") homeWins++;
      else awayWins++;
    }
    return homeWins > awayWins ? "home" : "away";
  },

  getDisplayScore(scoreData: unknown): string {
    const data = scoreData as BadmintonScore;
    let homeWins = 0;
    let awayWins = 0;
    for (const set of data.sets) {
      if (setWinner(set) === "home") homeWins++;
      else awayWins++;
    }
    return `${homeWins}-${awayWins}`;
  },

  getDetailedScore(scoreData: unknown): string {
    const data = scoreData as BadmintonScore;
    return data.sets.map((s) => `${s.home}-${s.away}`).join(", ");
  },
};
