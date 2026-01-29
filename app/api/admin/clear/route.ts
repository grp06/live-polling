import { NextResponse } from "next/server";

import { clearAllPolls } from "@/lib/pollService";
import { ensureAuthorized, parseJson, requireAdminKey } from "../_utils";

export async function POST(request: Request) {
  const adminKeyResult = requireAdminKey();
  if (!adminKeyResult.ok) {
    return adminKeyResult.response;
  }

  const payloadResult = await parseJson<{ key?: string }>(request);
  if (!payloadResult.ok) {
    return payloadResult.response;
  }

  const unauthorized = ensureAuthorized(
    payloadResult.data?.key,
    adminKeyResult.adminKey
  );
  if (unauthorized) {
    return unauthorized;
  }

  await clearAllPolls();
  return NextResponse.json({ ok: true });
}
