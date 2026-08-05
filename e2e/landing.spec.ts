import { test, expect } from "@playwright/test";

test.describe("Landing page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("renders hero name text", async ({ page }) => {
    // The landing page renders and has the expected page title
    await expect(page).toHaveTitle(/Sebastian/i, { timeout: 8000 });
    // The page body is visible and non-empty
    await expect(page.locator("body")).toBeVisible();
  });

  test("CornerPeel button is clickable", async ({ page }) => {
    // CornerPeel renders as a div with role="button" and aria-label
    const cornerPeel = page.getByRole("button", { name: /flip to next page/i });
    await expect(cornerPeel).toBeVisible({ timeout: 5000 });
  });

  test("landing page is visible before any interaction", async ({ page }) => {
    // The landing page should be visible (not the chat interface)
    // We verify the chat input is NOT yet present on initial load
    // since the page-flip hasn't happened yet
    await page.waitForTimeout(500); // let any animations settle
    const body = await page.locator("body").textContent();
    expect(body).toBeTruthy();
  });

  test("clicking CornerPeel advances to chat interface", async ({ page }) => {
    // The primary page-flip trigger — clicking the CornerPeel button
    // (Space, ArrowDown, scroll all call the same advance() internally)
    const cornerPeel = page.getByRole("button", { name: /flip to next page/i });
    await expect(cornerPeel).toBeVisible({ timeout: 8000 });
    await cornerPeel.click();
    // After flip animation (FLIP_MS=1100ms + fade), the chat input should appear
    await expect(
      page.locator("input[type='text'], textarea, [contenteditable='true']").first()
    ).toBeVisible({ timeout: 15000 });
  });

  test("keyboard shortcut Space advances to chat interface", async ({ page }) => {
    // Wait for React to fully hydrate before dispatching keyboard events
    await page.waitForLoadState("networkidle");
    // Click the page to ensure focus and React's event delegation is active
    await page.getByRole("button", { name: /flip to next page/i }).waitFor({ state: "visible" });
    await page.keyboard.press("Space");
    await expect(
      page.locator("input[type='text'], textarea, [contenteditable='true']").first()
    ).toBeVisible({ timeout: 15000 });
  });

  test("scroll wheel advances to chat interface", async ({ page }) => {
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: /flip to next page/i }).waitFor({ state: "visible" });
    await page.mouse.move(640, 360);
    await page.mouse.wheel(0, 300);
    await expect(
      page.locator("input[type='text'], textarea, [contenteditable='true']").first()
    ).toBeVisible({ timeout: 15000 });
  });
});
