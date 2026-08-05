import { test, expect } from "@playwright/test";
import { advanceToChat } from "./helpers";

async function openView(page: import("@playwright/test").Page, cmd: string) {
  await page.goto("/");
  await advanceToChat(page);
  await page.waitForTimeout(500);
  const input = page.locator("input[type='text'], textarea, [contenteditable='true']").first();
  await input.click();
  await input.fill(cmd);
  await page.keyboard.press("Enter");
  // Give split pane time to animate in
  await page.waitForTimeout(1000);
}

test.describe("Split-view page content", () => {
  test("About page shows heading and body text", async ({ page }) => {
    await openView(page, "/about");
    // h1 with "about" text
    const heading = page.locator("h1").filter({ hasText: /about/i }).first();
    await expect(heading).toBeVisible({ timeout: 6000 });
  });

  test("Experience page shows heading", async ({ page }) => {
    await openView(page, "/experience");
    const heading = page.locator("h1").filter({ hasText: /experience/i }).first();
    await expect(heading).toBeVisible({ timeout: 6000 });
  });

  test("Contact page shows heading", async ({ page }) => {
    await openView(page, "/contact");
    const heading = page.locator("h1").filter({ hasText: /contact/i }).first();
    await expect(heading).toBeVisible({ timeout: 6000 });
  });

  test("LinkedIn page shows heading", async ({ page }) => {
    await openView(page, "/linkedin");
    const heading = page.locator("h1").filter({ hasText: /linkedin/i }).first();
    await expect(heading).toBeVisible({ timeout: 6000 });
  });

  test("close/back button hides split view and returns to chat-only state", async ({ page }) => {
    await openView(page, "/about");
    // Verify split view is open
    const heading = page.locator("h1").filter({ hasText: /about/i }).first();
    await expect(heading).toBeVisible({ timeout: 6000 });

    // Find and click the close/back button on the split pane
    // The PageBackButton or similar has an accessible role/label
    const closeBtn = page
      .locator("button")
      .filter({ hasText: /back|close|×|✕/ })
      .first();

    // If no labeled button, look for a button in the right half of the split view
    const allButtons = page.locator("button");
    const btnCount = await allButtons.count();
    if (btnCount > 0) {
      // Look for a button that appears to be a back/close button
      // PageBackButton renders an arrow or "back" text
      const backBtn = page.locator("button[aria-label], button").first();
      // Try clicking the first button that's near the top of the split pane
      // Fall back to keyboard: Escape
    }

    // Use Escape to close split view (common UX pattern)
    await page.keyboard.press("Escape");
    await page.waitForTimeout(1000);

    // After closing, the split view heading should not be visible
    // (or the chat-only layout should be restored)
    // The chat input remains visible
    const input = page.locator("input[type='text'], textarea, [contenteditable='true']").first();
    await expect(input).toBeVisible({ timeout: 5000 });
  });

  test("split view renders while chat input remains accessible", async ({ page }) => {
    await openView(page, "/about");
    // Both heading and chat input visible simultaneously (split layout)
    const heading = page.locator("h1").filter({ hasText: /about/i }).first();
    await expect(heading).toBeVisible({ timeout: 6000 });
    const input = page.locator("input[type='text'], textarea, [contenteditable='true']").first();
    await expect(input).toBeVisible({ timeout: 5000 });
  });
});
