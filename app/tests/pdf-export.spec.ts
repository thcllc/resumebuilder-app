import { expect, test } from "playwright/test";
import { createResumePdfBlob, resumeToPdfLines } from "../src/lib/pdf";
import { sampleResume } from "../src/lib/resume";

test.describe("deterministic PDF export", () => {
  test("serializes the resume into a valid PDF document", async () => {
    const blob = createResumePdfBlob(sampleResume);
    const text = await blob.text();

    expect(blob.type).toBe("application/pdf");
    expect(text.startsWith("%PDF-1.4")).toBe(true);
    expect(text).toContain("/Type /Catalog");
    expect(text).toContain("xref");
    expect(text).toContain("Maya Chen");
    expect(text).toContain("EXPERIENCE");
  });

  test("includes core resume sections as PDF lines", () => {
    const lines = resumeToPdfLines(sampleResume).map((line) => line.text);

    expect(lines).toContain("SUMMARY");
    expect(lines).toContain("EXPERIENCE");
    expect(lines).toContain("EDUCATION");
    expect(lines).toContain("SKILLS");
  });
});
