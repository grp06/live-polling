/** @jest-environment jsdom */

import React, { act } from "react";
import { createRoot } from "react-dom/client";

import { usePollState } from "../hooks/usePollState";

const makeResponse = () =>
  Promise.resolve({
    ok: true,
    json: async () => ({
      poll: null,
      count: 0,
      avg: null,
      histogram: [],
      userVote: null,
      history: [],
    }),
  });

function TestHarness({
  storageKey,
  pollIntervalMs,
}: {
  storageKey: string;
  pollIntervalMs?: number;
}) {
  const { state, error, anonId } = usePollState({
    storageKey,
    pollIntervalMs,
  });

  return React.createElement(
    "div",
    null,
    React.createElement("span", { "data-testid": "anonId" }, anonId ?? ""),
    React.createElement("span", { "data-testid": "error" }, error ?? ""),
    React.createElement("span", { "data-testid": "count" }, state?.count ?? "")
  );
}

describe("usePollState", () => {
  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    jest.useFakeTimers();
    global.fetch = jest.fn(makeResponse) as unknown as typeof fetch;
  });

  afterEach(() => {
    jest.useRealTimers();
    localStorage.clear();
    jest.resetAllMocks();
    globalThis.IS_REACT_ACT_ENVIRONMENT = false;
  });

  it("fetches state on mount and polls on interval", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        React.createElement(TestHarness, {
          storageKey: "test-anon",
          pollIntervalMs: 1000,
        })
      );
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(global.fetch).toHaveBeenCalledTimes(2);

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it("uses the provided localStorage key", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        React.createElement(TestHarness, {
          storageKey: "custom-key",
        })
      );
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(localStorage.getItem("custom-key")).not.toBeNull();

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });
});
