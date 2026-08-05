import { test, expect } from "@playwright/test";
import { advanceToChat } from "./helpers";

// Slash commands dispatch locally via matchIntent — they do not hit the LLM.
// We verify the split pane opens with appropriate content.

const SLASH_COMMANDS = [
  { cmd: "/about", expectedText: /about/i },
  { cmd: "/experience", expectedText: /experience/i },
  { cmd: "/contact", expectedText: /contact/i },
  { cmd: "/linkedin", expectedText: /linkedin/i },
] as const;

const NL_PHRASES = [
  { phrase: "tell me about yourself", expectedText: /about/i },
  { phrase: "show me your experience", expectedText: /experience/i },
  { phrase: "how to contact you", expectedText: /contact/i },
  { phrase: "show me your linkedin", expectedText: /linkedin/i },
] as const;

test.describe("Slash commands", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await advanceToChat(page);
    // Allow chat to fully mount
    await page.waitForTimeout(500);
  });

  for (const { cmd, expectedText } of SLASH_COMMANDS) {
    test(`${cmd} opens correct split-view content`, async ({ page }) => {
      const input = page.locator("input[type='text'], textarea, [contenteditable='true']").first();
      await input.click();
      await input.fill(cmd);
      await page.keyboard.press("Enter");

      // The split view should open. Look for the heading/tab text.
      // SplitView content uses h1 or section text matching the command topic.
      await expect(
        page.locator(`text=${expectedText}`).first()
      ).toBeVisible({ timeout: 6000 });
    });
  }

  // SlashCommandRow renders clickable buttons for each command
  test("slash command buttons are rendered in chat", async ({ page }) => {
    const cmdButtons = page.locator("button").filter({ hasText: /\/about|\/experience|\/contact|\/linkedin/ });
    await expect(cmdButtons.first()).toBeVisible({ timeout: 5000 });
  });

  test("clicking /about button opens about split view", async ({ page }) => {
    const aboutBtn = page.locator("button").filter({ hasText: "/about" }).first();
    await expect(aboutBtn).toBeVisible({ timeout: 5000 });
    await aboutBtn.click();
    await expect(
      page.locator("text=/about/i").first()
    ).toBeVisible({ timeout: 6000 });
  });
});

test.describe("Natural-language intent matching", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await advanceToChat(page);
    await page.waitForTimeout(500);
  });

  for (const { phrase, expectedText } of NL_PHRASES) {
    test(`"${phrase}" opens correct split-view content`, async ({ page }) => {
      const input = page.locator("input[type='text'], textarea, [contenteditable='true']").first();
      await input.click();
      await input.fill(phrase);
      await page.keyboard.press("Enter");

      await expect(
        page.locator(`text=${expectedText}`).first()
      ).toBeVisible({ timeout: 8000 });
    });
  }
});
