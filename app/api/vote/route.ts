import { NextResponse } from "next/server";

import { handleRouteError, parseJson } from "@/app/api/_utils";
import { recordVote } from "@/lib/pollService";

type VotePayload = {
  anonId: string;
  pollId: string;
  value: number;
};

export async function POST(request: Request) {
  const bodyResult = await parseJson<VotePayload>(request);
  if (!bodyResult.ok) {
    return bodyResult.response;
  }

  const body = bodyResult.data;

  if (!body.anonId) {
    return NextResponse.json({ error: "anonId is required" }, { status: 400 });
  }
  if (!body.pollId) {
    return NextResponse.json({ error: "pollId is required" }, { status: 400 });
  }
  if (typeof body.value !== "number") {
    return NextResponse.json({ error: "value must be a number" }, { status: 400 });
  }

  try {
    await recordVote(body.anonId, body.pollId, body.value);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError("POST /api/vote failed", error);
  }
}
