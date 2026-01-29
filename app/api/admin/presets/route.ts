import { NextResponse } from "next/server";

import { handleRouteError } from "@/app/api/_utils";
import { parseAdminQuery } from "@/app/api/admin/adminRoute";
import { loadPrewrittenPolls } from "@/lib/prewrittenPolls";

export async function GET(request: Request) {
  const parsed = parseAdminQuery(request);
  if (!parsed.ok) {
    return parsed.response;
  }

  try {
    const polls = await loadPrewrittenPolls();
    return NextResponse.json({ polls });
  } catch (error) {
    return handleRouteError("GET /api/admin/presets failed", error);
  }
}
