import { NextResponse } from "next/server";

import { getState } from "@/lib/pollService";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const anonId = searchParams.get("anonId");

  if (!anonId) {
    return NextResponse.json({ error: "anonId is required" }, { status: 400 });
  }

  try {
    const state = await getState(anonId);
    return NextResponse.json(state);
  } catch (error) {
    console.error("GET /api/poll failed", error);
    const message = error instanceof Error ? error.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
