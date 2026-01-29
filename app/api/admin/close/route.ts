import { NextResponse } from "next/server";

import { handleRouteError } from "@/app/api/_utils";
import { parseAdminJson } from "@/app/api/admin/adminRoute";
import { closePoll } from "@/lib/pollService";

type ClosePayload = {
  key: string;
};

export async function POST(request: Request) {
  const parsed = await parseAdminJson<ClosePayload>(request);
  if (!parsed.ok) {
    return parsed.response;
  }

  try {
    const summary = await closePoll();
    return NextResponse.json(summary);
  } catch (error) {
    return handleRouteError("POST /api/admin/close failed", error);
  }
}
