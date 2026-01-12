import { NextResponse } from "next/server";

import { openPoll } from "@/lib/pollService";

type OpenPayload = {
  key: string;
  question: string;
};

export async function POST(request: Request) {
  let body: OpenPayload;
  try {
    body = (await request.json()) as OpenPayload;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const adminKey = process.env.ADMIN_KEY;
  if (!adminKey) {
    console.error("ADMIN_KEY is not configured");
    return NextResponse.json(
      { error: "admin key not configured" },
      { status: 500 }
    );
  }

  if (!body?.key || body.key !== adminKey) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!body?.question || !body.question.trim()) {
    return NextResponse.json({ error: "question is required" }, { status: 400 });
  }

  try {
    const poll = await openPoll(body.question);
    return NextResponse.json(poll);
  } catch (error) {
    console.error("POST /api/admin/open failed", error);
    const message = error instanceof Error ? error.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
