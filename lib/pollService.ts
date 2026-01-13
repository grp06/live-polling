import { randomUUID } from "node:crypto";

import {
  kvDel,
  kvGetJson,
  kvHGet,
  kvHGetAll,
  kvHSet,
  kvLPushJson,
  kvLRangeJson,
  kvSetJson,
} from "./kv";
import {
  type ActivePoll,
  type ClosedPollSummary,
  type PollState,
  type PollType,
  KEY_ACTIVE,
  KEY_HISTORY,
  POLL_MAX,
  POLL_MIN,
  keyVotes,
} from "./pollTypes";

const HISTORY_LIMIT = 20;

const createSliderHistogram = () =>
  Array.from({ length: POLL_MAX - POLL_MIN + 1 }, () => 0);

const createChoiceHistogram = (optionCount: number) =>
  Array.from({ length: optionCount }, () => 0);

export async function openPoll(
  question: string,
  type: PollType,
  options?: string[]
): Promise<ActivePoll> {
  const trimmed = question.trim();
  if (!trimmed) {
    throw new Error("question is required");
  }
  if (!type) {
    throw new Error("type is required");
  }

  const existing = await kvGetJson<ActivePoll>(KEY_ACTIVE);
  if (existing) {
    await closePoll();
  }

  const pollType = ensurePollType(type);
  const pollOptions =
    pollType === "multiple_choice" ? normalizeOptions(options) : undefined;

  const poll: ActivePoll = {
    id: randomUUID(),
    question: trimmed,
    openedAt: new Date().toISOString(),
    type: pollType,
    options: pollOptions,
  };

  await kvSetJson(KEY_ACTIVE, poll);
  return poll;
}

export async function closePoll(): Promise<ClosedPollSummary | null> {
  const storedPoll = await kvGetJson<ActivePoll>(KEY_ACTIVE);
  const poll = storedPoll ? normalizeStoredPoll(storedPoll) : null;
  if (!poll) {
    return null;
  }

  const votes = await kvHGetAll(keyVotes(poll.id));
  const aggregates = computeAggregates(poll, votes);
  const summary: ClosedPollSummary = {
    id: poll.id,
    question: poll.question,
    openedAt: poll.openedAt,
    closedAt: new Date().toISOString(),
    type: poll.type,
    options: poll.options,
    count: aggregates.count,
    avg: aggregates.avg,
    histogram: aggregates.histogram,
  };

  await kvDel(KEY_ACTIVE);
  await kvLPushJson(KEY_HISTORY, summary);
  await kvDel(keyVotes(poll.id));

  return summary;
}

export async function clearAllPolls(): Promise<void> {
  const poll = await kvGetJson<ActivePoll>(KEY_ACTIVE);
  await kvDel(KEY_ACTIVE);
  await kvDel(KEY_HISTORY);
  if (poll) {
    await kvDel(keyVotes(poll.id));
  }
}

export async function listHistory(
  limit: number
): Promise<ClosedPollSummary[]> {
  const safeLimit = Math.max(0, Math.floor(limit));
  if (safeLimit === 0) {
    return [];
  }
  return kvLRangeJson<ClosedPollSummary>(KEY_HISTORY, 0, safeLimit - 1);
}

export async function getState(anonId: string): Promise<PollState> {
  if (!anonId) {
    throw new Error("anonId is required");
  }

  const [storedPoll, history] = await Promise.all([
    kvGetJson<ActivePoll>(KEY_ACTIVE),
    listHistory(HISTORY_LIMIT),
  ]);

  const poll = storedPoll ? normalizeStoredPoll(storedPoll) : null;

  if (!poll) {
    return {
      poll: null,
      count: 0,
      avg: null,
      histogram: [],
      userVote: null,
      history,
    };
  }

  const votesKey = keyVotes(poll.id);
  const [votes, userVoteRaw] = await Promise.all([
    kvHGetAll(votesKey),
    kvHGet(votesKey, anonId),
  ]);
  const aggregates = computeAggregates(poll, votes);
  const userVote =
    userVoteRaw === null ? null : parseVoteForPoll(poll, userVoteRaw);

  return {
    poll,
    count: aggregates.count,
    avg: aggregates.avg,
    histogram: aggregates.histogram,
    userVote,
    history,
  };
}

