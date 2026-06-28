import { expect, type Page } from "@playwright/test";

/** Wait until app_state.json has loaded and the dashboard shell is interactive. */
export async function waitForDashboard(page: Page, path = "/") {
  await page.goto(path);
  await expect(page.getByText("Loading projections…")).toBeHidden({
    timeout: 30_000,
  });
  await expect(page.locator("#main-content")).toBeVisible();
}
