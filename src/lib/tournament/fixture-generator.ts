import type { LeagueStructure } from "@/generated/prisma/client";

export interface TieFixture {
  homeTeamIndex: number;
  awayTeamIndex: number;
  round: number;
  tieNumber: number;
  nextTieNumber?: number;
  bracketPosition?: number;
}

/**
 * Generate fixtures for a SINGLE round of Round Robin.
 * Uses the circle method for balanced scheduling.
 *
 * For RR 2.0 (double), the `played` map should only track DIRECTIONAL matchups:
 *   played.get(A).has(B) means "A was HOME vs B" — so B can still be HOME vs A.
 * For regular RR, it tracks both directions.
 */
export function generateRoundRobinRound(
  teamCount: number,
  round: number,
  played: Map<number, Set<number>>,
  isDouble: boolean = false
): TieFixture[] {
  const fixtures: TieFixture[] = [];
  let tieNum = 1;

  const teams = Array.from({ length: teamCount }, (_, i) => i);
  if (teams.length % 2 !== 0) teams.push(-1); // bye

  const n = teams.length;

  // Rotate (round - 1) times from initial position
  const rotated = [teams[0]];
  const rest = teams.slice(1);
  for (let r = 0; r < round - 1; r++) {
    const last = rest.pop()!;
    rest.unshift(last);
  }
  rotated.push(...rest);

  for (let i = 0; i < n / 2; i++) {
    let home = rotated[i];
    let away = rotated[n - 1 - i];
    if (home === -1 || away === -1) continue; // skip byes

    // Check if this exact directional matchup already happened
    const homeOpps = played.get(home) ?? new Set();
    if (homeOpps.has(away)) {
      if (isDouble) {
        // For RR 2.0: try swapping home/away (reverse fixture)
        const awayOpps = played.get(away) ?? new Set();
        if (awayOpps.has(home)) {
          continue; // Both directions already played, skip
        }
        // Swap: away team is now home
        [home, away] = [away, home];
      } else {
        continue; // Regular RR: already played, skip
      }
    }

    fixtures.push({
      homeTeamIndex: home,
      awayTeamIndex: away,
      round,
      tieNumber: tieNum++,
    });
  }

  return fixtures;
}

/**
 * Calculate total rounds for regular Round Robin.
 */
export function getTotalRoundsRR(teamCount: number): number {
  return teamCount % 2 === 0 ? teamCount - 1 : teamCount;
}

/**
 * Calculate total rounds for Double Round Robin (2x regular).
 */
export function getTotalRoundsDoubleRR(teamCount: number): number {
  return getTotalRoundsRR(teamCount) * 2;
}

/**
 * Generate Knockout bracket with seeding support.
 * seeds: array of team indices for positions 1-4 (can be partial).
 */
export function generateKnockout(
  teamCount: number,
  seeds: number[] = []
): TieFixture[] {
  const bracketSize = Math.pow(2, Math.ceil(Math.log2(teamCount)));
  const totalRounds = Math.log2(bracketSize);
  const fixtures: TieFixture[] = [];
  let tieNum = 1;

  // Build bracket positions
  const positions: (number | -1 | -2)[] = new Array(bracketSize).fill(-2);

  // Place seeds: 1 top, 2 bottom, 3&4 opposite quarters
  if (seeds[0] !== undefined) positions[0] = seeds[0];
  if (seeds[1] !== undefined) positions[bracketSize - 1] = seeds[1];
  if (seeds[2] !== undefined) positions[bracketSize / 2] = seeds[2];
  if (seeds[3] !== undefined) positions[bracketSize / 2 - 1] = seeds[3];

  // Fill remaining with unseeded teams
  const placedTeams = new Set(seeds.filter((s) => s !== undefined));
  const unseeded = Array.from({ length: teamCount }, (_, i) => i).filter(
    (i) => !placedTeams.has(i)
  );

  let unseededIdx = 0;
  for (let i = 0; i < bracketSize; i++) {
    if (positions[i] === -2) {
      if (unseededIdx < unseeded.length) {
        positions[i] = unseeded[unseededIdx++];
      } else {
        positions[i] = -1; // bye
      }
    }
  }

  // First round
  const firstRoundMatches = bracketSize / 2;
  for (let i = 0; i < firstRoundMatches; i++) {
    fixtures.push({
      homeTeamIndex: positions[i * 2] as number,
      awayTeamIndex: positions[i * 2 + 1] as number,
      round: 1,
      tieNumber: tieNum++,
      bracketPosition: i,
    });
  }

  // Subsequent rounds
  for (let round = 2; round <= totalRounds; round++) {
    const roundMatches = bracketSize / Math.pow(2, round);
    for (let i = 0; i < roundMatches; i++) {
      fixtures.push({
        homeTeamIndex: -2, // TBD
        awayTeamIndex: -2,
        round,
        tieNumber: tieNum++,
        bracketPosition: i,
      });
    }
  }

  // Link winners to next round
  let prevStart = 0;
  for (let round = 1; round < totalRounds; round++) {
    const prevCount = bracketSize / Math.pow(2, round);
    const nextStart = prevStart + prevCount;

    for (let i = 0; i < prevCount; i += 2) {
      const nextIdx = nextStart + Math.floor(i / 2);
      fixtures[prevStart + i].nextTieNumber = fixtures[nextIdx].tieNumber;
      fixtures[prevStart + i + 1].nextTieNumber = fixtures[nextIdx].tieNumber;
    }

    prevStart = nextStart;
  }

  return fixtures;
}
