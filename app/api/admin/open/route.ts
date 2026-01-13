import { NextResponse } from "next/server";

import { openPoll } from "@/lib/pollService";

type OpenPayload = {
  key: string;
  question: string;
  type: "slider" | "multiple_choice";
  options?: string[];
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
  if (body.type !== "slider" && body.type !== "multiple_choice") {
    return NextResponse.json(
      { error: "type must be slider or multiple_choice" },
      { status: 400 }
    );
  }
  if (body.type === "multiple_choice") {
    if (!Array.isArray(body.options)) {
      return NextResponse.json(
        { error: "options are required" },
        { status: 400 }
      );
    }
    if (!body.options.every((option) => typeof option === "string")) {
      return NextResponse.json(
        { error: "options must be strings" },
        { status: 400 }
      );
    }
  }

  try {
    const poll = await openPoll(body.question, body.type, body.options);
    return NextResponse.json(poll);
  } catch (error) {
    console.error("POST /api/admin/open failed", error);
    const message = error instanceof Error ? error.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
