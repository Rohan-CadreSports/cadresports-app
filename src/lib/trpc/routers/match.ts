import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, protectedProcedure, requireRole } from "../server";
import { getScorer, calculateTiePoints } from "@/lib/scoring";
import { verifyTieOwnership } from "./_helpers";
import { logAudit } from "@/lib/audit";

export const matchRouter = router({
  // Get all ties for a division
  getTiesByDivision: publicProcedure
    .input(z.object({ divisionId: z.string(), round: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = { divisionId: input.divisionId };
      if (input.round) where.round = input.round;

      return ctx.db.tie.findMany({
        where,
        include: {
          homeTeam: { select: { id: true, name: true } },
          awayTeam: { select: { id: true, name: true } },
          winner: { select: { id: true, name: true } },
          matches: {
            include: {
              scores: { orderBy: { createdAt: "desc" }, take: 1 },
            },
            orderBy: { matchNumber: "asc" },
          },
          lineups: {
            select: { teamId: true, submitted: true },
          },
        },
        orderBy: [{ round: "asc" }, { tieNumber: "asc" }],
      });
    }),

  // Get tie detail for lineup submission (captain's view)
  getTieDetail: protectedProcedure
    .input(z.object({ tieId: z.string() }))
    .query(async ({ ctx, input }) => {
      const tie = await ctx.db.tie.findUniqueOrThrow({
        where: { id: input.tieId },
        include: {
          homeTeam: { select: { id: true, name: true, captainId: true } },
          awayTeam: { select: { id: true, name: true, captainId: true } },
          matches: { orderBy: { matchNumber: "asc" }, select: { id: true, matchNumber: true, format: true, status: true } },
          lineups: { select: { teamId: true, submitted: true } },
        },
      });

      // Determine which team the current user captains
      let myTeam: { id: string; name: string } | null = null;
      let teamIdForRoster: string | null = null;

      if (tie.homeTeam.captainId === ctx.session.user.id) {
        myTeam = { id: tie.homeTeam.id, name: tie.homeTeam.name };
        teamIdForRoster = tie.homeTeam.id;
      } else if (tie.awayTeam.captainId === ctx.session.user.id) {
        myTeam = { id: tie.awayTeam.id, name: tie.awayTeam.name };
        teamIdForRoster = tie.awayTeam.id;
      }

      // Also allow TO (only if they own this league) and Super Admin
      if (!myTeam) {
        const division = await ctx.db.tie.findUniqueOrThrow({
          where: { id: input.tieId },
          select: { division: { select: { league: { select: { operatorId: true } } } } },
        });
        if (
          ctx.session.user.role === "SUPER_ADMIN" ||
          (ctx.session.user.role === "TOURNAMENT_OPERATOR" && division.division.league.operatorId === ctx.session.user.id)
        ) {
          myTeam = { id: tie.homeTeam.id, name: tie.homeTeam.name };
          teamIdForRoster = tie.homeTeam.id;
        }
      }

      const roster = teamIdForRoster
        ? await ctx.db.teamPlayer.findMany({
            where: { teamId: teamIdForRoster, isActive: true },
            include: { player: { select: { id: true, name: true } } },
          }).then((tp) => tp.map((t) => t.player))
        : [];

      return {
        tie: {
          id: tie.id,
          round: tie.round,
          homeTeamName: tie.homeTeam.name,
          awayTeamName: tie.awayTeam.name,
          lineups: tie.lineups,
        },
        myTeam,
        roster,
        matches: tie.matches,
      };
    }),

  // Submit score for a single sub-match within a tie
  submitScore: protectedProcedure
    .use(requireRole("TOURNAMENT_OPERATOR"))
    .input(
      z.object({
        matchId: z.string(),
        scoreData: z.any(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const match = await ctx.db.match.findUniqueOrThrow({
        where: { id: input.matchId },
        include: {
          tie: {
            include: {
              division: { include: { league: { include: { sport: true } } } },
              lineups: { select: { teamId: true, submitted: true } },
              homeTeam: { select: { id: true } },
              awayTeam: { select: { id: true } },
            },
          },
          scores: true,
        },
      });

      await verifyTieOwnership(ctx.db, match.tieId, ctx.session.user.id, ctx.session.user.role);

      // Check lineup submitted
      const tie = match.tie;
      const homeLineup = tie.lineups.find((l) => l.teamId === tie.homeTeam.id);
      const awayLineup = tie.lineups.find((l) => l.teamId === tie.awayTeam.id);

      if (!homeLineup?.submitted || !awayLineup?.submitted) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Both teams must submit lineups before scores can be entered",
        });
      }

      if (match.status !== "SCHEDULED" && match.status !== "LIVE") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot submit score for a match with status: ${match.status}`,
        });
      }

      // Can't score if tie is already walkover
      if (tie.status === "WALKOVER") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot submit score for a walkover tie" });
      }

      const sportSlug = tie.division.league.sport.slug;
      const scorer = getScorer(sportSlug);

      const validation = scorer.validateScore(input.scoreData);
      if (!validation.valid) {
        throw new TRPCError({ code: "BAD_REQUEST", message: validation.error || "Invalid score" });
      }

      const winner = scorer.determineWinner(input.scoreData);
      const winnerId = winner === "home" ? tie.homeTeam.id : winner === "away" ? tie.awayTeam.id : null;

      // Create or update score
      const existingScore = match.scores[0];
      if (existingScore) {
        if (existingScore.editCount >= 1) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Score has already been edited once. No more edits allowed.",
          });
        }
        await ctx.db.matchScore.update({
          where: { id: existingScore.id },
          data: {
            scoreData: input.scoreData,
            editCount: { increment: 1 },
            enteredById: ctx.session.user.id,
          },
        });
      } else {
        await ctx.db.matchScore.create({
          data: {
            matchId: input.matchId,
            scoreData: input.scoreData,
            enteredById: ctx.session.user.id,
          },
        });
      }

      // Update match status
      await ctx.db.match.update({
        where: { id: input.matchId },
        data: { status: "COMPLETED", winnerId },
      });

      // Audit log
      await logAudit({
        action: existingScore ? "SCORE_EDITED" : "SCORE_ENTERED",
        userId: ctx.session.user.id,
        userName: ctx.session.user.name || "Unknown",
        entityType: "match",
        entityId: input.matchId,
        before: existingScore?.scoreData ?? null,
        after: input.scoreData,
        metadata: { tieId: match.tieId, winnerId, sport: sportSlug },
      });

      // Check if all matches in this tie are complete, then finalize tie
      await finalizeTieIfComplete(ctx.db, match.tieId);

      return { winnerId, winner };
    }),

  // Walkover: team forfeits entire tie
  walkover: protectedProcedure
    .use(requireRole("TOURNAMENT_OPERATOR"))
    .input(
      z.object({
        tieId: z.string(),
        forfeitingTeamId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await verifyTieOwnership(ctx.db, input.tieId, ctx.session.user.id, ctx.session.user.role);

      const tie = await ctx.db.tie.findUniqueOrThrow({
        where: { id: input.tieId },
        include: {
          matches: true,
          division: { include: { league: true } },
        },
      });

      // Can only walkover a SCHEDULED tie
      if (tie.status !== "SCHEDULED") {
        throw new TRPCError({ code: "BAD_REQUEST", message: `Cannot mark walkover for a tie with status: ${tie.status}` });
      }

      // Check no matches have been scored already
      const hasScores = tie.matches.some((m) => m.status === "COMPLETED");
      if (hasScores) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot mark walkover — some matches already have scores" });
      }

      if (input.forfeitingTeamId !== tie.homeTeamId && input.forfeitingTeamId !== tie.awayTeamId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid forfeiting team" });
      }

      const winningTeamId = input.forfeitingTeamId === tie.homeTeamId ? tie.awayTeamId : tie.homeTeamId;
      const totalMatches = tie.matches.length;
      const isWinnerHome = winningTeamId === tie.homeTeamId;

      // Mark all matches as walkover
      await ctx.db.match.updateMany({
        where: { tieId: input.tieId },
        data: { status: "WALKOVER", winnerId: winningTeamId },
      });

      // Update tie
      await ctx.db.tie.update({
        where: { id: input.tieId },
        data: {
          status: "WALKOVER",
          isWalkover: true,
          walkoverTeamId: input.forfeitingTeamId,
          winnerId: winningTeamId,
          homePoints: isWinnerHome ? totalMatches + 1 : 0, // all matches + bonus
          awayPoints: isWinnerHome ? 0 : totalMatches + 1,
          playedAt: new Date(),
        },
      });

      // Update standings
      await updateStandingsForTie(ctx.db, tie.divisionId, winningTeamId, input.forfeitingTeamId, totalMatches, 0, true);

      await logAudit({
        action: "WALKOVER",
        userId: ctx.session.user.id,
        userName: ctx.session.user.name || "Unknown",
        entityType: "tie",
        entityId: input.tieId,
        after: { forfeitingTeamId: input.forfeitingTeamId, winningTeamId },
      });

      return { winnerId: winningTeamId };
    }),

  // Get standings
  getStandings: publicProcedure
    .input(z.object({ divisionId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.standing.findMany({
        where: { divisionId: input.divisionId },
        include: { team: { select: { id: true, name: true } } },
        orderBy: [{ totalPoints: "desc" }, { matchesWon: "desc" }],
      });
    }),

  // T-008: Rebuild all standings for a division from scratch
  rebuildStandings: protectedProcedure
    .use(requireRole("SUPER_ADMIN"))
    .input(z.object({ divisionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Zero out all standings
      await ctx.db.standing.updateMany({
        where: { divisionId: input.divisionId },
        data: { tiesPlayed: 0, tiesWon: 0, tiesLost: 0, matchesWon: 0, matchesLost: 0, bonusPoints: 0, totalPoints: 0, rank: 0 },
      });

      // Get all completed ties
      const ties = await ctx.db.tie.findMany({
        where: { divisionId: input.divisionId, status: { in: ["COMPLETED", "WALKOVER"] } },
        include: { matches: { include: { scores: { take: 1 } } } },
      });

      // Recalculate from each tie
      for (const tie of ties) {
        if (tie.isWalkover) {
          const winnerId = tie.winnerId!;
          const loserId = tie.homeTeamId === winnerId ? tie.awayTeamId : tie.homeTeamId;
          await updateStandingsForTie(ctx.db, input.divisionId, winnerId, loserId, tie.matches.length, 0, true);
        } else {
          let homeWins = 0;
          let awayWins = 0;
          for (const match of tie.matches) {
            if (match.winnerId === tie.homeTeamId) homeWins++;
            else if (match.winnerId === tie.awayTeamId) awayWins++;
          }
          await updateStandingsForTie(ctx.db, input.divisionId, tie.homeTeamId, tie.awayTeamId, homeWins, awayWins, false);
        }
      }

      // Recalculate ranks
      const standings = await ctx.db.standing.findMany({
        where: { divisionId: input.divisionId },
        orderBy: [{ totalPoints: "desc" }, { matchesWon: "desc" }],
      });
      await Promise.all(standings.map((s, idx) => ctx.db.standing.update({ where: { id: s.id }, data: { rank: idx + 1 } })));

      await logAudit({
        action: "STANDINGS_REBUILD",
        userId: ctx.session.user.id,
        userName: ctx.session.user.name || "Unknown",
        entityType: "division",
        entityId: input.divisionId,
        metadata: { tiesProcessed: ties.length },
      });

      return { rebuiltFrom: ties.length };
    }),

  // T-014: Admin override for locked scores
  adminOverrideScore: protectedProcedure
    .use(requireRole("SUPER_ADMIN"))
    .input(z.object({ matchId: z.string(), scoreData: z.any() }))
    .mutation(async ({ ctx, input }) => {
      const match = await ctx.db.match.findUniqueOrThrow({
        where: { id: input.matchId },
        include: {
          scores: { take: 1 },
          tie: { include: { division: { include: { league: { include: { sport: true } } } } } },
        },
      });

      const sportSlug = match.tie.division.league.sport.slug;
      const scorer = getScorer(sportSlug);
      const validation = scorer.validateScore(input.scoreData);
      if (!validation.valid) throw new TRPCError({ code: "BAD_REQUEST", message: validation.error || "Invalid score" });

      const winner = scorer.determineWinner(input.scoreData);
      const winnerId = winner === "home" ? match.tie.homeTeamId : winner === "away" ? match.tie.awayTeamId : null;

      const oldScore = match.scores[0];

      if (oldScore) {
        // Admin override — bypass edit count
        await ctx.db.matchScore.update({
          where: { id: oldScore.id },
          data: { scoreData: input.scoreData, enteredById: ctx.session.user.id },
        });
      } else {
        await ctx.db.matchScore.create({
          data: { matchId: input.matchId, scoreData: input.scoreData, enteredById: ctx.session.user.id },
        });
      }

      await ctx.db.match.update({
        where: { id: input.matchId },
        data: { status: "COMPLETED", winnerId },
      });

      await logAudit({
        action: "ADMIN_SCORE_OVERRIDE",
        userId: ctx.session.user.id,
        userName: ctx.session.user.name || "Unknown",
        entityType: "match",
        entityId: input.matchId,
        before: oldScore?.scoreData,
        after: input.scoreData,
      });

      return { winnerId, winner };
    }),
});

// Finalize a tie after all sub-matches are scored
async function finalizeTieIfComplete(db: typeof import("@/lib/db").db, tieId: string) {
  const tie = await db.tie.findUniqueOrThrow({
    where: { id: tieId },
    include: {
      matches: { include: { scores: { take: 1 } } },
      division: { include: { league: true } },
    },
  });

  // Already finalized — skip
  if (tie.status === "COMPLETED" || tie.status === "WALKOVER") return;

  const allCompleted = tie.matches.every(
    (m) => m.status === "COMPLETED" || m.status === "WALKOVER"
  );
  if (!allCompleted) return;

  // Count match wins
  let homeWins = 0;
  let awayWins = 0;
  for (const match of tie.matches) {
    if (match.winnerId === tie.homeTeamId) homeWins++;
    else if (match.winnerId === tie.awayTeamId) awayWins++;
  }

  const totalMatches = tie.matches.length;
  const tiePoints = calculateTiePoints(totalMatches, homeWins, awayWins);

  const winnerId = tiePoints.tieWinner === "home"
    ? tie.homeTeamId
    : tiePoints.tieWinner === "away"
    ? tie.awayTeamId
    : null; // draw — no winner

  await db.tie.update({
    where: { id: tieId },
    data: {
      status: "COMPLETED",
      winnerId,
      homePoints: tiePoints.homePoints,
      awayPoints: tiePoints.awayPoints,
      playedAt: new Date(),
    },
  });

  // Update standings
  await updateStandingsForTie(
    db,
    tie.divisionId,
    tie.homeTeamId,
    tie.awayTeamId,
    homeWins,
    awayWins,
    false
  );
}

async function updateStandingsForTie(
  db: typeof import("@/lib/db").db,
  divisionId: string,
  homeTeamId: string,
  awayTeamId: string,
  homeMatchesWon: number,
  awayMatchesWon: number,
  isWalkover: boolean
) {
  const totalMatches = homeMatchesWon + awayMatchesWon;
  const homeBonus = (homeMatchesWon === totalMatches && totalMatches > 0) ? 1 : 0;
  const awayBonus = (awayMatchesWon === totalMatches && totalMatches > 0) ? 1 : 0;
  const homeWonTie = homeMatchesWon > awayMatchesWon;
  const awayWonTie = awayMatchesWon > homeMatchesWon;
  const isDraw = homeMatchesWon === awayMatchesWon;

  // Update home team
  await db.standing.upsert({
    where: { divisionId_teamId: { divisionId, teamId: homeTeamId } },
    create: {
      divisionId,
      teamId: homeTeamId,
      tiesPlayed: 1,
      tiesWon: homeWonTie ? 1 : 0,
      tiesLost: awayWonTie ? 1 : 0,
      matchesWon: homeMatchesWon,
      matchesLost: awayMatchesWon,
      bonusPoints: homeBonus,
      totalPoints: homeMatchesWon + homeBonus,
    },
    update: {
      tiesPlayed: { increment: 1 },
      tiesWon: { increment: homeWonTie ? 1 : 0 },
      tiesLost: { increment: awayWonTie ? 1 : 0 },
      matchesWon: { increment: homeMatchesWon },
      matchesLost: { increment: awayMatchesWon },
      bonusPoints: { increment: homeBonus },
      totalPoints: { increment: homeMatchesWon + homeBonus },
    },
  });

  // Update away team
  await db.standing.upsert({
    where: { divisionId_teamId: { divisionId, teamId: awayTeamId } },
    create: {
      divisionId,
      teamId: awayTeamId,
      tiesPlayed: 1,
      tiesWon: awayWonTie ? 1 : 0,
      tiesLost: homeWonTie ? 1 : 0,
      matchesWon: awayMatchesWon,
      matchesLost: homeMatchesWon,
      bonusPoints: awayBonus,
      totalPoints: awayMatchesWon + awayBonus,
    },
    update: {
      tiesPlayed: { increment: 1 },
      tiesWon: { increment: awayWonTie ? 1 : 0 },
      tiesLost: { increment: homeWonTie ? 1 : 0 },
      matchesWon: { increment: awayMatchesWon },
      matchesLost: { increment: homeMatchesWon },
      bonusPoints: { increment: awayBonus },
      totalPoints: { increment: awayMatchesWon + awayBonus },
    },
  });

  // Recalculate ranks
  const standings = await db.standing.findMany({
    where: { divisionId },
    orderBy: [{ totalPoints: "desc" }, { matchesWon: "desc" }],
  });

  await Promise.all(
    standings.map((s, idx) =>
      db.standing.update({ where: { id: s.id }, data: { rank: idx + 1 } })
    )
  );
}
