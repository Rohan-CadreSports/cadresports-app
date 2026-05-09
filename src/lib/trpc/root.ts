import { router } from "./server";
import { authRouter } from "./routers/auth";
import { leagueRouter } from "./routers/league";
import { teamRouter } from "./routers/team";
import { matchRouter } from "./routers/match";
import { registrationRouter } from "./routers/registration";
import { sportRouter } from "./routers/sport";
import { adminRouter } from "./routers/admin";

export const appRouter = router({
  auth: authRouter,
  league: leagueRouter,
  team: teamRouter,
  match: matchRouter,
  registration: registrationRouter,
  sport: sportRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
