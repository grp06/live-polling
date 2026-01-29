import { NextResponse } from "next/server";

import { ensureAuthorized, handleRouteError, requireAdminKey } from "@/app/api/_utils";
import { loadPrewrittenPolls } from "@/lib/prewrittenPolls";

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
    return handleRouteError("GET /api/admin/presets failed", error);
  }
}
