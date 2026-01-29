"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { type PollState } from "../pollTypes";

type UsePollStateOptions = {
  storageKey: string;
  pollIntervalMs?: number | null;
};

type UsePollStateResult = {
  anonId: string | null;
  state: PollState | null;
  error: string | null;
  refresh: () => Promise<void>;
};

export function usePollState({
  storageKey,
  pollIntervalMs,
}: UsePollStateOptions): UsePollStateResult {
  const [anonId, setAnonId] = useState<string | null>(null);
  const [state, setState] = useState<PollState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isActiveRef = useRef(true);

  useEffect(() => {
    isActiveRef.current = true;
    return () => {
      isActiveRef.current = false;
    };
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      setAnonId(stored);
      return;
    }
    const id = crypto.randomUUID();
    localStorage.setItem(storageKey, id);
    setAnonId(id);
  }, [storageKey]);

  const refresh = useCallback(async () => {
    if (!anonId) {
      return;
    }

    try {
      const response = await fetch(`/api/poll?anonId=${anonId}`);
      const payload = (await response.json()) as PollState & {
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error ?? "failed to load poll state");
      }
      if (!isActiveRef.current) {
        return;
      }
      setState(payload);
      setError(null);
    } catch (err) {
      if (!isActiveRef.current) {
        return;
      }
      const message = err instanceof Error ? err.message : "unknown error";
      setError(message);
    }
  }, [anonId]);

  useEffect(() => {
    if (!anonId) {
      return;
    }

    let cancelled = false;

    const run = async () => {
      if (cancelled) {
        return;
      }
      await refresh();
    };

    void run();

    if (pollIntervalMs === null || pollIntervalMs === undefined) {
      return () => {
        cancelled = true;
      };
    }

    const timer = setInterval(() => {
      if (cancelled) {
        return;
      }
      void refresh();
    }, pollIntervalMs);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [anonId, pollIntervalMs, refresh]);

  return { anonId, state, error, refresh };
}
