import { NextResponse } from "next/server";

import { ensureAuthorized, handleRouteError, parseJson, requireAdminKey } from "@/app/api/_utils";
import { closePoll } from "@/lib/pollService";

type ClosePayload = {
  key: string;
};

export async function POST(request: Request) {
  const adminKeyResult = requireAdminKey();
  if (!adminKeyResult.ok) {
    return adminKeyResult.response;
  }

  const bodyResult = await parseJson<ClosePayload>(request);
  if (!bodyResult.ok) {
    return bodyResult.response;
  }

  const unauthorized = ensureAuthorized(
    bodyResult.data?.key,
    adminKeyResult.adminKey
  );
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const summary = await closePoll();
    return NextResponse.json(summary);
  } catch (error) {
    return handleRouteError("POST /api/admin/close failed", error);
  }
}
