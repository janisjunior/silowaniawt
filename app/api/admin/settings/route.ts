import { NextRequest, NextResponse } from "next/server";
import { getSettings, updateSettings } from "@/lib/store";
import { isAuthenticated } from "@/lib/auth";

export async function GET() {
  const authed = await isAuthenticated();
  if (!authed) return NextResponse.json({ error: "Brak autoryzacji." }, { status: 401 });
  return NextResponse.json({ settings: await getSettings() });
}

export async function PUT(req: NextRequest) {
  const authed = await isAuthenticated();
  if (!authed) return NextResponse.json({ error: "Brak autoryzacji." }, { status: 401 });

  const patch = await req.json();
  const settings = await updateSettings(patch);
  return NextResponse.json({ settings });
}
