import { chromium, type FullConfig } from "@playwright/test";

/**
 * Global setup: warm up Next.js dev server by navigating to all key pages.
 * This triggers on-demand compilation of JS chunks so tests run with hydrated React.
 */
async function globalSetup(config: FullConfig) {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const baseURL = config.projects[0].use.baseURL ?? "http://localhost:3000";
  const pagesToWarm = ["/", "/home", "/about", "/experience", "/contact", "/linkedin"];

  console.log("[setup] Warming up Next.js dev server pages...");
  for (const path of pagesToWarm) {
    try {
      await page.goto(`${baseURL}${path}`, { waitUntil: "networkidle", timeout: 60000 });
      console.log(`[setup] Warmed: ${path}`);
    } catch (e) {
      console.warn(`[setup] Warmup failed for ${path}:`, e);
    }
  }

  // Also warm up the chat interface by advancing from the landing page.
  // This triggers compilation of any dynamically-imported chat components.
  console.log("[setup] Triggering chat mount to compile dynamic imports...");
  try {
    await page.goto(`${baseURL}/`, { waitUntil: "networkidle", timeout: 60000 });
    const cornerPeel = page.getByRole("button", { name: /flip to next page/i });
    await cornerPeel.waitFor({ state: "visible", timeout: 10000 });
    await cornerPeel.click();
    // Wait for chat input to appear (confirms chat components compiled)
    await page.locator("input[type='text'], textarea").first().waitFor({ state: "visible", timeout: 15000 });
    console.log("[setup] Chat interface compiled.");
  } catch (e) {
    console.warn("[setup] Chat warmup failed:", e);
  }

  await browser.close();
  console.log("[setup] Warmup complete.");
}

export default globalSetup;
