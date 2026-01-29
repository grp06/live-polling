import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { PageShell } from "@/components/PageShell";

type VariantSpec = {
  variant: "default" | "admin" | "adminLite";
  expected: number;
  label: string;
};

const variants: VariantSpec[] = [
  { variant: "default", expected: 8, label: "Default content" },
  { variant: "admin", expected: 8, label: "Admin content" },
  { variant: "adminLite", expected: 4, label: "Lite content" },
];

describe("PageShell", () => {
  it.each(variants)("renders %s variant", ({ variant, expected, label }) => {
    const html = renderToStaticMarkup(
      React.createElement(PageShell, { variant }, label)
    );

    expect(html).toContain(label);
    expect(html.match(/animate-drift/g) ?? []).toHaveLength(expected);
  });
});
