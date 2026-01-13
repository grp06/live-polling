export const POLL_MIN = 0;
export const POLL_MAX = 10;

export const KEY_ACTIVE = "poll:active";
export const KEY_HISTORY = "poll:history";

export const keyVotes = (pollId: string) => `poll:votes:${pollId}`;

export type PollType = "slider" | "multiple_choice";

export type ActivePoll = {
  id: string;
  question: string;
  openedAt: string;
  type: PollType;
  options?: string[];
};

export type ClosedPollSummary = {
  id: string;
  question: string;
  openedAt: string;
  closedAt: string;
  type: PollType;
  options?: string[];
  count: number;
  avg: number | null;
  histogram: number[];
};

export type PollState = {
  poll: ActivePoll | null;
  count: number;
  avg: number | null;
  histogram: number[];
  userVote: number | null;
  history: ClosedPollSummary[];
};

export type PrewrittenPoll = {
  id: string;
  type: PollType;
  question: string;
  options?: string[];
};
