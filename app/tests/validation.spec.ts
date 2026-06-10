import { expect, test } from "playwright/test";
import { sampleResume } from "../src/lib/resume";
import { analyzeTailoring } from "../src/lib/tailoring";
import {
  auditReceiptCohort,
  buildAcceptanceManifest,
  buildValidationChecklist,
  buildValidationReceipt,
  createValidationState,
  isAcceptanceOwnerNameValid,
} from "../src/lib/validation";

const jd = `Nimbus Labs - Senior Platform Product Designer

Nimbus Labs is hiring for a platform design role focused on developer experience, API design, dashboards, design systems, and production prototyping.

What you will do
- Shape API design workflows with engineers
- Improve developer experience across platform dashboards
- Evolve design systems and production prototyping practices`;

test.describe("validation receipts", () => {
  test("proves the local application loop without embedding resume or JD bodies", () => {
    const analysis = analyzeTailoring(sampleResume, jd);
    const state = {
      ...createValidationState(),
      runId: "run-11111111",
      startedAt: "2026-06-10T09:59:00.000Z",
      testerLabel: "tester-01",
      noOperatorAssistance: true,
      outcome: "interview" as const,
      notes: "Recruiter screen booked after sending the tailored PDF.",
      reviewedDiffAt: "2026-06-10T10:00:00.000Z",
      acceptedDraftAt: "2026-06-10T10:01:00.000Z",
      exportedJsonAt: "2026-06-10T10:02:00.000Z",
      exportedPdfAt: "2026-06-10T10:03:00.000Z",
    };
    const versions = [
      {
        jd,
        jobTitle: analysis.job.title,
        company: analysis.job.company,
        status: "interview",
        matchScore: analysis.score.tailored,
      },
    ];

    const checklist = buildValidationChecklist({
      resume: sampleResume,
      jd,
      analysis,
      versions,
      state,
    });
    expect(checklist.every((criterion) => criterion.pass)).toBe(true);

    const receipt = buildValidationReceipt({
      resume: sampleResume,
      jd,
      analysis,
      versions,
      state,
      createdAt: "2026-06-10T10:04:00.000Z",
    });
    const serialized = JSON.stringify(receipt);

    expect(receipt.schema).toBe("resumebuilder.validation.v1");
    expect(receipt.run).toMatchObject({
      id: "run-11111111",
      startedAt: "2026-06-10T09:59:00.000Z",
    });
    expect(receipt.completion.coreFlowComplete).toBe(true);
    expect(receipt.completion.interviewOutcomeRecorded).toBe(true);
    expect(receipt.attestations.noOperatorAssistance).toBe(true);
    expect(receipt.integrity).toMatchObject({
      algorithm: "fnv1a-stable-v1",
      digest: expect.stringMatching(/^[a-f0-9]{8}$/),
    });
    expect(receipt.privacy.containsResumeBody).toBe(false);
    expect(receipt.privacy.containsJobDescriptionBody).toBe(false);
    expect(serialized).not.toContain(sampleResume.summary);
    expect(serialized).not.toContain("Shape API design workflows with engineers");
  });

  test("requires a non-anonymous tester label before completion can count", () => {
    const analysis = analyzeTailoring(sampleResume, jd);
    const state = {
      ...createValidationState(),
      runId: "run-11111111",
      startedAt: "2026-06-10T09:59:00.000Z",
      testerLabel: "",
      noOperatorAssistance: true,
      outcome: "sent" as const,
      notes: "",
      reviewedDiffAt: "2026-06-10T10:00:00.000Z",
      acceptedDraftAt: "2026-06-10T10:01:00.000Z",
      exportedJsonAt: "2026-06-10T10:02:00.000Z",
      exportedPdfAt: "2026-06-10T10:03:00.000Z",
    };
    const versions = [
      {
        jd,
        jobTitle: analysis.job.title,
        company: analysis.job.company,
        status: "sent",
        matchScore: analysis.score.tailored,
      },
    ];

    const checklist = buildValidationChecklist({
      resume: sampleResume,
      jd,
      analysis,
      versions,
      state,
    });
    const testerCriterion = checklist.find((criterion) => criterion.id === "tester-labeled");
    expect(testerCriterion).toMatchObject({ pass: false });

    const receipt = buildValidationReceipt({
      resume: sampleResume,
      jd,
      analysis,
      versions,
      state,
      createdAt: "2026-06-10T10:04:00.000Z",
    });
    expect(receipt.completion.coreFlowComplete).toBe(false);
    expect(receipt.tester.label).toBe("anonymous tester");
  });

  test("audits imported receipt cohorts for owner review in the browser", () => {
    const analysis = analyzeTailoring(sampleResume, jd);
    const completeState = {
      ...createValidationState(),
      runId: "run-11111111",
      startedAt: "2026-06-10T09:59:00.000Z",
      testerLabel: "tester-01",
      noOperatorAssistance: true,
      outcome: "interview" as const,
      notes: "Recruiter screen booked after sending the tailored PDF.",
      reviewedDiffAt: "2026-06-10T10:00:00.000Z",
      acceptedDraftAt: "2026-06-10T10:01:00.000Z",
      exportedJsonAt: "2026-06-10T10:02:00.000Z",
      exportedPdfAt: "2026-06-10T10:03:00.000Z",
    };
    const sentState = {
      ...completeState,
      runId: "run-22222222",
      testerLabel: "tester-02",
      outcome: "sent" as const,
      notes: "",
    };
    const versions = [
      {
        jd,
        jobTitle: analysis.job.title,
        company: analysis.job.company,
        status: "interview",
        matchScore: analysis.score.tailored,
      },
    ];
    const interviewReceipt = buildValidationReceipt({
      resume: sampleResume,
      jd,
      analysis,
      versions,
      state: completeState,
      createdAt: "2026-06-10T10:04:00.000Z",
    });
    const sentReceipt = buildValidationReceipt({
      resume: sampleResume,
      jd,
      analysis,
      versions,
      state: sentState,
      createdAt: "2026-06-10T10:05:00.000Z",
    });

    const audit = auditReceiptCohort(
      [
        { fileName: "tester-01.json", receipt: interviewReceipt },
        { fileName: "tester-02.json", receipt: sentReceipt },
      ],
      {
        requireCompletions: 2,
        requireInterviews: 1,
        generatedAt: "2026-06-10T10:06:00.000Z",
      },
    );

    expect(audit.schema).toBe("resumebuilder.validation-audit.v1");
    expect(audit.totals).toMatchObject({
      files: 2,
      validReceipts: 2,
      invalidReceipts: 0,
      uniqueCompletionUsers: 2,
      bestInterviewWindowCount: 1,
    });
    expect(audit.gates.all).toBe(true);
    expect(audit.ownerReview.completionReceiptIds).toEqual([
      interviewReceipt.receiptId,
      sentReceipt.receiptId,
    ]);
    expect(audit.ownerReview.interviewReceiptIds).toEqual([interviewReceipt.receiptId]);
  });

  test("fails browser receipt audits closed for invalid JSON, tampering, and duplicate ids", () => {
    const analysis = analyzeTailoring(sampleResume, jd);
    const state = {
      ...createValidationState(),
      runId: "run-11111111",
      startedAt: "2026-06-10T09:59:00.000Z",
      testerLabel: "tester-01",
      noOperatorAssistance: true,
      outcome: "sent" as const,
      notes: "",
      reviewedDiffAt: "2026-06-10T10:00:00.000Z",
      acceptedDraftAt: "2026-06-10T10:01:00.000Z",
      exportedJsonAt: "2026-06-10T10:02:00.000Z",
      exportedPdfAt: "2026-06-10T10:03:00.000Z",
    };
    const versions = [
      {
        jd,
        jobTitle: analysis.job.title,
        company: analysis.job.company,
        status: "sent",
        matchScore: analysis.score.tailored,
      },
    ];
    const receipt = buildValidationReceipt({
      resume: sampleResume,
      jd,
      analysis,
      versions,
      state,
      createdAt: "2026-06-10T10:04:00.000Z",
    });
    const tamperedReceipt = {
      ...receipt,
      metrics: {
        ...receipt.metrics,
        patchCount: 0,
      },
    };

    const audit = auditReceiptCohort([
      { fileName: "tester-01.json", receipt },
      { fileName: "tester-01-duplicate.json", receipt },
      { fileName: "tampered.json", receipt: tamperedReceipt },
      { fileName: "broken.json", error: "Unexpected token" },
    ]);

    expect(audit.gates.noInvalidReceipts).toBe(false);
    expect(audit.totals.invalidReceipts).toBe(4);
    expect(audit.receipts.find((record) => record.fileName === "tester-01.json")?.errors).toContain(
      "duplicate receiptId",
    );
    expect(audit.receipts.find((record) => record.fileName === "tampered.json")?.errors).toEqual(
      expect.arrayContaining(["metrics.patchCount must match patchTargets count", "integrity.digest mismatch"]),
    );
    expect(audit.receipts.find((record) => record.fileName === "broken.json")?.errors).toEqual([
      "Invalid JSON: Unexpected token",
    ]);
  });

  test("builds owner acceptance manifests for selected browser-audited receipt ids", () => {
    expect(isAcceptanceOwnerNameValid("TODO")).toBe(false);
    expect(isAcceptanceOwnerNameValid("Jane Owner")).toBe(true);

    const manifest = buildAcceptanceManifest({
      owner: "Jane Owner",
      acceptedAt: "2026-06-10T10:07:00.000Z",
      receiptIds: ["rbv-11111111", "rbv-22222222"],
    });

    expect(manifest).toEqual({
      schema: "resumebuilder.accepted-receipts.v1",
      project: "resumebuilder-app",
      acceptedBy: "Jane Owner",
      acceptedAt: "2026-06-10T10:07:00.000Z",
      receiptIds: ["rbv-11111111", "rbv-22222222"],
      notes: "Accepted by the owner as real-user validation evidence.",
    });
  });
});
