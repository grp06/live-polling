import { readFile } from "node:fs/promises";
import path from "node:path";

import { type PrewrittenPoll } from "./pollTypes";
import { normalizeOptions, requirePollType } from "./pollValidation";

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

  const type = requirePollType(
    record.type,
    `prewritten poll at index ${index} has invalid poll type`
  );

  const poll: PrewrittenPoll = {
    id,
    type,
    question,
  };

  if (type === "multiple_choice") {
    poll.options = normalizeOptions(record.options, {
      missing: `prewritten poll at index ${index}: options are required`,
      nonString: `prewritten poll at index ${index} options must be strings`,
      minCount: `prewritten poll at index ${index}: at least two options are required`,
    });
  }

  seenIds.add(id);
  return poll;
}
