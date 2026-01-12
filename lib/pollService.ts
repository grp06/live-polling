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
  KEY_ACTIVE,
  KEY_HISTORY,
  POLL_MAX,
  POLL_MIN,
  keyVotes,
} from "./pollTypes";

const HISTORY_LIMIT = 20;

const createEmptyHistogram = () =>
  Array.from({ length: POLL_MAX - POLL_MIN + 1 }, () => 0);

export async function openPoll(question: string): Promise<ActivePoll> {
  const trimmed = question.trim();
  if (!trimmed) {
    throw new Error("question is required");
  }

  const existing = await kvGetJson<ActivePoll>(KEY_ACTIVE);
  if (existing) {
    await closePoll();
  }

  const poll: ActivePoll = {
    id: randomUUID(),
    question: trimmed,
    openedAt: new Date().toISOString(),
  };

  await kvSetJson(KEY_ACTIVE, poll);
  return poll;
}

export async function closePoll(): Promise<ClosedPollSummary | null> {
  const poll = await kvGetJson<ActivePoll>(KEY_ACTIVE);
  if (!poll) {
    return null;
  }

  const votes = await kvHGetAll(keyVotes(poll.id));
  const aggregates = computeAggregates(votes);
  const summary: ClosedPollSummary = {
    id: poll.id,
    question: poll.question,
    openedAt: poll.openedAt,
    closedAt: new Date().toISOString(),
    count: aggregates.count,
    avg: aggregates.avg,
    histogram: aggregates.histogram,
  };

  await kvDel(KEY_ACTIVE);
  await kvLPushJson(KEY_HISTORY, summary);
  await kvDel(keyVotes(poll.id));

  return summary;
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

  const [poll, history] = await Promise.all([
    kvGetJson<ActivePoll>(KEY_ACTIVE),
    listHistory(HISTORY_LIMIT),
  ]);

  if (!poll) {
    return {
      poll: null,
      count: 0,
      avg: null,
      histogram: createEmptyHistogram(),
      userVote: null,
      history,
    };
  }

  const votesKey = keyVotes(poll.id);
  const [votes, userVoteRaw] = await Promise.all([
    kvHGetAll(votesKey),
    kvHGet(votesKey, anonId),
  ]);
  const aggregates = computeAggregates(votes);
  const userVote = userVoteRaw === null ? null : parseVote(userVoteRaw);

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

  const poll = await kvGetJson<ActivePoll>(KEY_ACTIVE);
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
  const clamped = Math.min(POLL_MAX, Math.max(POLL_MIN, rounded));

  await kvHSet(keyVotes(poll.id), anonId, String(clamped));
}

export function computeAggregates(votes: Record<string, string>): {
  count: number;
  avg: number | null;
  histogram: number[];
} {
  const histogram = createEmptyHistogram();
  const values = Object.values(votes);
  if (values.length === 0) {
    return { count: 0, avg: null, histogram };
  }

  let sum = 0;
  for (const raw of values) {
    const parsed = parseVote(raw);
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

function parseVote(raw: string): number {
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) {
    throw new Error(`invalid vote value: ${raw}`);
  }
  if (parsed < POLL_MIN || parsed > POLL_MAX) {
    throw new Error(`vote value out of range: ${raw}`);
  }
  return parsed;
}
