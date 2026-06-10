import { expect, test } from "playwright/test";
import { scoreResume } from "../src/lib/resume";
import { atsCorpus } from "./fixtures/ats-corpus";

test.describe("ATS readiness scoring", () => {
  for (const fixture of atsCorpus) {
    test(`${fixture.name} scores inside expected range`, () => {
      const result = scoreResume(fixture.resume);
      const checksByLabel = new Map(result.checks.map((check) => [check.label, check]));

      expect(result.score).toBeGreaterThanOrEqual(fixture.minScore);
      expect(result.score).toBeLessThanOrEqual(fixture.maxScore);

      for (const label of fixture.passing) {
        expect(checksByLabel.get(label), `${label} should pass`).toMatchObject({ pass: true });
      }

      for (const label of fixture.failing) {
        expect(checksByLabel.get(label), `${label} should fail`).toMatchObject({ pass: false });
      }
    });
  }

  test("check weights add to a 100 point score model", () => {
    const result = scoreResume(atsCorpus[0].resume);
    expect(result.checks.reduce((sum, check) => sum + check.weight, 0)).toBe(100);
  });
});
