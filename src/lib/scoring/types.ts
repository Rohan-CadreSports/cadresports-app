export interface ScoreAdapter {
  sportSlug: string;
  validateScore(scoreData: unknown): { valid: boolean; error?: string };
  determineWinner(scoreData: unknown): "home" | "away" | "draw";
  getDisplayScore(scoreData: unknown): string;
  getDetailedScore(scoreData: unknown): string;
}

// Badminton types
export interface BadmintonSet {
  home: number;
  away: number;
}

export interface BadmintonScore {
  sets: BadmintonSet[];
}

// Football types
export interface FootballCard {
  playerName: string;
  type: "yellow" | "red";
  minute?: number;
}

export interface FootballScore {
  home: number;
  away: number;
  extraTime?: boolean;
  homeET?: number; // goals in extra time
  awayET?: number;
  homeCards?: FootballCard[];
  awayCards?: FootballCard[];
}

/**
 * Tie-level points calculation.
 * Points system: each match won = 1 point, clean sweep (win all) = +1 bonus.
 */
export interface TiePointsResult {
  homeMatchesWon: number;
  awayMatchesWon: number;
  homePoints: number;
  awayPoints: number;
  homeBonusPoints: number;
  awayBonusPoints: number;
  tieWinner: "home" | "away" | "draw";
}

export function calculateTiePoints(
  totalMatches: number,
  homeMatchesWon: number,
  awayMatchesWon: number
): TiePointsResult {
  const homeBonus = homeMatchesWon === totalMatches && totalMatches > 0 ? 1 : 0;
  const awayBonus = awayMatchesWon === totalMatches && totalMatches > 0 ? 1 : 0;

  let tieWinner: "home" | "away" | "draw";
  if (homeMatchesWon > awayMatchesWon) tieWinner = "home";
  else if (awayMatchesWon > homeMatchesWon) tieWinner = "away";
  else tieWinner = "draw";

  return {
    homeMatchesWon,
    awayMatchesWon,
    homePoints: homeMatchesWon + homeBonus,
    awayPoints: awayMatchesWon + awayBonus,
    homeBonusPoints: homeBonus,
    awayBonusPoints: awayBonus,
    tieWinner,
  };
}
