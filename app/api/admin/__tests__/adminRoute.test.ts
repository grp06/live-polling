import { parseAdminJson, parseAdminQuery } from "@/app/api/admin/adminRoute";

describe("parseAdminJson", () => {
  const original = process.env.ADMIN_KEY;

  afterEach(() => {
    process.env.ADMIN_KEY = original;
  });

  it("returns error response when ADMIN_KEY is missing", async () => {
    delete process.env.ADMIN_KEY;

    const request = new Request("http://localhost", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ key: "secret" }),
    });

    const result = await parseAdminJson<{ key: string }>(request);

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }

    expect(result.response.status).toBe(500);
    await expect(result.response.json()).resolves.toEqual({
      error: "admin key not configured",
    });
  });

  it("returns error response when JSON is invalid", async () => {
    process.env.ADMIN_KEY = "secret";

    const request = new Request("http://localhost", {
      method: "POST",
      body: "not-json",
    });

    const result = await parseAdminJson<Record<string, unknown>>(request);

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }

    expect(result.response.status).toBe(400);
    await expect(result.response.json()).resolves.toEqual({
      error: "invalid json",
    });
  });

  it("returns unauthorized when key is missing", async () => {
    process.env.ADMIN_KEY = "secret";

    const request = new Request("http://localhost", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    const result = await parseAdminJson<{ key?: string }>(request);

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }

    expect(result.response.status).toBe(401);
    await expect(result.response.json()).resolves.toEqual({
      error: "unauthorized",
    });
  });

  it("returns unauthorized when key mismatches", async () => {
    process.env.ADMIN_KEY = "secret";

    const request = new Request("http://localhost", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ key: "wrong" }),
    });

    const result = await parseAdminJson<{ key: string }>(request);

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }

    expect(result.response.status).toBe(401);
    await expect(result.response.json()).resolves.toEqual({
      error: "unauthorized",
    });
  });

  it("returns data and adminKey when authorized", async () => {
    process.env.ADMIN_KEY = "secret";

    const request = new Request("http://localhost", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ key: "secret", question: "Hello" }),
    });

    const result = await parseAdminJson<{ key: string; question: string }>(
      request
    );

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.adminKey).toBe("secret");
    expect(result.data).toEqual({ key: "secret", question: "Hello" });
  });
});

describe("parseAdminQuery", () => {
  const original = process.env.ADMIN_KEY;

  afterEach(() => {
    process.env.ADMIN_KEY = original;
  });

  it("returns error response when ADMIN_KEY is missing", async () => {
    delete process.env.ADMIN_KEY;

    const request = new Request(
      "http://localhost/api/admin/presets?key=secret"
    );

    const result = parseAdminQuery(request);

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }

    expect(result.response.status).toBe(500);
    await expect(result.response.json()).resolves.toEqual({
      error: "admin key not configured",
    });
  });

  it("returns unauthorized when key is missing", async () => {
    process.env.ADMIN_KEY = "secret";

    const request = new Request("http://localhost/api/admin/presets");

    const result = parseAdminQuery(request);

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }

    expect(result.response.status).toBe(401);
    await expect(result.response.json()).resolves.toEqual({
      error: "unauthorized",
    });
  });

  it("returns unauthorized when key mismatches", async () => {
    process.env.ADMIN_KEY = "secret";

    const request = new Request(
      "http://localhost/api/admin/presets?key=wrong"
    );

    const result = parseAdminQuery(request);

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }

    expect(result.response.status).toBe(401);
    await expect(result.response.json()).resolves.toEqual({
      error: "unauthorized",
    });
  });

  it("returns adminKey when authorized", () => {
    process.env.ADMIN_KEY = "secret";

    const request = new Request(
      "http://localhost/api/admin/presets?key=secret"
    );

    const result = parseAdminQuery(request);

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.adminKey).toBe("secret");
    expect(result.data).toBeNull();
  });
});
