import { NextResponse } from "next/server";

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL ?? "http://localhost:4000";

// Called by Vercel Cron every 10 minutes to prevent Railway cold starts
export async function GET() {
  try {
    const res = await fetch(`${SERVER_URL}/health`, { cache: "no-store" });
    const body = await res.json();
    return NextResponse.json({ ok: true, server: body });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 502 });
  }
}
