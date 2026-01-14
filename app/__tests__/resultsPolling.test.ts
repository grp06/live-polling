/** @jest-environment jsdom */

import React, { act } from "react";
import { createRoot } from "react-dom/client";

import ResultsPage from "@/app/results/page";

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

describe("ResultsPage polling", () => {
  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    jest.useFakeTimers();
    localStorage.setItem("resultsAnonId", "test-results-id");
    global.fetch = jest.fn(makeResponse) as unknown as typeof fetch;
  });

  afterEach(() => {
    jest.useRealTimers();
    localStorage.clear();
    jest.resetAllMocks();
    globalThis.IS_REACT_ACT_ENVIRONMENT = false;
  });

  it("keeps polling when no active poll is present", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(ResultsPage));
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
});
