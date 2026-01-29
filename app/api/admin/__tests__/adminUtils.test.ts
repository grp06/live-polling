import {
  ensureAuthorized,
  handleRouteError,
  parseJson,
  requireAdminKey,
} from "@/app/api/_utils";

describe("requireAdminKey", () => {
  const original = process.env.ADMIN_KEY;

  afterEach(() => {
    process.env.ADMIN_KEY = original;
  });

  it("returns error response when ADMIN_KEY is missing", async () => {
    delete process.env.ADMIN_KEY;
    const result = requireAdminKey();

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }

    expect(result.response.status).toBe(500);
    await expect(result.response.json()).resolves.toEqual({
      error: "admin key not configured",
    });
  });

  it("returns admin key when configured", () => {
    process.env.ADMIN_KEY = "secret";
    const result = requireAdminKey();

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.adminKey).toBe("secret");
  });
});

describe("ensureAuthorized", () => {
  it("returns unauthorized response when key is missing", async () => {
    const response = ensureAuthorized(undefined, "secret");

    expect(response).not.toBeNull();
    if (!response) {
      return;
    }

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "unauthorized" });
  });

  it("returns unauthorized response when key mismatches", async () => {
    const response = ensureAuthorized("wrong", "secret");

    expect(response).not.toBeNull();
    if (!response) {
      return;
    }

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "unauthorized" });
  });

  it("returns null when key matches", () => {
    const response = ensureAuthorized("secret", "secret");

    expect(response).toBeNull();
  });
});

describe("parseJson", () => {
  it("returns data when JSON is valid", async () => {
    const request = new Request("http://localhost", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ key: "secret" }),
    });

    const result = await parseJson<{ key: string }>(request);

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.data).toEqual({ key: "secret" });
  });

  it("returns error response when JSON is invalid", async () => {
    const request = new Request("http://localhost", {
      method: "POST",
      body: "not-json",
    });

    const result = await parseJson<Record<string, unknown>>(request);

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }

    expect(result.response.status).toBe(400);
    await expect(result.response.json()).resolves.toEqual({
      error: "invalid json",
    });
  });
});

describe("handleRouteError", () => {
  it("returns 500 response with error message", async () => {
    const response = handleRouteError("TEST", new Error("boom"));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "boom" });
  });
});
