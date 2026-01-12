export const POLL_MIN = 0;
export const POLL_MAX = 10;

export const KEY_ACTIVE = "poll:active";
export const KEY_HISTORY = "poll:history";

export const keyVotes = (pollId: string) => `poll:votes:${pollId}`;

export type ActivePoll = {
  id: string;
  question: string;
  openedAt: string;
};

export type ClosedPollSummary = {
  id: string;
  question: string;
  openedAt: string;
  closedAt: string;
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
