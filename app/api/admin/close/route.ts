import { NextResponse } from "next/server";

import { closePoll } from "@/lib/pollService";
import { ensureAuthorized, parseJson, requireAdminKey } from "../_utils";

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
    console.error("POST /api/admin/close failed", error);
    const message = error instanceof Error ? error.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