export async function recordVote(
  anonId: string,
  pollId: string,
  value: number
): Promise<void> {
  if (!anonId) {
    throw new Error("anonId is required");
  }
  if (!pollId) {
    throw new Error("pollId is required");
  }

  const storedPoll = await kvGetJson<ActivePoll>(KEY_ACTIVE);
  const poll = storedPoll ? normalizeStoredPoll(storedPoll) : null;
  if (!poll) {
    throw new Error("no active poll");
  }
  if (poll.id !== pollId) {
    throw new Error("poll is not active");
  }

  if (!Number.isFinite(value)) {
    throw new Error("value must be a number");
  }

  const rounded = Math.round(value);

  if (poll.type === "slider") {
    const clamped = Math.min(POLL_MAX, Math.max(POLL_MIN, rounded));
    await kvHSet(keyVotes(poll.id), anonId, String(clamped));
    return;
  }

  const options = requireOptions(poll);
  if (!Number.isInteger(value)) {
    throw new Error("option index must be an integer");
  }
  if (rounded < 0 || rounded >= options.length) {
    throw new Error("option index out of range");
  }

  await kvHSet(keyVotes(poll.id), anonId, String(rounded));
}

export function computeAggregates(
  poll: ActivePoll,
  votes: Record<string, string>
): {
  count: number;
  avg: number | null;
  histogram: number[];
} {
  const values = Object.values(votes);
  if (poll.type === "slider") {
    const histogram = createSliderHistogram();
    if (values.length === 0) {
      return { count: 0, avg: null, histogram };
    }

    let sum = 0;
    for (const raw of values) {
      const parsed = parseSliderVote(raw);
      histogram[parsed - POLL_MIN] += 1;
      sum += parsed;
    }

    const avg = Math.round((sum / values.length) * 10) / 10;

    return {
      count: values.length,
      avg,
      histogram,
    };
  }

  const options = requireOptions(poll);
  const histogram = createChoiceHistogram(options.length);
  if (values.length === 0) {
    return { count: 0, avg: null, histogram };
  }

  for (const raw of values) {
    const parsed = parseChoiceVote(raw, options.length);
    histogram[parsed] += 1;
  }

  return {
    count: values.length,
    avg: null,
    histogram,
  };
}

function parseVoteForPoll(poll: ActivePoll, raw: string): number {
  if (poll.type === "slider") {
    return parseSliderVote(raw);
  }
  const options = requireOptions(poll);
  return parseChoiceVote(raw, options.length);
}

function parseSliderVote(raw: string): number {
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) {
    throw new Error(`invalid vote value: ${raw}`);
  }
  if (parsed < POLL_MIN || parsed > POLL_MAX) {
    throw new Error(`vote value out of range: ${raw}`);
  }
  return parsed;
}

function parseChoiceVote(raw: string, optionCount: number): number {
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) {
    throw new Error(`invalid option index: ${raw}`);
  }
  if (parsed < 0 || parsed >= optionCount) {
    throw new Error(`option index out of range: ${raw}`);
  }
  return parsed;
}

function normalizeOptions(options?: string[]): string[] {
  if (!options) {
    throw new Error("options are required");
  }
  const normalized = options
    .map((option) => option.trim())
    .filter((option) => option.length > 0);
  if (normalized.length < 2) {
    throw new Error("at least two options are required");
  }
  return normalized;
}

function ensurePollType(type: PollType): PollType {
  if (type !== "slider" && type !== "multiple_choice") {
    throw new Error("invalid poll type");
  }
  return type;
}

function requireOptions(poll: ActivePoll): string[] {
  if (poll.type !== "multiple_choice") {
    throw new Error("poll does not have options");
  }
  if (!poll.options || poll.options.length < 2) {
    throw new Error("poll options are missing");
  }
  return poll.options;
}

function normalizeStoredPoll(poll: ActivePoll): ActivePoll {
  if (!poll.type) {
    return { ...poll, type: "slider" };
  }
  return poll;
}
