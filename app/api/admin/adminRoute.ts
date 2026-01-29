import { NextResponse } from "next/server";

import {
  ensureAuthorized,
  parseJson,
  requireAdminKey,
} from "@/app/api/_utils";

export type AdminParseResult<T> =
  | { ok: true; adminKey: string; data: T }
  | { ok: false; response: NextResponse };

export async function parseAdminJson<T extends { key?: string }>(
  request: Request
): Promise<AdminParseResult<T>> {
  const adminKeyResult = requireAdminKey();
  if (!adminKeyResult.ok) {
    return adminKeyResult;
  }

  const bodyResult = await parseJson<T>(request);
  if (!bodyResult.ok) {
    return bodyResult;
  }

  const unauthorized = ensureAuthorized(
    bodyResult.data?.key,
    adminKeyResult.adminKey
  );
  if (unauthorized) {
    return { ok: false, response: unauthorized };
  }

  return {
    ok: true,
    adminKey: adminKeyResult.adminKey,
    data: bodyResult.data,
  };
}

export function parseAdminQuery(request: Request): AdminParseResult<null> {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");

  const adminKeyResult = requireAdminKey();
  if (!adminKeyResult.ok) {
    return adminKeyResult;
  }

  const unauthorized = ensureAuthorized(key, adminKeyResult.adminKey);
  if (unauthorized) {
    return { ok: false, response: unauthorized };
  }

  return { ok: true, adminKey: adminKeyResult.adminKey, data: null };
}
