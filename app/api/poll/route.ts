import { NextResponse } from "next/server";

import { handleRouteError } from "@/app/api/_utils";
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
    return handleRouteError("GET /api/poll failed", error);
  }
}
