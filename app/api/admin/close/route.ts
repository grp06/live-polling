import { NextResponse } from "next/server";

import { closePoll } from "@/lib/pollService";

type ClosePayload = {
  key: string;
};

export async function POST(request: Request) {
  let body: ClosePayload;
  try {
    body = (await request.json()) as ClosePayload;
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

  try {
    const summary = await closePoll();
    return NextResponse.json(summary);
  } catch (error) {
    console.error("POST /api/admin/close failed", error);
    const message = error instanceof Error ? error.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
