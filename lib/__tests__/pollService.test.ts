import { clearAllPolls } from "../pollService";
import { KEY_ACTIVE, KEY_HISTORY, keyVotes } from "../pollTypes";
import {
  kvDel,
  kvGetJson,
  kvHGet,
  kvHGetAll,
  kvHSet,
  kvLPushJson,
  kvLRangeJson,
  kvSetJson,
} from "../kv";

jest.mock("../kv", () => ({
  kvDel: jest.fn(),
  kvGetJson: jest.fn(),
  kvHGet: jest.fn(),
  kvHGetAll: jest.fn(),
  kvHSet: jest.fn(),
  kvLPushJson: jest.fn(),
  kvLRangeJson: jest.fn(),
  kvSetJson: jest.fn(),
}));

describe("clearAllPolls", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("clears active poll votes and history", async () => {
    (kvGetJson as jest.Mock).mockResolvedValue({
      id: "poll-123",
      question: "Test?",
      openedAt: "2026-01-01T00:00:00.000Z",
    });

    await clearAllPolls();

    expect(kvDel).toHaveBeenCalledWith(KEY_ACTIVE);
    expect(kvDel).toHaveBeenCalledWith(KEY_HISTORY);
    expect(kvDel).toHaveBeenCalledWith(keyVotes("poll-123"));
  });

  it("clears history even when no active poll", async () => {
    (kvGetJson as jest.Mock).mockResolvedValue(null);

    await clearAllPolls();

    expect(kvDel).toHaveBeenCalledWith(KEY_ACTIVE);
    expect(kvDel).toHaveBeenCalledWith(KEY_HISTORY);
    expect(kvDel).not.toHaveBeenCalledWith(keyVotes("poll-123"));
  });
});
