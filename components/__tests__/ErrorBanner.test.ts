import { renderToStaticMarkup } from "react-dom/server";

import { ErrorBanner } from "@/components/ErrorBanner";

describe("ErrorBanner", () => {
  it("renders message and expected classes", () => {
    const html = renderToStaticMarkup(
      ErrorBanner({ message: "Oops" })
    );

    expect(html).toContain("Oops");
    expect(html).toContain(
      "rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700"
    );
  });
});
