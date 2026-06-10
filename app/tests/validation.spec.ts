import { expect, test } from "playwright/test";
import { sampleResume } from "../src/lib/resume";
import { analyzeTailoring } from "../src/lib/tailoring";
import {
  buildValidationChecklist,
  buildValidationReceipt,
  createValidationState,
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
});
