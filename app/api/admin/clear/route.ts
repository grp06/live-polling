import { NextResponse } from "next/server";

import { clearAllPolls } from "@/lib/pollService";

export async function POST(request: Request) {
  const payload = (await request.json()) as { key?: string };
  if (!payload.key || payload.key !== process.env.ADMIN_KEY) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  await clearAllPolls();
  return NextResponse.json({ ok: true });
}
