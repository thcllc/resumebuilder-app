import { readFile } from "node:fs/promises";
import { expect, test } from "playwright/test";

test("non-Vercel JD produces computed patches that can be accepted and exported", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: async (text: string) => {
          (window as unknown as { __resumeCopiedText: string }).__resumeCopiedText = text;
        },
      },
      configurable: true,
    });
    window.localStorage.clear();
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

  await page.getByRole("button", { name: "Versions" }).click();
  await expect(page.getByText("Nimbus Labs - Senior Platform Product Designer")).toBeVisible();
  await page
    .getByLabel("Status for Nimbus Labs - Senior Platform Product Designer")
    .selectOption("applied");
  await expect(
    page.getByLabel("Status for Nimbus Labs - Senior Platform Product Designer"),
  ).toHaveValue("applied");
  await page.getByRole("button", { name: "Open", exact: true }).click();
  await expect(page).toHaveURL(/#editor$/);
  await expect(page.getByText("Editing fork:")).toBeVisible();

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

  const pdfDownloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "PDF" }).first().click();
  const pdfDownload = await pdfDownloadPromise;
  expect(pdfDownload.suggestedFilename()).toBe("jordan-kim.pdf");

  const pdfPath = await pdfDownload.path();
  if (!pdfPath) throw new Error("Expected PDF export to produce a readable download.");
  const pdfText = await readFile(pdfPath, "utf8");
  expect(pdfText.startsWith("%PDF-1.4")).toBe(true);
  expect(pdfText).toContain("Jordan Kim");

  await page.getByLabel("Primary").getByRole("button", { name: "Letter" }).click();
  await expect(page.getByRole("heading", { name: "Nimbus Labs" })).toBeVisible();
  await expect(page.getByText("Generated locally from the current resume and pasted JD.")).toBeVisible();
  await expect(page.getByText("Vercel - Hiring Team")).toHaveCount(0);

  await page.getByLabel("Primary").getByRole("button", { name: "Outreach" }).click();
  await expect(page.getByText("Nimbus Labs").first()).toBeVisible();
  await expect(page.getByText("Senior Platform Product Designer").first()).toBeVisible();
  await page.getByRole("button", { name: "Copy" }).first().click();
  await expect
    .poll(() =>
      page.evaluate(() => (window as unknown as { __resumeCopiedText: string }).__resumeCopiedText),
    )
    .toContain("Nimbus Labs");

  await page.getByLabel("Primary").getByRole("button", { name: "Interview" }).click();
  await expect(page.getByText("How would you approach").first()).toBeVisible();
  await expect(page.getByText("Nimbus Labs").first()).toBeVisible();
  await expect(page.getByText("sample content until generated")).toHaveCount(0);

  await page.getByLabel("Primary").getByRole("button", { name: "Social" }).click();
  await expect(page.getByText("Profile score")).toBeVisible();
  await expect(page.getByText("Nimbus Labs").first()).toBeVisible();
  await expect(page.getByText("Social profile polish is parked")).toHaveCount(0);
  await page.getByRole("button", { name: "Old posts" }).click();
  await expect(page.getByText("before applying", { exact: true })).toBeVisible();
  await expect(page.getByText("Nimbus Labs").first()).toBeVisible();

  await page.getByLabel("Primary").getByRole("button", { name: "Self-host" }).click();
  await expect(page.getByText("docker build -t resumebuilderapp")).toBeVisible();
  await expect(page.getByText("node cli/resume.mjs export")).toBeVisible();
  await expect(page.getByText("node cli/resume.mjs validate")).toBeVisible();
  await expect(page.getByText("node cli/resume.mjs accept")).toBeVisible();
  await expect(page.getByText("node cli/resume.mjs release")).toBeVisible();
  await expect(page.getByText("../receipts/ACCEPTED_RECEIPTS.json").first()).toBeVisible();
  await expect(page.getByText("roadmap placeholders")).toHaveCount(0);

  await page.getByLabel("Primary").getByRole("button", { name: "Validate" }).click();
  await expect(page.getByRole("heading", { name: "Export evidence the core loop worked." })).toBeVisible();
  await expect(page.getByRole("button", { name: "Start new run" })).toBeVisible();
  await expect(page.getByText("Core flow")).toBeVisible();
  await expect(page.getByText("Validation campaign pack")).toBeVisible();
  await expect(page.getByText("I need a no-account validation run for Resume Builder.")).toBeVisible();
  await expect(page.getByText("Owner intake command")).toBeVisible();
  await expect(page.getByText("node app/cli/resume.mjs validate")).toBeVisible();
  await expect(page.getByText("node app/cli/resume.mjs accept")).toBeVisible();
  await expect(page.getByText("node app/cli/resume.mjs release")).toBeVisible();
  await expect(page.getByText("receipts/ACCEPTED_RECEIPTS.json").first()).toBeVisible();
  await expect(page.getByText("Tester handoff")).toBeVisible();
  await expect(page.getByText("https://resumebuilder.app/#validate", { exact: true })).toBeVisible();
  await expect(page.getByText("Outcome follow-up:")).toBeVisible();
  await expect(page.getByRole("button", { name: "Export receipt" })).toBeDisabled();
  await expect(page.getByText("Complete", { exact: true })).toHaveCount(0);
  await page.getByLabel("No operator assistance").check();
  await expect(page.getByText("Complete", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Tester label is non-anonymous")).toBeVisible();
  await page.getByLabel("Tester label").fill("tester-01");
  await expect(page.getByText("Complete", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Export receipt" })).toBeEnabled();
  await page.getByLabel("Outcome", { exact: true }).selectOption("interview");
  await page.getByLabel("Outcome notes").fill("Recruiter screen booked after sending the tailored PDF.");

  const receiptPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export receipt" }).click();
  const receiptDownload = await receiptPromise;
  expect(receiptDownload.suggestedFilename()).toMatch(/^rbv-[a-f0-9]{8}\.json$/);

  const receiptPath = await receiptDownload.path();
  if (!receiptPath) throw new Error("Expected validation receipt to produce a readable download.");
  const receipt = JSON.parse(await readFile(receiptPath, "utf8")) as {
    schema: string;
    run: { id: string; startedAt: string };
    completion: { coreFlowComplete: boolean; interviewOutcomeRecorded: boolean };
    attestations: { noOperatorAssistance: boolean };
    privacy: { containsResumeBody: boolean; containsJobDescriptionBody: boolean };
    integrity: { algorithm: string; digest: string };
  };
  expect(receipt.schema).toBe("resumebuilder.validation.v1");
  expect(receipt.run.id).toMatch(/^run-[a-f0-9]{8}$/);
  expect(Date.parse(receipt.run.startedAt)).not.toBeNaN();
  expect(receipt.completion.coreFlowComplete).toBe(true);
  expect(receipt.completion.interviewOutcomeRecorded).toBe(true);
  expect(receipt.attestations.noOperatorAssistance).toBe(true);
  expect(receipt.privacy.containsResumeBody).toBe(false);
  expect(receipt.privacy.containsJobDescriptionBody).toBe(false);
  expect(receipt.integrity).toMatchObject({
    algorithm: "fnv1a-stable-v1",
    digest: expect.stringMatching(/^[a-f0-9]{8}$/),
  });
});
