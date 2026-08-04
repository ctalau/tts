import { expect, test } from "@playwright/test";

test("loads the studio and generates playable audio in-browser", async ({ page }) => {
  const browserErrors = [];
  page.on("pageerror", (error) => browserErrors.push(error.message));

  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Give your words a voice/ })).toBeVisible();
  await page.getByLabel("Your script").fill("[0] Hello from Kokoro.\n[2] This starts two seconds later.");
  await page.getByRole("button", { name: "Create voice" }).click();

  const player = page.getByTestId("audio-player");
  await expect(player).toBeVisible({ timeout: 350_000 });
  const audioDetails = await player.evaluate((audio) => ({
    source: audio.currentSrc,
    canPlayWav: audio.canPlayType("audio/wav"),
    duration: audio.duration,
  }));
  expect(audioDetails.source).toMatch(/^blob:/);
  expect(audioDetails.canPlayWav).toBeTruthy();
  expect(audioDetails.duration).toBeGreaterThan(2);
  expect(browserErrors).toEqual([]);
});
