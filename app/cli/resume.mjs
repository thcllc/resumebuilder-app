#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";

const actionVerbs = [
  "accelerated",
  "built",
  "created",
  "cut",
  "designed",
  "drove",
  "established",
  "grew",
  "improved",
  "increased",
  "launched",
  "led",
  "lifted",
  "managed",
  "owned",
  "reduced",
  "redesigned",
  "shipped",
  "streamlined",
];

const parseArgs = (argv) => {
  const [command, ...rest] = argv;
  const flags = { command, json: false, pdf: false };

  for (let index = 0; index < rest.length; index += 1) {
    const arg = rest[index];
    if (arg === "--json") flags.json = true;
    else if (arg === "--pdf") flags.pdf = true;
    else if (arg.startsWith("--")) flags[arg.slice(2)] = rest[index + 1] ?? "";
    if (arg.startsWith("--") && rest[index + 1] && !rest[index + 1].startsWith("--")) index += 1;
  }

  return flags;
};

const usage = () => `resume/ CLI

Usage:
  node cli/resume.mjs score --input resume.json
  node cli/resume.mjs export --input resume.json --out exports --json --pdf
`;

const normalizeResume = (raw) => ({
  basics: {
    name: raw?.basics?.name ?? "",
    label: raw?.basics?.label ?? "",
    email: raw?.basics?.email ?? "",
    phone: raw?.basics?.phone ?? "",
    url: raw?.basics?.url ?? "",
    location: {
      city: raw?.basics?.location?.city ?? "",
      region: raw?.basics?.location?.region ?? "",
    },
    profiles: Array.isArray(raw?.basics?.profiles) ? raw.basics.profiles : [],
  },
  summary: raw?.summary ?? "",
  work: Array.isArray(raw?.work)
    ? raw.work.map((work) => ({
        name: work?.name ?? "",
        position: work?.position ?? "",
        location: work?.location ?? "",
        startDate: work?.startDate ?? "",
        endDate: work?.endDate ?? "",
        highlights: Array.isArray(work?.highlights) ? work.highlights : [],
      }))
    : [],
  education: Array.isArray(raw?.education) ? raw.education : [],
  skills: Array.isArray(raw?.skills)
    ? raw.skills.map((skill) => ({
        name: skill?.name ?? "",
        keywords: Array.isArray(skill?.keywords) ? skill.keywords : [],
      }))
    : [],
});

const wordCount = (value) => value.trim().split(/\s+/).filter(Boolean).length;
const phoneDigits = (value) => value.replace(/\D/g, "").length;
const hasValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
const highlightsFor = (resume) => resume.work.flatMap((work) => work.highlights);
const hasActionVerb = (value) =>
  actionVerbs.some((verb) => value.trim().toLowerCase().startsWith(`${verb} `));

const scoreResume = (resume) => {
  const highlights = highlightsFor(resume);
  const uniqueSkills = new Set(
    resume.skills.flatMap((skill) => skill.keywords).map((keyword) => keyword.trim().toLowerCase()).filter(Boolean),
  );
  const completeRoles = resume.work.filter(
    (work) =>
      work.name.trim() &&
      work.position.trim() &&
      work.startDate.trim() &&
      work.highlights.some((line) => line.trim().length >= 35),
  );
  const checks = [
    { label: "Contact", pass: hasValidEmail(resume.basics.email) && phoneDigits(resume.basics.phone) >= 7, weight: 14 },
    { label: "Headline", pass: wordCount(resume.basics.label) >= 2 && wordCount(resume.basics.label) <= 12, weight: 8 },
    { label: "Summary", pass: wordCount(resume.summary) >= 18 && wordCount(resume.summary) <= 90, weight: 14 },
    { label: "Experience", pass: resume.work.length >= 2 && completeRoles.length === resume.work.length, weight: 18 },
    { label: "Bullets", pass: highlights.length >= 4 && highlights.filter(hasActionVerb).length >= Math.min(4, highlights.length), weight: 14 },
    { label: "Impact", pass: highlights.filter((line) => /\d|%|\$/.test(line)).length >= 2, weight: 14 },
    { label: "Skills", pass: uniqueSkills.size >= 5, weight: 10 },
    { label: "Links", pass: Boolean(resume.basics.url || resume.basics.profiles.some((profile) => profile.url)), weight: 8 },
  ];
  const score = Math.round(
    (checks.reduce((sum, check) => sum + (check.pass ? check.weight : 0), 0) /
      checks.reduce((sum, check) => sum + check.weight, 0)) *
      100,
  );
  return { score, checks };
};

const escapePdf = (value) =>
  value.replace(/[\\()]/g, "\\$&").replace(/[^\x20-\x7E]/g, " ").replace(/\s+/g, " ").trim();

const pdfLinesFor = (resume) => [
  resume.basics.name || "Untitled Resume",
  resume.basics.label,
  [resume.basics.email, resume.basics.phone, resume.basics.url].filter(Boolean).join(" | "),
  "",
  "SUMMARY",
  resume.summary,
  "",
  "EXPERIENCE",
  ...resume.work.flatMap((work) => [
    [work.position, work.name].filter(Boolean).join(" - "),
    ...work.highlights.map((line) => `- ${line}`),
  ]),
  "",
  "SKILLS",
  ...resume.skills.map((skill) => [skill.name, skill.keywords.join(", ")].filter(Boolean).join(": ")),
].filter((line) => line !== undefined);

const createPdf = (resume) => {
  const lines = pdfLinesFor(resume);
  const stream = lines
    .map((line, index) => `BT /F1 ${index === 0 ? 18 : 10} Tf 54 ${738 - index * 14} Td (${escapePdf(line)}) Tj ET`)
    .join("\n");
  const objects = [
    "",
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [4 0 R] /Count 1 >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents 5 0 R >>",
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (let index = 1; index < objects.length; index += 1) {
    offsets[index] = Buffer.byteLength(pdf);
    pdf += `${index} 0 obj\n${objects[index]}\nendobj\n`;
  }
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let index = 1; index < objects.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }
  return `${pdf}trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
};

const readResume = async (input) => {
  if (!input) throw new Error("--input is required");
  return normalizeResume(JSON.parse(await readFile(input, "utf8")));
};

const main = async () => {
  const flags = parseArgs(process.argv.slice(2));
  if (!flags.command || flags.help) {
    console.log(usage());
    return;
  }

  const resume = await readResume(flags.input);

  if (flags.command === "score") {
    console.log(JSON.stringify(scoreResume(resume), null, 2));
    return;
  }

  if (flags.command === "export") {
    const out = flags.out || "exports";
    await mkdir(out, { recursive: true });
    const base = basename(flags.input, ".json") || "resume";
    if (flags.json || !flags.pdf) {
      await writeFile(join(out, `${base}.json`), `${JSON.stringify(resume, null, 2)}\n`);
    }
    if (flags.pdf) {
      await writeFile(join(out, `${base}.pdf`), createPdf(resume));
    }
    console.log(`Exported ${base} to ${out}`);
    return;
  }

  throw new Error(`Unknown command: ${flags.command}\n${usage()}`);
};

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
