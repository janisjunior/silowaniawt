import { NextRequest, NextResponse } from "next/server";
import { findNextAvailableDate } from "@/lib/store";
import { Duration } from "@/lib/types";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const durationParam = Number(searchParams.get("duration") || "60");
  const from = searchParams.get("from") || undefined;

  const date = await findNextAvailableDate(durationParam as Duration, from);
  return NextResponse.json({ date });
}
