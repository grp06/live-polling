import { NextResponse } from "next/server";

export type AdminKeyResult =
  | { ok: true; adminKey: string }
  | { ok: false; response: NextResponse };

export type JsonResult<T> =
  | { ok: true; data: T }
  | { ok: false; response: NextResponse };

export function requireAdminKey(): AdminKeyResult {
  const adminKey = process.env.ADMIN_KEY;
  if (!adminKey) {
    console.error("ADMIN_KEY is not configured");
    return {
      ok: false,
      response: NextResponse.json(
        { error: "admin key not configured" },
        { status: 500 }
      ),
    };
  }
  return { ok: true, adminKey };
}

export function ensureAuthorized(
  key: string | null | undefined,
  adminKey: string
): NextResponse | null {
  if (!key || key !== adminKey) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return null;
}

export async function parseJson<T>(request: Request): Promise<JsonResult<T>> {
  try {
    const data = (await request.json()) as T;
    return { ok: true, data };
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: "invalid json" }, { status: 400 }),
    };
  }
}

export function handleRouteError(label: string, error: unknown): NextResponse {
  console.error(label, error);
  const message = error instanceof Error ? error.message : "unknown error";
  return NextResponse.json({ error: message }, { status: 500 });
}
