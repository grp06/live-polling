import { clearAllPolls, computeAggregates, recordVote } from "../pollService";
import { KEY_ACTIVE, KEY_HISTORY, keyVotes, type ActivePoll } from "../pollTypes";
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

describe("computeAggregates", () => {
  it("computes slider averages and histogram", () => {
    const poll: ActivePoll = {
      id: "poll-1",
      question: "How are you?",
      openedAt: "2026-01-01T00:00:00.000Z",
      type: "slider",
    };
    const result = computeAggregates(poll, {
      a: "0",
      b: "10",
      c: "5",
    });

    expect(result.count).toBe(3);
    expect(result.avg).toBe(5);
    expect(result.histogram[0]).toBe(1);
    expect(result.histogram[5]).toBe(1);
    expect(result.histogram[10]).toBe(1);
  });

  it("computes multiple-choice counts", () => {
    const poll: ActivePoll = {
      id: "poll-2",
      question: "Pick one",
      openedAt: "2026-01-01T00:00:00.000Z",
      type: "multiple_choice",
      options: ["Red", "Blue", "Green"],
    };
    const result = computeAggregates(poll, {
      a: "0",
      b: "1",
      c: "1",
    });

    expect(result.count).toBe(3);
    expect(result.avg).toBeNull();
    expect(result.histogram).toEqual([1, 2, 0]);
  });
});

describe("recordVote", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("rejects invalid multiple-choice option indices", async () => {
    (kvGetJson as jest.Mock).mockResolvedValue({
      id: "poll-3",
      question: "Pick one",
      openedAt: "2026-01-01T00:00:00.000Z",
      type: "multiple_choice",
      options: ["A", "B"],
    } satisfies ActivePoll);

    await expect(recordVote("anon-1", "poll-3", 5)).rejects.toThrow(
      "option index out of range"
    );
    expect(kvHSet).not.toHaveBeenCalled();
  });
});
