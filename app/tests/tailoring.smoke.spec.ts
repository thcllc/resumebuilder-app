import { readFile } from "node:fs/promises";
import { expect, test } from "playwright/test";

test("non-Vercel JD produces computed patches that can be accepted and exported", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const printState = window as unknown as { __resumePrintCalled: boolean };
    printState.__resumePrintCalled = false;
    window.localStorage.clear();
    Object.defineProperty(window, "print", {
      value: () => {
        printState.__resumePrintCalled = true;
      },
      writable: true,
    });
  });

  await page.goto("/#editor");
  await page.getByLabel("Name").fill("Jordan Kim");
  await page.getByRole("button", { name: "Tailor" }).click();

  await page.getByLabel("Job description").fill(`Nimbus Labs - Senior Platform Product Designer

Nimbus Labs is hiring for a platform design role focused on developer experience, API design, dashboards, and design systems.

What you will do
- Shape API design workflows with engineers
- Improve developer experience across platform dashboards
- Evolve design systems and production prototyping practices`);

  await expect(
    page.getByRole("heading", { name: "Senior Platform Product Designer" }),
  ).toBeVisible();
  await expect(page.getByText("Nimbus Labs - pasted locally")).toBeVisible();
  await expect(page.getByText("Vercel - Remote - pasted locally")).toHaveCount(0);
  await expect(page.getByText("API Design").first()).toBeVisible();
  await expect(page.getByText("Developer Experience").first()).toBeVisible();
  await expect(page.getByText("Lead with platform because the JD opens there.")).toHaveCount(0);

  await page.getByRole("button", { name: /Review diff/i }).click();
  await expect(page).toHaveURL(/#diff$/);
  await expect(page.getByText(/Use JD language already supported/)).toBeVisible();

  await page.getByRole("button", { name: /Accept all/i }).click();
  await expect(page).toHaveURL(/#editor$/);
  await expect(page.locator("textarea").last()).toHaveValue(/API Design/);

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "JSON" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("resume.json");

  const path = await download.path();
  if (!path) throw new Error("Expected JSON export to produce a readable download.");
  const exportedResume = JSON.parse(await readFile(path, "utf8")) as {
    skills: Array<{ keywords: string[] }>;
  };
  expect(exportedResume.skills[0]?.keywords).toContain("API Design");

  await page.getByRole("button", { name: "Print" }).first().click();
  await expect
    .poll(() =>
      page.evaluate(() => (window as unknown as { __resumePrintCalled: boolean }).__resumePrintCalled),
    )
    .toBe(true);
});
