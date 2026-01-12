import { NextResponse } from "next/server";

import { recordVote } from "@/lib/pollService";

type VotePayload = {
  anonId: string;
  pollId: string;
  value: number;
};

export async function POST(request: Request) {
  let body: VotePayload;
  try {
    body = (await request.json()) as VotePayload;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  if (!body?.anonId) {
    return NextResponse.json({ error: "anonId is required" }, { status: 400 });
  }
  if (!body?.pollId) {
    return NextResponse.json({ error: "pollId is required" }, { status: 400 });
  }
  if (typeof body.value !== "number") {
    return NextResponse.json({ error: "value must be a number" }, { status: 400 });
  }

  try {
    await recordVote(body.anonId, body.pollId, body.value);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/vote failed", error);
    const message = error instanceof Error ? error.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
