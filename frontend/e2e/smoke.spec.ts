import { test, expect } from "@playwright/test";
import { waitForDashboard } from "./helpers";

test.describe("World Cup Predictor smoke", () => {
  test("loads dashboard with champion odds", async ({ page }) => {
    await waitForDashboard(page);

    await expect(
      page.getByRole("region", { name: /title race/i }),
    ).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Main navigation" })).toBeVisible();
  });

  test("opens bracket tab from URL", async ({ page }) => {
    await waitForDashboard(page, "/?tab=bracket");

    await expect(page).toHaveURL(/\?tab=bracket/);
    await expect(
      page
        .getByRole("navigation", { name: "Main navigation" })
        .getByRole("button", { name: "Knockout" }),
    ).toHaveAttribute("aria-current", "page");
    await expect(
      page.getByRole("heading", { name: "Projected knockout bracket" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Round of 32", exact: true }),
    ).toBeVisible();
  });

  test("navigates to bracket via sidebar", async ({ page }) => {
    await waitForDashboard(page);

    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("button", { name: "Knockout" })
      .click();

    await expect(page).toHaveURL(/\?tab=bracket/);
    await expect(
      page.getByRole("heading", { name: "Projected knockout bracket" }),
    ).toBeVisible();
  });

  test("loads standalone guide", async ({ page }) => {
    await page.goto("/guide");
    await expect(page.getByText("Loading projections…")).toBeHidden({
      timeout: 30_000,
    });

    await expect(
      page.getByRole("heading", {
        name: "How the World Cup Probability Engine Works",
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Back to dashboard" }),
    ).toBeVisible();
    await expect(
      page.getByRole("navigation", { name: "Guide sections" }),
    ).toBeVisible();
  });

  test("opens team detail from title odds board", async ({ page }) => {
    await waitForDashboard(page);

    const firstTeam = page.getByRole("button", { name: /title odds/i }).first();
    await expect(firstTeam).toBeVisible();
    await firstTeam.click();

    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("button", { name: "Close team detail" })).toBeVisible();

    await page.getByRole("button", { name: "Close team detail" }).click();
    await expect(page.getByRole("dialog")).toBeHidden();
  });
});
