import type { ScoreAdapter } from "./types";
import { badmintonScorer } from "./badminton";
import { footballScorer } from "./football";

const scorers: Record<string, ScoreAdapter> = {
  badminton: badmintonScorer,
  football: footballScorer,
};

export function getScorer(sportSlug: string): ScoreAdapter {
  const scorer = scorers[sportSlug];
  if (!scorer) throw new Error(`No scoring adapter for sport: ${sportSlug}`);
  return scorer;
}

export { type ScoreAdapter, type BadmintonScore, type FootballScore, calculateTiePoints } from "./types";
