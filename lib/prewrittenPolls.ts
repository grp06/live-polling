import { readFile } from "node:fs/promises";
import path from "node:path";

import { type PollType, type PrewrittenPoll } from "./pollTypes";

const PREWRITTEN_POLLS_PATH = path.join(
  process.cwd(),
  "data",
  "prewritten-polls.json"
);

export async function loadPrewrittenPolls(): Promise<PrewrittenPoll[]> {
  let raw: string;
  try {
    raw = await readFile(PREWRITTEN_POLLS_PATH, "utf8");
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    throw new Error(`failed to read prewritten polls: ${message}`);
  }
  return parsePrewrittenPolls(raw);
}

export function parsePrewrittenPolls(raw: string): PrewrittenPoll[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    throw new Error("prewritten polls JSON is invalid");
  }

  if (!Array.isArray(parsed)) {
    throw new Error("prewritten polls must be an array");
  }

  const seenIds = new Set<string>();

  return parsed.map((entry, index) =>
    normalizePreset(entry, index, seenIds)
  );
}

function normalizePreset(
  entry: unknown,
  index: number,
  seenIds: Set<string>
): PrewrittenPoll {
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
    throw new Error(`prewritten poll at index ${index} must be an object`);
  }

  const record = entry as Record<string, unknown>;
  const id = typeof record.id === "string" ? record.id.trim() : "";
  if (!id) {
    throw new Error(`prewritten poll at index ${index} is missing id`);
  }
  if (seenIds.has(id)) {
    throw new Error(`duplicate preset id: ${id}`);
  }

  const question =
    typeof record.question === "string" ? record.question.trim() : "";
  if (!question) {
    throw new Error(`prewritten poll at index ${index} is missing question`);
  }

  const type = normalizePollType(record.type, index);

  const poll: PrewrittenPoll = {
    id,
    type,
    question,
  };

  if (type === "multiple_choice") {
    if (!Array.isArray(record.options)) {
      throw new Error(`prewritten poll at index ${index}: options are required`);
    }
    if (!record.options.every((option) => typeof option === "string")) {
      throw new Error(
        `prewritten poll at index ${index} options must be strings`
      );
    }
    const normalized = record.options
      .map((option) => option.trim())
      .filter((option) => option.length > 0);
    if (normalized.length < 2) {
      throw new Error(
        `prewritten poll at index ${index}: at least two options are required`
      );
    }
    poll.options = normalized;
  }

  seenIds.add(id);
  return poll;
}

function normalizePollType(value: unknown, index: number): PollType {
  if (value === "slider" || value === "multiple_choice") {
    return value;
  }
  throw new Error(`prewritten poll at index ${index} has invalid poll type`);
}
