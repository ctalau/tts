import { expect, test } from "@playwright/test";

test("loads the studio and generates playable audio in-browser", async ({ page }) => {
  const browserErrors = [];
  page.on("pageerror", (error) => browserErrors.push(error.message));

  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Give your words a voice/ })).toBeVisible();
  await page.getByLabel("Your script").fill("Hello from Kokoro.");
  await page.getByRole("button", { name: "Create voice" }).click();

  const player = page.getByTestId("audio-player");
  await expect(player).toBeVisible({ timeout: 350_000 });
  const audioDetails = await player.evaluate((audio) => ({
    source: audio.currentSrc,
    canPlayWav: audio.canPlayType("audio/wav"),
  }));
  expect(audioDetails.source).toMatch(/^blob:/);
  expect(audioDetails.canPlayWav).toBeTruthy();
  expect(browserErrors).toEqual([]);
});
