import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { PollResults } from "@/components/PollResults";

const buildHistogram = () => Array.from({ length: 11 }, (_, index) => index);

describe("PollResults", () => {
  it("renders slider histogram as vertical bars", () => {
    const html = renderToStaticMarkup(
      React.createElement(PollResults, {
        count: 11,
        avg: 5,
        histogram: buildHistogram(),
        pollType: "slider",
      })
    );

    expect(html).toContain("data-result=\"slider\"");
    expect(html).toContain("data-orientation=\"vertical\"");
    expect(html).toContain("grid-cols-11");
  });
});
