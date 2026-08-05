import { type Page } from "@playwright/test";

/**
 * Advance from the landing page to the chat interface by pressing Space.
 * Waits for the chat input to appear.
 */
export async function advanceToChat(page: Page): Promise<void> {
  // Give landing page time to fully mount
  await page.waitForTimeout(2000);
  await page.keyboard.press("Space");
  // Wait for chat textarea/input to appear
  await page.locator("input[type='text'], textarea, [contenteditable='true']").first().waitFor({ state: "visible", timeout: 10000 });
}

/**
 * Type a message into the chat input and submit it.
 */
export async function sendChatMessage(page: Page, text: string): Promise<void> {
  const input = page.locator("input[type='text'], textarea, [contenteditable='true']").first();
  await input.click();
  await input.fill(text);
  await page.keyboard.press("Enter");
}
