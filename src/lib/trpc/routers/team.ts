import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, requireRole } from "../server";
import { verifyDivisionOwnership, verifyTeamOwnership, verifyLeagueOwnership } from "./_helpers";

// Check if roster is locked (registration closed/in progress/completed)
async function checkRosterLock(
  db: typeof import("@/lib/db").db,
  teamId: string,
  userRole: string
) {
  if (userRole === "SUPER_ADMIN") return; // Super Admin can always modify
  const team = await db.team.findUniqueOrThrow({
    where: { id: teamId },
    include: { division: { include: { league: { select: { status: true } } } } },
  });
  const lockedStatuses = ["REGISTRATION_CLOSED", "IN_PROGRESS", "COMPLETED"];
  if (lockedStatuses.includes(team.division.league.status)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Roster is locked. Only Super Admin can modify rosters after registration closes.",
    });
  }
}

export const teamRouter = router({
  create: protectedProcedure
    .use(requireRole("TOURNAMENT_OPERATOR"))
    .input(
      z.object({
        name: z.string().min(2).max(50),
        divisionId: z.string(),
        captainId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await verifyDivisionOwnership(ctx.db, input.divisionId, ctx.session.user.id, ctx.session.user.role);

      // Check roster lock — no new teams after registration closes
      const divForLock = await ctx.db.division.findUniqueOrThrow({
        where: { id: input.divisionId },
        include: { league: { select: { status: true } } },
      });
      const lockedStatuses = ["REGISTRATION_CLOSED", "IN_PROGRESS", "COMPLETED"];
      if (lockedStatuses.includes(divForLock.league.status) && ctx.session.user.role !== "SUPER_ADMIN") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Cannot create teams after registration closes" });
      }

      const division = await ctx.db.division.findUniqueOrThrow({
        where: { id: input.divisionId },
        include: {
          league: { select: { maxTeamsPerDiv: true, minTeamSize: true, maxTeamSize: true } },
          _count: { select: { teams: true } },
        },
      });

      if (division._count.teams >= division.league.maxTeamsPerDiv) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `Division already has maximum ${division.league.maxTeamsPerDiv} teams` });
      }



      const team = await ctx.db.team.create({
        data: { name: input.name, divisionId: input.divisionId, captainId: input.captainId },
      });

      await ctx.db.teamPlayer.create({
        data: { teamId: team.id, playerId: input.captainId },
      });

      return team;
    }),

  addPlayer: protectedProcedure
    .input(z.object({ teamId: z.string(), playerId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await checkRosterLock(ctx.db, input.teamId, ctx.session.user.role);
      const team = await ctx.db.team.findUniqueOrThrow({
        where: { id: input.teamId },
        include: {
          division: { include: { league: { select: { operatorId: true, maxTeamSize: true } } } },
          _count: { select: { players: true } },
        },
      });

      const isAuthorized =
        team.captainId === ctx.session.user.id ||
        team.division.league.operatorId === ctx.session.user.id ||
        ctx.session.user.role === "SUPER_ADMIN";

      if (!isAuthorized) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
      }

      if (team._count.players >= team.division.league.maxTeamSize) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `Team is full (max ${team.division.league.maxTeamSize} players)` });
      }

      const existing = await ctx.db.teamPlayer.findUnique({
        where: { teamId_playerId: { teamId: input.teamId, playerId: input.playerId } },
      });
      if (existing) throw new TRPCError({ code: "BAD_REQUEST", message: "Player already in this team" });

      // Prevent player from being in multiple teams in the same league
      const divisionWithLeague = await ctx.db.division.findUniqueOrThrow({
        where: { id: team.divisionId },
        select: { leagueId: true },
      });
      const otherTeamMembership = await ctx.db.teamPlayer.findFirst({
        where: {
          playerId: input.playerId,
          isActive: true,
          team: { division: { leagueId: divisionWithLeague.leagueId } },
        },
      });
      if (otherTeamMembership) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Player is already in another team in this league" });
      }

      return ctx.db.teamPlayer.create({
        data: { teamId: input.teamId, playerId: input.playerId },
      });
    }),

  removePlayer: protectedProcedure
    .input(z.object({ teamId: z.string(), playerId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await checkRosterLock(ctx.db, input.teamId, ctx.session.user.role);
      await verifyTeamOwnership(ctx.db, input.teamId, ctx.session.user.id, ctx.session.user.role);

      const team = await ctx.db.team.findUniqueOrThrow({ where: { id: input.teamId } });
      if (input.playerId === team.captainId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot remove team captain" });
      }

      return ctx.db.teamPlayer.delete({
        where: { teamId_playerId: { teamId: input.teamId, playerId: input.playerId } },
      });
    }),

  // Change captain of a team (must be existing team member)
  changeCaptain: protectedProcedure
    .use(requireRole("TOURNAMENT_OPERATOR"))
    .input(z.object({ teamId: z.string(), newCaptainId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await checkRosterLock(ctx.db, input.teamId, ctx.session.user.role);
      await verifyTeamOwnership(ctx.db, input.teamId, ctx.session.user.id, ctx.session.user.role);

      // Verify new captain is a member of the team
      const membership = await ctx.db.teamPlayer.findUnique({
        where: { teamId_playerId: { teamId: input.teamId, playerId: input.newCaptainId } },
      });
      if (!membership) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Player must be a team member to become captain" });
      }

      // Just update the team's captain field — no role changes
      return ctx.db.team.update({
        where: { id: input.teamId },
        data: { captainId: input.newCaptainId },
      });
    }),

  movePlayer: protectedProcedure
    .use(requireRole("TOURNAMENT_OPERATOR"))
    .input(z.object({ playerId: z.string(), fromTeamId: z.string(), toTeamId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await checkRosterLock(ctx.db, input.fromTeamId, ctx.session.user.role);
      await verifyTeamOwnership(ctx.db, input.fromTeamId, ctx.session.user.id, ctx.session.user.role);
      await verifyTeamOwnership(ctx.db, input.toTeamId, ctx.session.user.id, ctx.session.user.role);

      const fromTeam = await ctx.db.team.findUniqueOrThrow({ where: { id: input.fromTeamId } });
      if (fromTeam.captainId === input.playerId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot move a team captain" });
      }

      await ctx.db.teamPlayer.delete({
        where: { teamId_playerId: { teamId: input.fromTeamId, playerId: input.playerId } },
      });
      return ctx.db.teamPlayer.create({
        data: { teamId: input.toTeamId, playerId: input.playerId },
      });
    }),

  deleteTeam: protectedProcedure
    .use(requireRole("TOURNAMENT_OPERATOR"))
    .input(z.object({ teamId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await checkRosterLock(ctx.db, input.teamId, ctx.session.user.role);
      await verifyTeamOwnership(ctx.db, input.teamId, ctx.session.user.id, ctx.session.user.role);
      const team = await ctx.db.team.findUniqueOrThrow({
        where: { id: input.teamId },
        select: { divisionId: true },
      });
      await ctx.db.standing.deleteMany({ where: { teamId: input.teamId } });
      await ctx.db.team.delete({ where: { id: input.teamId } });
      // Recalculate ranks for remaining teams
      const standings = await ctx.db.standing.findMany({
        where: { divisionId: team.divisionId },
        orderBy: [{ totalPoints: "desc" }, { matchesWon: "desc" }],
      });
      await Promise.all(
        standings.map((s, idx) => ctx.db.standing.update({ where: { id: s.id }, data: { rank: idx + 1 } }))
      );
      return { success: true };
    }),

  removeFromLeague: protectedProcedure
    .use(requireRole("TOURNAMENT_OPERATOR"))
    .input(z.object({ playerId: z.string(), leagueId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await verifyLeagueOwnership(ctx.db, input.leagueId, ctx.session.user.id, ctx.session.user.role);

      const league = await ctx.db.league.findUniqueOrThrow({
        where: { id: input.leagueId },
        include: { divisions: { include: { teams: { select: { id: true, captainId: true } } } } },
      });

      const captainOf = league.divisions.flatMap((d) => d.teams).find((t) => t.captainId === input.playerId);
      if (captainOf) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot remove a team captain from the league" });
      }

      const teamIds = league.divisions.flatMap((d) => d.teams.map((t) => t.id));
      await ctx.db.teamPlayer.deleteMany({
        where: { playerId: input.playerId, teamId: { in: teamIds } },
      });

      await ctx.db.playerRegistration.updateMany({
        where: { leagueId: input.leagueId, playerId: input.playerId },
        data: { status: "REJECTED" },
      });

      return { success: true };
    }),

  // Captain submits lineup for a tie
  submitLineup: protectedProcedure
    .input(
      z.object({
        tieId: z.string(),
        teamId: z.string(),
        // Array of { matchId, playerId } or { matchId, playerIds } for doubles
        entries: z.array(
          z.object({
            matchId: z.string(),
            playerIds: z.array(z.string()).min(1).max(2),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check tie is still SCHEDULED and get its matches
      const tieWithMatches = await ctx.db.tie.findUniqueOrThrow({
        where: { id: input.tieId },
        include: { matches: { select: { id: true, format: true } } },
      });
      if (tieWithMatches.status !== "SCHEDULED") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot submit lineup for a tie that is already " + tieWithMatches.status });
      }

      // Validate lineup covers ALL matches in the tie
      const tieMatchIds = new Set(tieWithMatches.matches.map((m) => m.id));
      const entryMatchIds = new Set(input.entries.map((e) => e.matchId));
      for (const matchId of tieMatchIds) {
        if (!entryMatchIds.has(matchId)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Lineup must cover all matches in the tie" });
        }
      }
      // Validate correct player count per match format
      for (const entry of input.entries) {
        const match = tieWithMatches.matches.find((m) => m.id === entry.matchId);
        if (!match) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid match ID in lineup" });
        }
        if (match.format === "DOUBLES" && entry.playerIds.length < 2) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Doubles matches require 2 players" });
        }
        if (match.format === "SINGLES" && entry.playerIds.length !== 1) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Singles matches require exactly 1 player" });
        }
      }

      // Verify caller is captain of this team or TO/admin
      const team = await ctx.db.team.findUniqueOrThrow({
        where: { id: input.teamId },
        include: { division: { include: { league: { select: { operatorId: true } } } } },
      });

      const isAuthorized =
        team.captainId === ctx.session.user.id ||
        team.division.league.operatorId === ctx.session.user.id ||
        ctx.session.user.role === "SUPER_ADMIN";

      if (!isAuthorized) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only the team captain can submit lineup" });
      }

      // Validate all players belong to THIS team
      const teamPlayerIds = await ctx.db.teamPlayer.findMany({
        where: { teamId: input.teamId, isActive: true },
        select: { playerId: true },
      });
      const validPlayerIds = new Set(teamPlayerIds.map((tp) => tp.playerId));
      for (const entry of input.entries) {
        for (const pid of entry.playerIds) {
          if (!validPlayerIds.has(pid)) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot assign players from other teams" });
          }
        }
        // Doubles: both players must be different
        if (entry.playerIds.length === 2 && entry.playerIds[0] === entry.playerIds[1]) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Doubles partners must be different players" });
        }
      }

      // Create or update lineup
      const lineup = await ctx.db.lineup.upsert({
        where: { tieId_teamId: { tieId: input.tieId, teamId: input.teamId } },
        create: { tieId: input.tieId, teamId: input.teamId, submitted: true },
        update: { submitted: true },
      });

      // Clear existing entries
      await ctx.db.lineupEntry.deleteMany({ where: { lineupId: lineup.id } });

      // Create new entries
      for (const entry of input.entries) {
        for (const playerId of entry.playerIds) {
          await ctx.db.lineupEntry.create({
            data: {
              lineupId: lineup.id,
              matchId: entry.matchId,
              playerId,
            },
          });
        }
      }

      return { success: true };
    }),

  getByDivision: protectedProcedure
    .input(z.object({ divisionId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.team.findMany({
        where: { divisionId: input.divisionId },
        include: {
          captain: { select: { id: true, name: true } },
          players: {
            where: { isActive: true },
            include: { player: { select: { id: true, name: true } } },
          },
          _count: { select: { players: true } },
        },
      });
    }),
});
