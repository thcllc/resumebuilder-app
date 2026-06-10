import { execFile } from "node:child_process";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { expect, test } from "playwright/test";
import { sampleResume, toJsonResume } from "../src/lib/resume";
import { analyzeTailoring } from "../src/lib/tailoring";
import { buildValidationReceipt, createValidationState } from "../src/lib/validation";

const execFileAsync = promisify(execFile);
const jd = `Nimbus Labs - Senior Platform Product Designer

Nimbus Labs is hiring for a platform design role focused on developer experience, API design, dashboards, design systems, and production prototyping.

What you will do
- Shape API design workflows with engineers
- Improve developer experience across platform dashboards
- Evolve design systems and production prototyping practices`;

const validationReceiptFor = ({
  testerLabel,
  noOperatorAssistance = true,
  outcome,
  notes,
  createdAt,
}: {
  testerLabel: string;
  noOperatorAssistance?: boolean;
  outcome: "sent" | "interview" | "offer";
  notes: string;
  createdAt: string;
}) => {
  const analysis = analyzeTailoring(sampleResume, jd);
  return buildValidationReceipt({
    resume: sampleResume,
    jd,
    analysis,
    versions: [
      {
        jd,
        jobTitle: analysis.job.title,
        company: analysis.job.company,
        status: outcome,
        matchScore: analysis.score.tailored,
      },
    ],
    state: {
      ...createValidationState(),
      runId: `run-${testerLabel.replace(/\D/g, "").padStart(8, "0").slice(-8)}`,
      startedAt: "2026-06-10T09:59:00.000Z",
      testerLabel,
      noOperatorAssistance,
      outcome,
      notes,
      reviewedDiffAt: "2026-06-10T10:00:00.000Z",
      acceptedDraftAt: "2026-06-10T10:01:00.000Z",
      exportedJsonAt: "2026-06-10T10:02:00.000Z",
      exportedPdfAt: "2026-06-10T10:03:00.000Z",
    },
    createdAt,
  });
};

test.describe("resume CLI", () => {
  test("scores and exports JSON Resume files", async () => {
    const workspace = await mkdtemp(join(tmpdir(), "resume-cli-"));
    const input = join(workspace, "resume.json");
    const output = join(workspace, "exports");
    await writeFile(input, JSON.stringify(toJsonResume(sampleResume), null, 2));

    const score = await execFileAsync("node", ["cli/resume.mjs", "score", "--input", input], {
      cwd: process.cwd(),
    });
    expect(JSON.parse(score.stdout)).toMatchObject({ score: expect.any(Number) });

    await execFileAsync(
      "node",
      ["cli/resume.mjs", "export", "--input", input, "--out", output, "--json", "--pdf"],
      { cwd: process.cwd() },
    );

    const exportedJson = JSON.parse(await readFile(join(output, "resume.json"), "utf8"));
    const exportedPdf = await readFile(join(output, "resume.pdf"), "utf8");

    expect(exportedJson.basics.name).toBe(sampleResume.basics.name);
    expect(exportedPdf.startsWith("%PDF-1.4")).toBe(true);
    expect(exportedPdf).toContain(sampleResume.basics.name);
  });

  test("audits validation receipt cohorts", async () => {
    const workspace = await mkdtemp(join(tmpdir(), "resume-validation-cli-"));
    await writeFile(
      join(workspace, "tester-01.json"),
      JSON.stringify(
        validationReceiptFor({
          testerLabel: "tester-01",
          outcome: "interview",
          notes: "Recruiter screen booked after sending the tailored PDF.",
          createdAt: "2026-06-10T10:04:00.000Z",
        }),
        null,
        2,
      ),
    );
    await writeFile(
      join(workspace, "tester-02.json"),
      JSON.stringify(
        validationReceiptFor({
          testerLabel: "tester-02",
          outcome: "sent",
          notes: "",
          createdAt: "2026-06-10T10:05:00.000Z",
        }),
        null,
        2,
      ),
    );

    const audit = await execFileAsync(
      "node",
      [
        "cli/resume.mjs",
        "validate",
        "--input",
        workspace,
        "--json",
        "--require-completions",
        "2",
        "--require-interviews",
        "1",
      ],
      { cwd: process.cwd() },
    );
    const report = JSON.parse(audit.stdout);

    expect(report.gates).toMatchObject({
      all: true,
      fiveUserCompletion: true,
      interviewProduction: true,
      noInvalidReceipts: true,
    });
    expect(report.totals).toMatchObject({
      files: 2,
      uniqueCompletionUsers: 2,
      bestInterviewWindowCount: 1,
    });
  });

  test("fails validation audits with tampered receipts", async () => {
    const workspace = await mkdtemp(join(tmpdir(), "resume-validation-cli-fail-"));
    const receipt = validationReceiptFor({
      testerLabel: "tester-01",
      outcome: "interview",
      notes: "Recruiter screen booked.",
      createdAt: "2026-06-10T10:04:00.000Z",
    });
    receipt.metrics.patchCount = 0;
    await writeFile(join(workspace, "tester-01.json"), JSON.stringify(receipt, null, 2));

    try {
      await execFileAsync(
        "node",
        [
          "cli/resume.mjs",
          "validate",
          "--input",
          workspace,
          "--json",
          "--require-completions",
          "1",
          "--require-interviews",
          "1",
        ],
        { cwd: process.cwd() },
      );
      throw new Error("Expected validation audit to fail.");
    } catch (error) {
      const failure = error as { stdout?: string; code?: number };
      expect(failure.code).toBe(1);
      const report = JSON.parse(failure.stdout ?? "{}");
      expect(report.gates.all).toBe(false);
      expect(report.receipts[0].errors).toContain("integrity.digest mismatch");
      expect(report.totals.uniqueCompletionUsers).toBe(0);
    }
  });

  test("does not count receipts without no-assistance attestation", async () => {
    const workspace = await mkdtemp(join(tmpdir(), "resume-validation-assisted-"));
    await writeFile(
      join(workspace, "tester-01.json"),
      JSON.stringify(
        validationReceiptFor({
          testerLabel: "tester-01",
          noOperatorAssistance: false,
          outcome: "interview",
          notes: "Recruiter screen booked after sending the tailored PDF.",
          createdAt: "2026-06-10T10:04:00.000Z",
        }),
        null,
        2,
      ),
    );

    try {
      await execFileAsync(
        "node",
        [
          "cli/resume.mjs",
          "validate",
          "--input",
          workspace,
          "--json",
          "--require-completions",
          "1",
          "--require-interviews",
          "1",
        ],
        { cwd: process.cwd() },
      );
      throw new Error("Expected assisted validation audit to fail.");
    } catch (error) {
      const failure = error as { stdout?: string; code?: number };
      expect(failure.code).toBe(1);
      const report = JSON.parse(failure.stdout ?? "{}");
      expect(report.receipts[0]).toMatchObject({
        noOperatorAssistance: false,
        countableCompletion: false,
        countableInterview: false,
      });
      expect(report.totals.uniqueCompletionUsers).toBe(0);
    }
  });
});
