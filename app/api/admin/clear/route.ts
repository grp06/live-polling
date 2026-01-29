import { NextResponse } from "next/server";

import { parseAdminJson } from "@/app/api/admin/adminRoute";
import { clearAllPolls } from "@/lib/pollService";

export async function POST(request: Request) {
  const parsed = await parseAdminJson<{ key?: string }>(request);
  if (!parsed.ok) {
    return parsed.response;
  }

  await clearAllPolls();
  return NextResponse.json({ ok: true });
}
