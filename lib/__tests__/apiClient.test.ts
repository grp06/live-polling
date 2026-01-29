import { fetchJson } from "@/lib/apiClient";

describe("fetchJson", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.resetAllMocks();
  });

  it("returns parsed payload when response is ok", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, value: 12 }),
    }) as unknown as typeof fetch;

    const result = await fetchJson<{ ok: boolean; value: number }>(
      "/api/test",
      undefined,
      { errorMessage: "fallback" }
    );

    expect(result).toEqual({ ok: true, value: 12 });
  });

  it("throws payload error when response is not ok", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "bad" }),
    }) as unknown as typeof fetch;

    await expect(
      fetchJson<{ error?: string }>("/api/test", undefined, {
        errorMessage: "fallback",
      })
    ).rejects.toThrow("bad");
  });

  it("throws fallback error when payload has no error", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({}),
    }) as unknown as typeof fetch;

    await expect(
      fetchJson<Record<string, unknown>>("/api/test", undefined, {
        errorMessage: "fallback message",
      })
    ).rejects.toThrow("fallback message");
  });
});
