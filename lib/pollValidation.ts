import { type PollType } from "./pollTypes";

export type OptionValidationMessages = {
  missing: string;
  nonString: string;
  minCount: string;
};

export function requirePollType(
  value: unknown,
  errorMessage: string
): PollType {
  if (value === "slider" || value === "multiple_choice") {
    return value;
  }
  throw new Error(errorMessage);
}

export function normalizeOptions(
  value: unknown,
  messages: OptionValidationMessages
): string[] {
  if (!Array.isArray(value)) {
    throw new Error(messages.missing);
  }
  if (!value.every((option) => typeof option === "string")) {
    throw new Error(messages.nonString);
  }
  const normalized = value
    .map((option) => option.trim())
    .filter((option) => option.length > 0);
  if (normalized.length < 2) {
    throw new Error(messages.minCount);
  }
  return normalized;
}
