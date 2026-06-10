import { execFile } from "node:child_process";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { expect, test } from "playwright/test";
import { sampleResume, toJsonResume } from "../src/lib/resume";

const execFileAsync = promisify(execFile);

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
});
