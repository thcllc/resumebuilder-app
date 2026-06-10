import { execFile } from "node:child_process";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { expect, test } from "playwright/test";
import { sampleResume, toJsonResume } from "../src/lib/resume";
import { analyzeTailoring } from "../src/lib/tailoring";
import { buildValidationReceipt, createValidationState } from "../src/lib/validation";
import type { ValidationReceipt } from "../src/lib/validation";

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

const stableStringify = (value: unknown): string => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  return `{${Object.entries(value as Record<string, unknown>)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
    .join(",")}}`;
};

const checksum = (input: string) => {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
};

const resignReceipt = (receipt: ValidationReceipt): ValidationReceipt => {
  const { integrity: _integrity, ...source } = receipt;
  return {
    ...source,
    integrity: {
      algorithm: "fnv1a-stable-v1",
      digest: checksum(stableStringify(source)),
    },
  };
};

const writeAcceptedReceipts = async (
  workspace: string,
  receiptIds: string[],
  overrides: Partial<{
    schema: string;
    project: string;
    acceptedBy: string;
    acceptedAt: string;
    receiptIds: string[];
    notes: string;
  }> = {},
) => {
  const accepted = join(workspace, "ACCEPTED_RECEIPTS.json");
  await writeFile(
    accepted,
    JSON.stringify(
      {
        schema: "resumebuilder.accepted-receipts.v1",
        project: "resumebuilder-app",
        acceptedBy: "Project Owner",
        acceptedAt: "2020-01-01T00:00:00.000Z",
        receiptIds,
        notes: "Accepted by the owner as real-user validation evidence.",
        ...overrides,
      },
      null,
      2,
    ),
  );
  return accepted;
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
    const receiptOne = validationReceiptFor({
      testerLabel: "tester-01",
      outcome: "interview",
      notes: "Recruiter screen booked after sending the tailored PDF.",
      createdAt: "2026-06-10T10:04:00.000Z",
    });
    const receiptTwo = validationReceiptFor({
      testerLabel: "tester-02",
      outcome: "sent",
      notes: "",
      createdAt: "2026-06-10T10:05:00.000Z",
    });
    await writeFile(join(workspace, "tester-01.json"), JSON.stringify(receiptOne, null, 2));
    await writeFile(join(workspace, "tester-02.json"), JSON.stringify(receiptTwo, null, 2));

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
      ownerAcceptedReceipts: 0,
      uniqueCompletionUsers: 2,
      bestInterviewWindowCount: 1,
    });
    expect(report.ownerReview).toMatchObject({
      completionReceiptIds: [receiptOne.receiptId, receiptTwo.receiptId],
      interviewReceiptIds: [receiptOne.receiptId],
      acceptanceOut: join(workspace, "ACCEPTED_RECEIPTS.json"),
      acceptanceCommand: expect.stringContaining(
        `--receipt-ids ${receiptOne.receiptId},${receiptTwo.receiptId}`,
      ),
    });
    expect(report.ownerReview.receipts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          receiptId: receiptOne.receiptId,
          tester: "tester-01",
          outcome: "interview",
          hasOutcomeNotes: true,
        }),
        expect.objectContaining({
          receiptId: receiptTwo.receiptId,
          tester: "tester-02",
          outcome: "sent",
          hasOutcomeNotes: false,
        }),
      ]),
    );
  });

  test("prints owner review candidate receipt ids for acceptance decisions", async () => {
    const workspace = await mkdtemp(join(tmpdir(), "resume-validation-review-"));
    const receipt = validationReceiptFor({
      testerLabel: "tester-01",
      outcome: "interview",
      notes: "Recruiter screen booked after sending the tailored PDF.",
      createdAt: "2026-06-10T10:04:00.000Z",
    });
    await writeFile(join(workspace, "tester-01.json"), JSON.stringify(receipt, null, 2));

    const audit = await execFileAsync(
      "node",
      [
        "cli/resume.mjs",
        "validate",
        "--input",
        workspace,
        "--require-completions",
        "1",
        "--require-interviews",
        "1",
      ],
      { cwd: process.cwd() },
    );

    expect(audit.stdout).toContain("Owner review candidates:");
    expect(audit.stdout).toContain(`${receipt.receiptId}: tester-01, interview, notes`);
    expect(audit.stdout).toContain("Acceptance command template:");
    expect(audit.stdout).toContain(`--receipt-ids ${receipt.receiptId}`);
  });

  test("uses the receipt directory for acceptance templates when input is a file", async () => {
    const workspace = await mkdtemp(join(tmpdir(), "resume-validation-file-"));
    const receipt = validationReceiptFor({
      testerLabel: "tester-03",
      outcome: "interview",
      notes: "Recruiter screen booked after sending the tailored PDF.",
      createdAt: "2026-06-10T10:06:00.000Z",
    });
    const receiptFile = join(workspace, "tester-03.json");
    await writeFile(receiptFile, JSON.stringify(receipt, null, 2));

    const audit = await execFileAsync(
      "node",
      [
        "cli/resume.mjs",
        "validate",
        "--input",
        receiptFile,
        "--json",
        "--require-completions",
        "1",
        "--require-interviews",
        "1",
      ],
      { cwd: process.cwd() },
    );
    const report = JSON.parse(audit.stdout);

    expect(report.ownerReview.acceptanceOut).toBe(join(workspace, "ACCEPTED_RECEIPTS.json"));
    expect(report.ownerReview.acceptanceCommand).toContain(`--input ${receiptFile}`);
    expect(report.ownerReview.acceptanceCommand).toContain(
      `--out ${join(workspace, "ACCEPTED_RECEIPTS.json")}`,
    );
  });

  test("counts only owner-accepted receipts when a manifest is provided", async () => {
    const workspace = await mkdtemp(join(tmpdir(), "resume-validation-accepted-"));
    const acceptedReceipt = validationReceiptFor({
      testerLabel: "tester-01",
      outcome: "interview",
      notes: "Recruiter screen booked after sending the tailored PDF.",
      createdAt: "2026-06-10T10:04:00.000Z",
    });
    const unacceptedReceipt = validationReceiptFor({
      testerLabel: "tester-02",
      outcome: "interview",
      notes: "Second recruiter screen booked.",
      createdAt: "2026-06-10T10:05:00.000Z",
    });
    await writeFile(join(workspace, "tester-01.json"), JSON.stringify(acceptedReceipt, null, 2));
    await writeFile(join(workspace, "tester-02.json"), JSON.stringify(unacceptedReceipt, null, 2));
    const accepted = await writeAcceptedReceipts(workspace, [acceptedReceipt.receiptId]);

    const audit = await execFileAsync(
      "node",
      [
        "cli/resume.mjs",
        "validate",
        "--input",
        workspace,
        "--accepted",
        accepted,
        "--json",
        "--require-completions",
        "1",
        "--require-interviews",
        "1",
      ],
      { cwd: process.cwd() },
    );
    const report = JSON.parse(audit.stdout);

    expect(report.gates).toMatchObject({
      all: true,
      ownerAcceptance: true,
    });
    expect(report.totals).toMatchObject({
      ownerAcceptedReceipts: 1,
      uniqueCompletionUsers: 1,
      bestInterviewWindowCount: 1,
    });
    expect(report.receipts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          receiptId: acceptedReceipt.receiptId,
          ownerAccepted: true,
          countableCompletion: true,
        }),
        expect.objectContaining({
          receiptId: unacceptedReceipt.receiptId,
          ownerAccepted: false,
          countableCompletion: false,
        }),
      ]),
    );
  });

  test("writes owner acceptance manifests for explicit countable receipt ids", async () => {
    const workspace = await mkdtemp(join(tmpdir(), "resume-acceptance-write-"));
    const receipt = validationReceiptFor({
      testerLabel: "tester-01",
      outcome: "interview",
      notes: "Recruiter screen booked after sending the tailored PDF.",
      createdAt: "2026-06-10T10:04:00.000Z",
    });
    await writeFile(join(workspace, "tester-01.json"), JSON.stringify(receipt, null, 2));
    const accepted = join(workspace, "ACCEPTED_RECEIPTS.json");

    const acceptanceWrite = await execFileAsync(
      "node",
      [
        "cli/resume.mjs",
        "accept",
        "--input",
        workspace,
        "--out",
        accepted,
        "--owner",
        "Project Owner",
        "--receipt-ids",
        receipt.receiptId,
        "--json",
      ],
      { cwd: process.cwd() },
    );
    const writeReport = JSON.parse(acceptanceWrite.stdout);
    const manifest = JSON.parse(await readFile(accepted, "utf8"));

    expect(writeReport).toMatchObject({
      schema: "resumebuilder.acceptance-write.v1",
      out: accepted,
      acceptedReceipts: 1,
    });
    expect(manifest).toMatchObject({
      schema: "resumebuilder.accepted-receipts.v1",
      project: "resumebuilder-app",
      acceptedBy: "Project Owner",
      receiptIds: [receipt.receiptId],
    });
    expect(Date.parse(manifest.acceptedAt)).not.toBeNaN();

    const release = await execFileAsync(
      "node",
      [
        "cli/resume.mjs",
        "release",
        "--input",
        workspace,
        "--accepted",
        accepted,
        "--json",
        "--require-completions",
        "1",
        "--require-interviews",
        "1",
      ],
      { cwd: process.cwd() },
    );
    expect(JSON.parse(release.stdout).gates.all).toBe(true);
  });

  test("refuses acceptance manifests for assisted or incomplete receipts", async () => {
    const workspace = await mkdtemp(join(tmpdir(), "resume-acceptance-reject-"));
    const receipt = validationReceiptFor({
      testerLabel: "tester-01",
      noOperatorAssistance: false,
      outcome: "interview",
      notes: "Recruiter screen booked after sending the tailored PDF.",
      createdAt: "2026-06-10T10:04:00.000Z",
    });
    await writeFile(join(workspace, "tester-01.json"), JSON.stringify(receipt, null, 2));

    try {
      await execFileAsync(
        "node",
        [
          "cli/resume.mjs",
          "accept",
          "--input",
          workspace,
          "--owner",
          "Project Owner",
          "--receipt-ids",
          receipt.receiptId,
          "--json",
        ],
        { cwd: process.cwd() },
      );
      throw new Error("Expected acceptance manifest write to fail.");
    } catch (error) {
      const failure = error as { stderr?: string; code?: number };
      expect(failure.code).toBe(1);
      expect(failure.stderr ?? "").toContain("Cannot accept receipts");
      expect(failure.stderr ?? "").toContain("core flow is incomplete");
      expect(failure.stderr ?? "").toContain("no-assistance attestation is missing");
    }
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

  test("rejects integrity-valid receipts missing required checklist evidence", async () => {
    const workspace = await mkdtemp(join(tmpdir(), "resume-validation-forged-checklist-"));
    const receipt = validationReceiptFor({
      testerLabel: "tester-01",
      outcome: "sent",
      notes: "",
      createdAt: "2026-06-10T10:04:00.000Z",
    });
    receipt.criteria = receipt.criteria.filter((criterion) => criterion.id !== "pdf-exported");
    receipt.completion.requiredPassed = receipt.criteria.filter((criterion) => criterion.pass).length;
    receipt.completion.requiredTotal = receipt.criteria.length;
    receipt.completion.coreFlowComplete = true;
    await writeFile(join(workspace, "tester-01.json"), JSON.stringify(resignReceipt(receipt), null, 2));

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
          "0",
        ],
        { cwd: process.cwd() },
      );
      throw new Error("Expected forged checklist audit to fail.");
    } catch (error) {
      const failure = error as { stdout?: string; code?: number };
      expect(failure.code).toBe(1);
      const report = JSON.parse(failure.stdout ?? "{}");
      expect(report.receipts[0].errors).toEqual(
        expect.arrayContaining(["criteria missing required id: pdf-exported"]),
      );
      expect(report.receipts[0].errors).not.toContain("integrity.digest mismatch");
      expect(report.totals.invalidReceipts).toBe(1);
      expect(report.totals.uniqueCompletionUsers).toBe(0);
    }
  });

  test("rejects integrity-valid receipts with contradictory interview outcomes", async () => {
    const workspace = await mkdtemp(join(tmpdir(), "resume-validation-forged-outcome-"));
    const receipt = validationReceiptFor({
      testerLabel: "tester-01",
      outcome: "interview",
      notes: "Recruiter screen booked.",
      createdAt: "2026-06-10T10:04:00.000Z",
    });
    receipt.outcome.notes = "";
    receipt.completion.interviewOutcomeRecorded = false;
    await writeFile(join(workspace, "tester-01.json"), JSON.stringify(resignReceipt(receipt), null, 2));

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
      throw new Error("Expected forged outcome audit to fail.");
    } catch (error) {
      const failure = error as { stdout?: string; code?: number };
      expect(failure.code).toBe(1);
      const report = JSON.parse(failure.stdout ?? "{}");
      expect(report.receipts[0].errors).toEqual(
        expect.arrayContaining([
          "completion.interviewOutcomeRecorded must match outcome.status",
          "interview or offer outcomes require outcome.notes",
        ]),
      );
      expect(report.receipts[0].errors).not.toContain("integrity.digest mismatch");
      expect(report.totals.invalidReceipts).toBe(1);
      expect(report.totals.uniqueCompletionUsers).toBe(0);
      expect(report.totals.interviewProducingReceipts).toBe(0);
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

  test("rejects anonymous validation receipts", async () => {
    const workspace = await mkdtemp(join(tmpdir(), "resume-validation-anonymous-"));
    await writeFile(
      join(workspace, "anonymous.json"),
      JSON.stringify(
        validationReceiptFor({
          testerLabel: "",
          outcome: "sent",
          notes: "",
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
          "0",
        ],
        { cwd: process.cwd() },
      );
      throw new Error("Expected anonymous receipt audit to fail.");
    } catch (error) {
      const failure = error as { stdout?: string; code?: number };
      expect(failure.code).toBe(1);
      const report = JSON.parse(failure.stdout ?? "{}");
      expect(report.receipts[0].errors).toContain("tester.label must be non-anonymous");
      expect(report.totals.invalidReceipts).toBe(1);
      expect(report.totals.uniqueCompletionUsers).toBe(0);
    }
  });

  test("fails release audit without receipts or owner waiver", async () => {
    const workspace = await mkdtemp(join(tmpdir(), "resume-release-empty-"));

    try {
      await execFileAsync(
        "node",
        [
          "cli/resume.mjs",
          "release",
          "--input",
          workspace,
          "--json",
        ],
        { cwd: process.cwd() },
      );
      throw new Error("Expected release audit to fail.");
    } catch (error) {
      const failure = error as { stdout?: string; code?: number };
      expect(failure.code).toBe(1);
      const report = JSON.parse(failure.stdout ?? "{}");
      expect(report.gates).toMatchObject({
        receipts: false,
        ownerWaiver: false,
        externalValidation: false,
        all: false,
      });
      expect(report.blockers).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: "receipt.completion-shortfall" }),
          expect.objectContaining({ id: "receipt.interview-shortfall" }),
          expect.objectContaining({ id: "receipt.owner-acceptance" }),
          expect.objectContaining({ id: "waiver.invalid-or-missing" }),
        ]),
      );
      expect(report.nextActions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: "collect-more-receipts", url: "https://resumebuilder.app/#validate" }),
          expect.objectContaining({
            id: "write-owner-acceptance",
            command: expect.stringContaining("node app/cli/resume.mjs accept"),
          }),
          expect.objectContaining({
            id: "optional-owner-waiver",
            command: expect.stringContaining("VALIDATION_WAIVER.example.md"),
          }),
        ]),
      );
    }
  });

  test("returns structured release blockers when the receipt input is missing", async () => {
    const workspace = await mkdtemp(join(tmpdir(), "resume-release-missing-input-"));
    const missingInput = join(workspace, "missing-receipts");

    try {
      await execFileAsync(
        "node",
        [
          "cli/resume.mjs",
          "release",
          "--input",
          missingInput,
          "--json",
        ],
        { cwd: process.cwd() },
      );
      throw new Error("Expected missing-input release audit to fail.");
    } catch (error) {
      const failure = error as { stdout?: string; stderr?: string; code?: number };
      expect(failure.code).toBe(1);
      expect(failure.stderr ?? "").toBe("");
      const report = JSON.parse(failure.stdout ?? "{}");
      expect(report.validation.inputError).toContain("Cannot inspect receipt input");
      expect(report.gates.all).toBe(false);
      expect(report.blockers).toEqual(
        expect.arrayContaining([expect.objectContaining({ id: "receipt.input-unreadable" })]),
      );
      expect(report.nextActions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: "prepare-receipt-input",
            command: `mkdir -p ${missingInput}`,
          }),
        ]),
      );
    }
  });

  test("prints release blockers and next actions in human-readable audits", async () => {
    const workspace = await mkdtemp(join(tmpdir(), "resume-release-empty-readable-"));

    try {
      await execFileAsync(
        "node",
        [
          "cli/resume.mjs",
          "release",
          "--input",
          workspace,
          "--require-completions",
          "1",
          "--require-interviews",
          "0",
        ],
        { cwd: process.cwd() },
      );
      throw new Error("Expected release audit to fail.");
    } catch (error) {
      const failure = error as { stdout?: string; code?: number };
      expect(failure.code).toBe(1);
      expect(failure.stdout ?? "").toContain("Blockers:");
      expect(failure.stdout ?? "").toContain("receipt.completion-shortfall");
      expect(failure.stdout ?? "").toContain("Next actions:");
      expect(failure.stdout ?? "").toContain("collect-more-receipts");
      expect(failure.stdout ?? "").toContain("optional-owner-waiver");
    }
  });

  test("passes release audit with valid receipt cohort", async () => {
    const workspace = await mkdtemp(join(tmpdir(), "resume-release-receipts-"));
    const receiptOne = validationReceiptFor({
      testerLabel: "tester-01",
      outcome: "interview",
      notes: "Recruiter screen booked after sending the tailored PDF.",
      createdAt: "2026-06-10T10:04:00.000Z",
    });
    const receiptTwo = validationReceiptFor({
      testerLabel: "tester-02",
      outcome: "sent",
      notes: "",
      createdAt: "2026-06-10T10:05:00.000Z",
    });
    await writeFile(join(workspace, "tester-01.json"), JSON.stringify(receiptOne, null, 2));
    await writeFile(join(workspace, "tester-02.json"), JSON.stringify(receiptTwo, null, 2));
    const accepted = await writeAcceptedReceipts(workspace, [
      receiptOne.receiptId,
      receiptTwo.receiptId,
    ]);

    const audit = await execFileAsync(
      "node",
      [
        "cli/resume.mjs",
        "release",
        "--input",
        workspace,
        "--accepted",
        accepted,
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
      receipts: true,
      ownerWaiver: false,
      externalValidation: true,
      all: true,
    });
    expect(report.blockers).toEqual([]);
    expect(report.nextActions).toEqual([]);
    expect(report.validation.acceptance).toMatchObject({
      provided: true,
      valid: true,
      receiptIds: [receiptOne.receiptId, receiptTwo.receiptId],
    });
  });

  test("fails release audit with valid receipts but no owner acceptance manifest", async () => {
    const workspace = await mkdtemp(join(tmpdir(), "resume-release-unaccepted-"));
    const receiptOne = validationReceiptFor({
      testerLabel: "tester-01",
      outcome: "interview",
      notes: "Recruiter screen booked after sending the tailored PDF.",
      createdAt: "2026-06-10T10:04:00.000Z",
    });
    const receiptTwo = validationReceiptFor({
      testerLabel: "tester-02",
      outcome: "sent",
      notes: "",
      createdAt: "2026-06-10T10:05:00.000Z",
    });
    await writeFile(join(workspace, "tester-01.json"), JSON.stringify(receiptOne, null, 2));
    await writeFile(join(workspace, "tester-02.json"), JSON.stringify(receiptTwo, null, 2));

    try {
      await execFileAsync(
        "node",
        [
          "cli/resume.mjs",
          "release",
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
      throw new Error("Expected release audit to fail without owner acceptance.");
    } catch (error) {
      const failure = error as { stdout?: string; code?: number };
      expect(failure.code).toBe(1);
      const report = JSON.parse(failure.stdout ?? "{}");
      expect(report.gates).toMatchObject({
        receipts: false,
        ownerWaiver: false,
        externalValidation: false,
        all: false,
      });
      expect(report.validation.gates.ownerAcceptance).toBe(false);
      expect(report.validation.acceptance.errors).toContain("No acceptance manifest provided");
      expect(report.validation.totals).toMatchObject({
        ownerAcceptedReceipts: 0,
        uniqueCompletionUsers: 0,
      });
      expect(report.validation.ownerReview.completionReceiptIds).toEqual([
        receiptOne.receiptId,
        receiptTwo.receiptId,
      ]);
      expect(report.blockers).toEqual(
        expect.arrayContaining([expect.objectContaining({ id: "receipt.owner-acceptance" })]),
      );
      expect(report.nextActions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: "review-and-accept-receipts",
            command: expect.stringContaining(`--receipt-ids ${receiptOne.receiptId},${receiptTwo.receiptId}`),
          }),
        ]),
      );
    }
  });

  test("rejects placeholder owner acceptance manifests", async () => {
    const workspace = await mkdtemp(join(tmpdir(), "resume-release-placeholder-accepted-"));
    const receipt = validationReceiptFor({
      testerLabel: "tester-01",
      outcome: "interview",
      notes: "Recruiter screen booked after sending the tailored PDF.",
      createdAt: "2026-06-10T10:04:00.000Z",
    });
    await writeFile(join(workspace, "tester-01.json"), JSON.stringify(receipt, null, 2));
    const accepted = await writeAcceptedReceipts(workspace, [receipt.receiptId], {
      acceptedBy: "TODO",
    });

    try {
      await execFileAsync(
        "node",
        [
          "cli/resume.mjs",
          "release",
          "--input",
          workspace,
          "--accepted",
          accepted,
          "--json",
          "--require-completions",
          "1",
          "--require-interviews",
          "1",
        ],
        { cwd: process.cwd() },
      );
      throw new Error("Expected release audit to fail with placeholder owner acceptance.");
    } catch (error) {
      const failure = error as { stdout?: string; code?: number };
      expect(failure.code).toBe(1);
      const report = JSON.parse(failure.stdout ?? "{}");
      expect(report.validation.gates.ownerAcceptance).toBe(false);
      expect(report.validation.acceptance.errors).toContain("acceptedBy is required");
    }
  });

  test("passes release audit with explicit owner waiver", async () => {
    const workspace = await mkdtemp(join(tmpdir(), "resume-release-waiver-"));
    const waiver = join(workspace, "VALIDATION_WAIVER.md");
    await writeFile(
      waiver,
      [
        "Waiver status: waived",
        "Project: resumebuilder-app",
        "Owner: Project Owner",
        "Date: 2026-06-10",
        "Scope: external validation receipt gate",
        "Statement: I explicitly waive the real-user validation receipt gate for resumebuilder-app.",
        "Signature: Project Owner",
        "",
      ].join("\n"),
    );

    const audit = await execFileAsync(
      "node",
      [
        "cli/resume.mjs",
        "release",
        "--input",
        workspace,
        "--waiver",
        waiver,
        "--json",
      ],
      { cwd: process.cwd() },
    );
    const report = JSON.parse(audit.stdout);

    expect(report.gates).toMatchObject({
      receipts: false,
      ownerWaiver: true,
      externalValidation: true,
      all: true,
    });
    expect(report.blockers).toEqual([]);
    expect(report.nextActions).toEqual([]);
    expect(report.waiver).toMatchObject({
      provided: true,
      valid: true,
      errors: [],
    });
  });

  test("rejects placeholder owner waiver", async () => {
    const workspace = await mkdtemp(join(tmpdir(), "resume-release-placeholder-"));
    const waiver = join(workspace, "VALIDATION_WAIVER.md");
    await writeFile(
      waiver,
      [
        "Waiver status: waived",
        "Project: resumebuilder-app",
        "Owner: TODO",
        "Date: 2026-06-10",
        "Scope: external validation receipt gate",
        "Statement: I explicitly waive the real-user validation receipt gate for resumebuilder-app.",
        "Signature: TODO",
        "",
      ].join("\n"),
    );

    try {
      await execFileAsync(
        "node",
        [
          "cli/resume.mjs",
          "release",
          "--input",
          workspace,
          "--waiver",
          waiver,
          "--json",
        ],
        { cwd: process.cwd() },
      );
      throw new Error("Expected placeholder waiver release audit to fail.");
    } catch (error) {
      const failure = error as { stdout?: string; code?: number };
      expect(failure.code).toBe(1);
      const report = JSON.parse(failure.stdout ?? "{}");
      expect(report.gates.ownerWaiver).toBe(false);
      expect(report.waiver.errors).toEqual(expect.arrayContaining(["Owner is required", "Signature is required"]));
    }
  });
});
