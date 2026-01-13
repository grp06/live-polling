import { expect, test } from "@playwright/test";

test("multiple-choice poll renders options and posts selection", async ({ page }) => {
  await page.route("**/api/poll?*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        poll: {
          id: "poll-1",
          question: "Pick a color",
          openedAt: "2026-01-01T00:00:00.000Z",
          type: "multiple_choice",
          options: ["Red", "Blue"],
        },
        count: 2,
        avg: null,
        histogram: [1, 1],
        userVote: null,
        history: [],
      }),
    });
  });

  let votePayload: unknown = null;
  await page.route("**/api/vote", async (route) => {
    votePayload = await route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true }),
    });
  });

  await page.goto("/");

  await expect(page.getByText("Pick a color")).toBeVisible();
  const blueOption = page.getByRole("button", { name: "Blue" });
  await blueOption.click();

  await expect(blueOption).toHaveClass(/border-amber-400/);
  await expect.poll(() => votePayload).not.toBeNull();
  expect(votePayload).toMatchObject({ pollId: "poll-1", value: 1 });
});
