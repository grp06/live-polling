import { NextResponse } from "next/server";

import { loadPrewrittenPolls } from "@/lib/prewrittenPolls";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");

  const adminKey = process.env.ADMIN_KEY;
  if (!adminKey) {
    console.error("ADMIN_KEY is not configured");
    return NextResponse.json(
      { error: "admin key not configured" },
      { status: 500 }
    );
  }

  if (!key || key !== adminKey) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const polls = await loadPrewrittenPolls();
    return NextResponse.json({ polls });
  } catch (error) {
    console.error("GET /api/admin/presets failed", error);
    const message = error instanceof Error ? error.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
