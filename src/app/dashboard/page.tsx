import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  // Check if onboarding is done (players only)
  if (session.user.role === "PLAYER") {
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { onboardingDone: true },
    });

    if (!user?.onboardingDone) {
      redirect("/onboarding");
    }
  }

  const role = session.user.role;

  switch (role) {
    case "SUPER_ADMIN":
      redirect("/dashboard/admin");
    case "FEDERATION_ADMIN":
      redirect("/dashboard/federation");
    case "TOURNAMENT_OPERATOR":
      redirect("/dashboard/operator");
    case "PLAYER":
    default:
      redirect("/dashboard/player");
  }
}
