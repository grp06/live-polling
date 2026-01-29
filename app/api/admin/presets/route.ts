import { NextResponse } from "next/server";

import { loadPrewrittenPolls } from "@/lib/prewrittenPolls";
import { ensureAuthorized, requireAdminKey } from "../_utils";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");

  const adminKeyResult = requireAdminKey();
  if (!adminKeyResult.ok) {
    return adminKeyResult.response;
  }

  const unauthorized = ensureAuthorized(key, adminKeyResult.adminKey);
  if (unauthorized) {
    return unauthorized;
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
