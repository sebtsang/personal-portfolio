import { test, expect } from "@playwright/test";

// Deep-link routes skip the landing flip and pre-load the split view.
// NotebookShell receives `initialView` prop from the route page.

const DEEP_LINKS = [
  { path: "/contact", headingText: /contact/i },
  { path: "/about", headingText: /about/i },
  { path: "/experience", headingText: /experience/i },
  { path: "/linkedin", headingText: /linkedin/i },
] as const;

test.describe("Deep-link routes", () => {
  for (const { path, headingText } of DEEP_LINKS) {
    test(`${path} shows correct view immediately without page-flip`, async ({ page }) => {
      await page.goto(path);

      // The split-view content should be visible without any user interaction
      const heading = page.locator("h1").filter({ hasText: headingText }).first();
      await expect(heading).toBeVisible({ timeout: 10000 });
    });

    test(`${path} does not require Space/scroll to reveal content`, async ({ page }) => {
      await page.goto(path);
      // Immediately check — no keyboard/mouse interaction
      const heading = page.locator("h1").filter({ hasText: headingText }).first();
      // Should be visible within a short timeout — no animation wait needed
      await expect(heading).toBeVisible({ timeout: 8000 });
    });
  }

  test("deep-link pages render chat input alongside split view", async ({ page }) => {
    await page.goto("/about");
    // Both heading and chat input should be present simultaneously
    const heading = page.locator("h1").filter({ hasText: /about/i }).first();
    await expect(heading).toBeVisible({ timeout: 8000 });
    const input = page.locator("input[type='text'], textarea, [contenteditable='true']").first();
    await expect(input).toBeVisible({ timeout: 8000 });
  });

  test("deep-link /contact page title contains 'Contact'", async ({ page }) => {
    await page.goto("/contact");
    await expect(page).toHaveTitle(/Contact/i, { timeout: 8000 });
  });

  test("deep-link /about page title contains 'About'", async ({ page }) => {
    await page.goto("/about");
    await expect(page).toHaveTitle(/About/i, { timeout: 8000 });
  });
});
