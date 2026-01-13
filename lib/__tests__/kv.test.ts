const hgetall = jest.fn();

jest.mock("@vercel/kv", () => ({
  createClient: jest.fn(() => ({ hgetall })),
}));

process.env.KV_REST_API_URL = "https://example.com";
process.env.KV_REST_API_TOKEN = "test-token";

import { kvHGetAll } from "../kv";

describe("kvHGetAll", () => {
  beforeEach(() => {
    hgetall.mockReset();
  });

  it("normalizes array hash responses", async () => {
    hgetall.mockResolvedValue(["user-a", "7", "user-b", "3"]);

    await expect(kvHGetAll("poll:votes:1")).resolves.toEqual({
      "user-a": "7",
      "user-b": "3",
    });
  });

  it("returns object hash responses", async () => {
    hgetall.mockResolvedValue({ "user-a": "5" });

    await expect(kvHGetAll("poll:votes:2")).resolves.toEqual({
      "user-a": "5",
    });
  });
});
