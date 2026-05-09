import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import bcrypt from "bcryptjs";
import "dotenv/config";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Create Sports
  const badminton = await prisma.sport.upsert({
    where: { slug: "badminton" },
    update: {},
    create: {
      name: "Badminton",
      slug: "badminton",
      icon: "🏸",
      description: "Singles and Doubles - 21 points, best of 3 sets",
      scoringConfig: {
        type: "badminton",
        pointsPerSet: 21,
        setsToWin: 2,
        maxSets: 3,
        deuceRule: true,
        maxPoints: 30,
      },
    },
  });

  const football = await prisma.sport.upsert({
    where: { slug: "football" },
    update: {},
    create: {
      name: "Football",
      slug: "football",
      icon: "⚽",
      description: "Standard football scoring",
      scoringConfig: {
        type: "football",
        matchesPerTie: 1,
      },
    },
  });

  console.log("Sports created:", badminton.name, football.name);

  // Create Super Admin
  const adminPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@cadresport.com" },
    update: {},
    create: {
      name: "Super Admin",
      email: "admin@cadresport.com",
      passwordHash: adminPassword,
      role: "SUPER_ADMIN",
      city: "Mumbai",
      state: "Maharashtra",
      onboardingDone: true,
      gender: "MALE",
      dateOfBirth: new Date("1990-01-01"),
    },
  });

  // Create Tournament Operator (created BY admin)
  const opPassword = await bcrypt.hash("operator123", 12);
  const operator = await prisma.user.upsert({
    where: { email: "operator@cadresport.com" },
    update: {},
    create: {
      name: "Tournament Operator",
      email: "operator@cadresport.com",
      passwordHash: opPassword,
      role: "TOURNAMENT_OPERATOR",
      city: "Mumbai",
      state: "Maharashtra",
      onboardingDone: true,
      gender: "MALE",
      dateOfBirth: new Date("1992-06-15"),
    },
  });

  // Create sample players
  const playerPassword = await bcrypt.hash("player123", 12);
  const players = await Promise.all(
    Array.from({ length: 8 }, (_, i) =>
      prisma.user.upsert({
        where: { email: `player${i + 1}@cadresport.com` },
        update: {},
        create: {
          name: `Player ${i + 1}`,
          email: `player${i + 1}@cadresport.com`,
          passwordHash: playerPassword,
          role: "PLAYER",
          city: "Mumbai",
          state: "Maharashtra",
          onboardingDone: true,
          gender: i % 2 === 0 ? "MALE" : "FEMALE",
          dateOfBirth: new Date(`${1995 + i}-03-${10 + i}`),
        },
      })
    )
  );

  console.log("Users created:", admin.name, operator.name, `+ ${players.length} players`);

  // Create a Federation
  const federation = await prisma.federation.upsert({
    where: {
      sportId_level_area: {
        sportId: badminton.id,
        level: "STATE",
        area: "Maharashtra",
      },
    },
    update: {},
    create: {
      name: "Maharashtra Badminton Federation",
      sportId: badminton.id,
      level: "STATE",
      area: "Maharashtra",
    },
  });

  console.log("Federation created:", federation.name);

  // Create a sample league (team-based badminton, open gender)
  const league = await prisma.league.upsert({
    where: { slug: "mumbai-badminton-league-2026" },
    update: {},
    create: {
      name: "Mumbai Badminton League 2026",
      slug: "mumbai-badminton-league-2026",
      sportId: badminton.id,
      operatorId: operator.id,
      createdById: admin.id,
      federationId: federation.id,
      structure: "ROUND_ROBIN",
      mode: "TEAM",
      genderRestriction: "OPEN",
      status: "REGISTRATION_OPEN",
      description: "The premier badminton league in Mumbai. Join now and compete with the best players!",
      city: "Mumbai",
      state: "Maharashtra",
      venue: "Andheri Sports Complex",
      maxTeamsPerDiv: 4,
      minTeamSize: 4,
      maxTeamSize: 8,
      matchConfig: { singlesCount: 3, doublesCount: 2 },
      startDate: new Date("2026-06-01"),
      endDate: new Date("2026-08-31"),
      registrationEnd: new Date("2026-05-25"),
      divisions: {
        create: [
          { name: "Division A", order: 0 },
          { name: "Division B", order: 1 },
        ],
      },
    },
    include: { divisions: true },
  });

  console.log("League created:", league.name);

  // Create teams in Division A
  const divA = league.divisions[0];
  if (divA) {
    const teamNames = ["Smash Masters", "Shuttle Stars", "Net Ninjas", "Court Kings"];
    for (let i = 0; i < 4; i++) {
      const team = await prisma.team.upsert({
        where: {
          divisionId_name: { divisionId: divA.id, name: teamNames[i] },
        },
        update: {},
        create: {
          name: teamNames[i],
          divisionId: divA.id,
          captainId: players[i * 2].id,
        },
      });

      // Add captain and one more player
      await prisma.teamPlayer.upsert({
        where: {
          teamId_playerId: { teamId: team.id, playerId: players[i * 2].id },
        },
        update: {},
        create: { teamId: team.id, playerId: players[i * 2].id },
      });

      if (players[i * 2 + 1]) {
        await prisma.teamPlayer.upsert({
          where: {
            teamId_playerId: { teamId: team.id, playerId: players[i * 2 + 1].id },
          },
          update: {},
          create: { teamId: team.id, playerId: players[i * 2 + 1].id },
        });
      }

      await prisma.user.update({
        where: { id: players[i * 2].id },
        data: { role: "TEAM_CAPTAIN" },
      });
    }
    console.log("Teams created in Division A");
  }

  // Create a football league
  await prisma.league.upsert({
    where: { slug: "mumbai-football-cup-2026" },
    update: {},
    create: {
      name: "Mumbai Football Cup 2026",
      slug: "mumbai-football-cup-2026",
      sportId: football.id,
      operatorId: operator.id,
      createdById: admin.id,
      structure: "TOURNAMENT",
      mode: "TEAM",
      genderRestriction: "MENS_ONLY",
      status: "REGISTRATION_OPEN",
      description: "5-a-side knockout tournament. 16 teams battle for the cup!",
      city: "Mumbai",
      state: "Maharashtra",
      venue: "Cooperage Ground",
      maxTeamsPerDiv: 16,
      minTeamSize: 5,
      maxTeamSize: 12,
      matchConfig: { matchesPerTie: 1 },
      divisions: {
        create: [{ name: "Main Draw", order: 0 }],
      },
    },
  });

  console.log("Football league created");
  console.log("\n--- Seed Complete ---");
  console.log("\nTest Accounts:");
  console.log("  Super Admin:  admin@cadresport.com / admin123");
  console.log("  Operator:     operator@cadresport.com / operator123");
  console.log("  Players:      player1@cadresport.com through player8@cadresport.com / player123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
