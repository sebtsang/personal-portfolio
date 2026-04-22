import { test, expect } from "@playwright/test";

async function openContactPage(page: import("@playwright/test").Page) {
  await page.goto("/contact");
  // /contact is a deep-link that skips the landing flip
  // Wait for the contact page to appear
  await page.locator("h1").filter({ hasText: /contact/i }).first().waitFor({
    state: "visible",
    timeout: 10000,
  });
}

test.describe("Contact page", () => {
  test("contact page heading is visible", async ({ page }) => {
    await openContactPage(page);
    const heading = page.locator("h1").filter({ hasText: /contact/i }).first();
    await expect(heading).toBeVisible();
  });

  test("email address link is present", async ({ page }) => {
    await openContactPage(page);
    const emailLink = page.locator('a[href^="mailto:"]').first();
    await expect(emailLink).toBeVisible({ timeout: 5000 });
    const href = await emailLink.getAttribute("href");
    expect(href).toMatch(/mailto:/);
  });

  test("email click copies to clipboard and shows Copied feedback", async ({ page }) => {
    await openContactPage(page);
    // Grant clipboard permissions
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);

    const emailLink = page.locator('a[href^="mailto:"]').first();
    await expect(emailLink).toBeVisible({ timeout: 5000 });
    await emailLink.click();

    // After clicking, "Copied" feedback should appear
    await expect(
      page.locator("text=/copied/i").first()
    ).toBeVisible({ timeout: 3000 });
  });

  test("external links have target=_blank and rel=noopener noreferrer", async ({ page }) => {
    await openContactPage(page);
    // LinkedIn, GitHub, Twitter links should be external
    const externalLinks = page.locator('a[href^="https://"]');
    const count = await externalLinks.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const link = externalLinks.nth(i);
      const target = await link.getAttribute("target");
      const rel = await link.getAttribute("rel");
      expect(target).toBe("_blank");
      expect(rel).toContain("noopener");
      expect(rel).toContain("noreferrer");
    }
  });

  test("LinkedIn link points to correct URL", async ({ page }) => {
    await openContactPage(page);
    const liLink = page.locator('a[href*="linkedin.com"]').first();
    await expect(liLink).toBeVisible({ timeout: 5000 });
    const href = await liLink.getAttribute("href");
    expect(href).toContain("linkedin.com");
  });

  test("GitHub link points to correct URL", async ({ page }) => {
    await openContactPage(page);
    const ghLink = page.locator('a[href*="github.com"]').first();
    await expect(ghLink).toBeVisible({ timeout: 5000 });
    const href = await ghLink.getAttribute("href");
    expect(href).toContain("github.com");
  });
});
