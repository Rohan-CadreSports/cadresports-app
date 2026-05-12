import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const result = await db.sport.findMany({ take: 1 });
    return NextResponse.json({
      status: "ok",
      db: "connected",
      sports: result.length,
      env: {
        hasDbUrl: !!process.env.DATABASE_URL,
        dbUrlPrefix: process.env.DATABASE_URL?.substring(0, 30) + "...",
        hasAuthSecret: !!process.env.NEXTAUTH_SECRET,
        hasAuthUrl: !!process.env.NEXTAUTH_URL,
        authUrl: process.env.NEXTAUTH_URL,
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({
      status: "error",
      error: msg,
      env: {
        hasDbUrl: !!process.env.DATABASE_URL,
        dbUrlPrefix: process.env.DATABASE_URL?.substring(0, 30) + "...",
      },
    }, { status: 500 });
  }
}
