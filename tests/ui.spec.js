import { test, expect } from "@playwright/test";
test("learner can filter, complete a quiz and review persisted results", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Try student demo" }).click();
  await expect(
    page.getByRole("heading", { name: /Good .*Aaditya/ }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Explore quizzes", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: "Find your next challenge." }),
  ).toBeVisible();
  await page
    .getByRole("main")
    .getByRole("searchbox", { name: "Search quizzes" })
    .fill("no-such-quiz");
  await expect(page.getByText("No quizzes found")).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).click();
  await page
    .getByRole("article")
    .filter({ hasText: "Web development essentials" })
    .getByRole("button", { name: "Start quiz" })
    .click();
  await page.getByRole("button", { name: "Begin quiz" }).click();
  for (let i = 0; i < 5; i++) {
    await page.getByRole("radio").nth([0, 1, 0, 2, 3][i]).check();
    await expect(page.getByText("All answers saved")).toBeVisible();
    if (i < 4)
      await page.getByRole("button", { name: "Next question" }).click();
  }
  await page.getByRole("button", { name: "Finish quiz" }).click();
  await page.getByRole("button", { name: "Submit quiz", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Perfectly done!" }),
  ).toBeVisible();
  await expect(page.getByText("100%", { exact: true }).first()).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Perfectly done!" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Back to overview" }).click();
  await page.getByRole("button", { name: "Your account" }).click();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Welcome to your next chapter." }),
  ).toBeVisible();
});
test("admin can author, edit and archive a quiz", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Try admin demo" }).click();
  await page.getByRole("link", { name: "Manage quizzes" }).click();
  await page.getByRole("button", { name: "Create quiz", exact: true }).click();
  await page.getByLabel("Quiz title").fill("Presentation test quiz");
  await page
    .getByLabel("Description", { exact: true })
    .fill("A short quiz for the presentation.");
  await page
    .getByLabel("Question 1", { exact: true })
    .fill("Which number is even?");
  for (let i = 0; i < 4; i++)
    await page
      .getByLabel(`Option ${String.fromCharCode(65 + i)}`, { exact: true })
      .fill(["2", "3", "5", "7"][i]);
  await page
    .getByLabel("Explanation", { exact: true })
    .fill("Two is divisible by two.");
  await page.getByRole("button", { name: "Publish quiz" }).click();
  const row = page
    .getByRole("row")
    .filter({ hasText: "Presentation test quiz" });
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: "Edit quiz" }).click();
  await page.getByLabel("Quiz title").fill("Presentation quiz updated");
  await page.getByRole("button", { name: "Save changes" }).click();
  const updated = page
    .getByRole("row")
    .filter({ hasText: "Presentation quiz updated" });
  await updated.getByRole("button", { name: "Archive quiz" }).click();
  await page
    .getByRole("button", { name: "Archive quiz", exact: true })
    .last()
    .click();
  await expect(page.getByText("Quiz archived.")).toBeVisible();
});
test("narrow viewport and keyboard dialog work", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Try student demo" }).click();
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page
    .getByRole("link", { name: "Explore quizzes", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: "Find your next challenge." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Start quiz" }).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
test("saved answers survive reload and failed saves have recovery", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Try student demo" }).click();
  await expect(page.getByRole("heading", { name: /Good/ })).toBeVisible();
  await page
    .getByRole("link", { name: "Explore quizzes", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: "Find your next challenge." }),
  ).toBeVisible();
  await page
    .getByRole("article")
    .filter({ hasText: "Database fundamentals" })
    .getByRole("button", { name: "Start quiz" })
    .click();
  await page.getByRole("button", { name: "Begin quiz" }).click();
  await page.getByRole("radio").nth(1).check();
  await expect(page.getByText("All answers saved")).toBeVisible();
  await page.reload();
  await expect(page.getByRole("radio").nth(1)).toBeChecked();
  await page.route("**/api/attempts/*", async (route) => {
    if (route.request().method() === "PATCH") await route.abort();
    else await route.continue();
  });
  await page.getByRole("radio").nth(0).check();
  await expect(page.getByRole("alert")).toContainText("Cannot connect");
  await page.unroute("**/api/attempts/*");
  await page.getByRole("radio").nth(2).check();
  await expect(page.getByText("All answers saved")).toBeVisible();
});
test("core screens have no serious accessibility violations", async ({
  page,
}) => {
  const { default: AxeBuilder } = await import("@axe-core/playwright");
  await page.goto("/");
  const check = async () => {
    const { violations } = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => ({
          target: n.target,
          summary: n.failureSummary,
        })),
      })),
    ).toEqual([]);
  };
  await check();
  await page.getByRole("button", { name: "Try student demo" }).click();
  await expect(page.getByRole("heading", { name: /Good/ })).toBeVisible();
  await check();
  await page
    .getByRole("link", { name: "Explore quizzes", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: "Find your next challenge." }),
  ).toBeVisible();
  await check();
});
test("leaderboard updates in another open tab when a score is submitted", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Try student demo" }).click();
  await page.getByRole("link", { name: "Leaderboard", exact: true }).click();
  await expect(page.getByText("Live updates", { exact: true })).toBeVisible();
  const row = page.getByRole("row").filter({ hasText: "Aaditya J." });
  const before = (await row.count())
    ? Number(await row.getByRole("cell").nth(2).innerText())
    : 0;
  const taker = await context.newPage();
  await taker.goto("/");
  const started = await taker.request.post("/api/quizzes/5/start", {
    data: {},
  });
  const a = await started.json();
  expect(started.ok()).toBe(true);
  const submitted = await taker.request.post(`/api/attempts/${a.id}/submit`, {
    data: { answers: [0, 1, 2, 3, 0] },
  });
  expect(submitted.ok()).toBe(true);
  await expect(row.getByRole("cell").nth(2)).toHaveText(String(before + 1));
  await taker.close();
});
