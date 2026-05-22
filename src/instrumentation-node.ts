import { execSync } from "child_process";

// Skip during build
if (process.env.NEXT_PHASE !== "phase-production-build") {
  if (process.env.SKIP_MIGRATION_ON_STARTUP === "true") {
    console.log("[migrate] Skipped — SKIP_MIGRATION_ON_STARTUP is set");
  } else {
    try {
      console.log("[migrate] Running prisma migrate deploy...");
      const output = execSync("npx prisma migrate deploy", {
        encoding: "utf-8",
        timeout: 30_000,
        env: { ...process.env },
      });
      console.log("[migrate]", output.trim());
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);

      // In serverless environments, direct DB access may not be available.
      // Log but don't crash — the DB may already be up to date.
      if (
        message.includes("ECONNREFUSED") ||
        message.includes("timeout") ||
        message.includes("P1001") ||
        message.includes("P1010")
      ) {
        console.warn(
          "[migrate] Could not connect to database for migration — skipping gracefully."
        );
        console.warn("[migrate]", message.split("\n")[0]);
      } else {
        console.error("[migrate] Migration failed:", message);
      }
    }
  }
}
