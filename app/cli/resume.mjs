#!/usr/bin/env node
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
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
  node cli/resume.mjs validate --input receipts --json
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

const isObject = (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value);

const stableStringify = (value) => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  return `{${Object.entries(value)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
    .join(",")}}`;
};

const checksum = (input) => {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
};

const integritySourceFor = (receipt) => {
  const { integrity: _integrity, ...source } = receipt;
  return source;
};

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

const receiptFilesFor = async (input) => {
  if (!input) throw new Error("--input is required");
  const info = await stat(input);
  if (info.isFile()) return [input];
  if (!info.isDirectory()) throw new Error(`Input is not a file or directory: ${input}`);

  const entries = await readdir(input, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const path = join(input, entry.name);
      if (entry.isDirectory()) return receiptFilesFor(path);
      return entry.isFile() && entry.name.endsWith(".json") ? [path] : [];
    }),
  );
  return nested.flat().sort();
};

const validateReceiptShape = (receipt) => {
  const errors = [];
  if (!isObject(receipt)) return ["Receipt is not an object"];
  if (receipt.schema !== "resumebuilder.validation.v1") errors.push("schema must be resumebuilder.validation.v1");
  if (receipt.app !== "resumebuilderapp") errors.push("app must be resumebuilderapp");
  if (typeof receipt.receiptId !== "string" || !/^rbv-[a-f0-9]{8}$/.test(receipt.receiptId)) {
    errors.push("receiptId must match rbv-xxxxxxxx");
  }
  if (Number.isNaN(Date.parse(receipt.createdAt ?? ""))) errors.push("createdAt must be an ISO timestamp");

  if (!isObject(receipt.run)) errors.push("run is required");
  else {
    if (typeof receipt.run.id !== "string" || !/^run-[a-f0-9]{8}$/.test(receipt.run.id)) {
      errors.push("run.id must match run-xxxxxxxx");
    }
    if (Number.isNaN(Date.parse(receipt.run.startedAt ?? ""))) {
      errors.push("run.startedAt must be an ISO timestamp");
    }
    if (
      !Number.isNaN(Date.parse(receipt.run.startedAt ?? "")) &&
      !Number.isNaN(Date.parse(receipt.createdAt ?? "")) &&
      Date.parse(receipt.run.startedAt) > Date.parse(receipt.createdAt)
    ) {
      errors.push("run.startedAt cannot be after createdAt");
    }
  }

  if (!isObject(receipt.privacy)) errors.push("privacy is required");
  else {
    if (receipt.privacy.localOnly !== true) errors.push("privacy.localOnly must be true");
    if (receipt.privacy.noAccount !== true) errors.push("privacy.noAccount must be true");
    if (receipt.privacy.containsResumeBody !== false) errors.push("receipt must not contain resume body");
    if (receipt.privacy.containsJobDescriptionBody !== false) errors.push("receipt must not contain JD body");
  }

  if (!isObject(receipt.tester) || typeof receipt.tester.label !== "string") {
    errors.push("tester.label is required");
  }

  if (!isObject(receipt.attestations)) {
    errors.push("attestations are required");
  } else if (typeof receipt.attestations.noOperatorAssistance !== "boolean") {
    errors.push("attestations.noOperatorAssistance must be boolean");
  }

  if (!isObject(receipt.completion)) errors.push("completion is required");
  else {
    if (typeof receipt.completion.coreFlowComplete !== "boolean") {
      errors.push("completion.coreFlowComplete must be boolean");
    }
    if (typeof receipt.completion.interviewOutcomeRecorded !== "boolean") {
      errors.push("completion.interviewOutcomeRecorded must be boolean");
    }
    if (!Number.isInteger(receipt.completion.requiredPassed)) {
      errors.push("completion.requiredPassed must be integer");
    }
    if (!Number.isInteger(receipt.completion.requiredTotal)) {
      errors.push("completion.requiredTotal must be integer");
    }
    if (
      Number.isInteger(receipt.completion.requiredPassed) &&
      Number.isInteger(receipt.completion.requiredTotal) &&
      receipt.completion.coreFlowComplete !==
        (receipt.completion.requiredPassed === receipt.completion.requiredTotal)
    ) {
      errors.push("completion.coreFlowComplete must match requiredPassed/requiredTotal");
    }
    if (receipt.completion.coreFlowComplete === true && receipt.attestations?.noOperatorAssistance !== true) {
      errors.push("coreFlowComplete requires no operator assistance attestation");
    }
  }

  if (!Array.isArray(receipt.criteria) || receipt.criteria.length === 0) {
    errors.push("criteria must be a non-empty array");
  } else {
    const failed = receipt.criteria.filter((criterion) => !criterion?.pass).length;
    if (receipt.completion?.coreFlowComplete === true && failed > 0) {
      errors.push("coreFlowComplete cannot be true while criteria fail");
    }
  }

  if (!isObject(receipt.outcome) || typeof receipt.outcome.status !== "string") {
    errors.push("outcome.status is required");
  }

  if (!isObject(receipt.fingerprints)) errors.push("fingerprints are required");
  else {
    if (typeof receipt.fingerprints.resume !== "string") errors.push("fingerprints.resume is required");
    if (typeof receipt.fingerprints.jobDescription !== "string") {
      errors.push("fingerprints.jobDescription is required");
    }
  }

  if (!isObject(receipt.integrity)) errors.push("integrity is required");
  else {
    if (receipt.integrity.algorithm !== "fnv1a-stable-v1") {
      errors.push("integrity.algorithm must be fnv1a-stable-v1");
    }
    if (typeof receipt.integrity.digest !== "string" || !/^[a-f0-9]{8}$/.test(receipt.integrity.digest)) {
      errors.push("integrity.digest must be 8 lowercase hex chars");
    } else {
      const expectedDigest = checksum(stableStringify(integritySourceFor(receipt)));
      if (receipt.integrity.digest !== expectedDigest) errors.push("integrity.digest mismatch");
    }
  }

  return errors;
};

const bestWindowFor = (receipts, windowDays) => {
  const windowMs = windowDays * 24 * 60 * 60 * 1000;
  const sorted = receipts
    .map((receipt) => ({ ...receipt, timestamp: Date.parse(receipt.createdAt) }))
    .filter((receipt) => Number.isFinite(receipt.timestamp))
    .sort((left, right) => left.timestamp - right.timestamp);

  let best = { count: 0, start: "", end: "", receiptIds: [] };
  for (let startIndex = 0; startIndex < sorted.length; startIndex += 1) {
    const start = sorted[startIndex].timestamp;
    const end = start + windowMs;
    const window = sorted.filter((receipt) => receipt.timestamp >= start && receipt.timestamp <= end);
    if (window.length > best.count) {
      best = {
        count: window.length,
        start: new Date(start).toISOString(),
        end: new Date(end).toISOString(),
        receiptIds: window.map((receipt) => receipt.receiptId),
      };
    }
  }
  return best;
};

const auditValidationReceipts = async (flags) => {
  const files = await receiptFilesFor(flags.input);
  const records = [];

  for (const file of files) {
    let receipt = null;
    let errors = [];
    try {
      receipt = JSON.parse(await readFile(file, "utf8"));
      errors = validateReceiptShape(receipt);
    } catch (error) {
      errors = [`Invalid JSON: ${error.message}`];
    }

    const tester = receipt?.tester?.label?.trim() ?? "";
    const testerKey = tester.toLowerCase();
    const coreFlowComplete = receipt?.completion?.coreFlowComplete === true;
    const noOperatorAssistance = receipt?.attestations?.noOperatorAssistance === true;
    const interviewOutcome =
      receipt?.outcome?.status === "interview" || receipt?.outcome?.status === "offer";
    const hasOutcomeNotes = Boolean(receipt?.outcome?.notes?.trim());
    const countableCompletion =
      errors.length === 0 &&
      coreFlowComplete &&
      noOperatorAssistance &&
      testerKey &&
      testerKey !== "anonymous tester";
    const countableInterview = countableCompletion && interviewOutcome && hasOutcomeNotes;

    records.push({
      file,
      receiptId: receipt?.receiptId ?? basename(file),
      tester: tester || "missing",
      createdAt: receipt?.createdAt ?? "",
      coreFlowComplete,
      noOperatorAssistance,
      outcome: receipt?.outcome?.status ?? "missing",
      hasOutcomeNotes,
      countableCompletion,
      countableInterview,
      errors,
    });
  }

  const ids = new Map();
  for (const record of records) {
    ids.set(record.receiptId, (ids.get(record.receiptId) ?? 0) + 1);
  }
  for (const record of records) {
    if (ids.get(record.receiptId) > 1) record.errors.push("duplicate receiptId");
  }
  for (const record of records) {
    const testerKey = record.tester.trim().toLowerCase();
    record.countableCompletion =
      record.errors.length === 0 &&
      record.coreFlowComplete &&
      record.noOperatorAssistance &&
      testerKey &&
      testerKey !== "anonymous tester";
    record.countableInterview =
      record.countableCompletion &&
      (record.outcome === "interview" || record.outcome === "offer") &&
      record.hasOutcomeNotes;
  }

  const completionUsers = new Set(
    records.filter((record) => record.countableCompletion).map((record) => record.tester.toLowerCase()),
  );
  const interviewReceipts = records.filter((record) => record.countableInterview);
  const requiredCompletions = toNumber(flags["require-completions"], 5);
  const requiredInterviews = toNumber(flags["require-interviews"], 10);
  const windowDays = Math.max(1, toNumber(flags["window-days"], 7));
  const bestInterviewWindow = bestWindowFor(interviewReceipts, windowDays);
  const invalidReceipts = records.filter((record) => record.errors.length > 0).length;
  const gates = {
    fiveUserCompletion: completionUsers.size >= requiredCompletions,
    interviewProduction: bestInterviewWindow.count >= requiredInterviews,
    noInvalidReceipts: invalidReceipts === 0,
  };

  return {
    schema: "resumebuilder.validation-audit.v1",
    generatedAt: new Date().toISOString(),
    input: flags.input,
    requirements: {
      uniqueCompletionUsers: requiredCompletions,
      interviewProducingReceipts: requiredInterviews,
      interviewWindowDays: windowDays,
    },
    totals: {
      files: files.length,
      validReceipts: files.length - invalidReceipts,
      invalidReceipts,
      completeReceipts: records.filter((record) => record.countableCompletion).length,
      uniqueCompletionUsers: completionUsers.size,
      interviewProducingReceipts: interviewReceipts.length,
      bestInterviewWindowCount: bestInterviewWindow.count,
    },
    bestInterviewWindow,
    gates: {
      ...gates,
      all: gates.fiveUserCompletion && gates.interviewProduction && gates.noInvalidReceipts,
    },
    receipts: records,
  };
};

const printValidationAudit = (report) => {
  console.log("Validation receipt audit");
  console.log(`Input: ${report.input}`);
  console.log(`Receipts: ${report.totals.validReceipts}/${report.totals.files} valid`);
  console.log(
    `Five-user gate: ${report.totals.uniqueCompletionUsers}/${report.requirements.uniqueCompletionUsers} unique completion users`,
  );
  console.log(
    `Interview gate: ${report.totals.bestInterviewWindowCount}/${report.requirements.interviewProducingReceipts} interview-producing receipts in ${report.requirements.interviewWindowDays} days`,
  );
  if (report.bestInterviewWindow.start) {
    console.log(`Best interview window: ${report.bestInterviewWindow.start} to ${report.bestInterviewWindow.end}`);
  }
  if (report.totals.invalidReceipts) {
    console.log("Invalid receipts:");
    for (const receipt of report.receipts.filter((record) => record.errors.length > 0)) {
      console.log(`- ${receipt.file}: ${receipt.errors.join("; ")}`);
    }
  }
  console.log(`Result: ${report.gates.all ? "pass" : "fail"}`);
};

const main = async () => {
  const flags = parseArgs(process.argv.slice(2));
  if (!flags.command || flags.help) {
    console.log(usage());
    return;
  }

  if (flags.command === "score") {
    const resume = await readResume(flags.input);
    console.log(JSON.stringify(scoreResume(resume), null, 2));
    return;
  }

  if (flags.command === "export") {
    const resume = await readResume(flags.input);
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

  if (flags.command === "validate") {
    const report = await auditValidationReceipts(flags);
    if (flags.json) console.log(JSON.stringify(report, null, 2));
    else printValidationAudit(report);
    if (!report.gates.all) process.exitCode = 1;
    return;
  }

  throw new Error(`Unknown command: ${flags.command}\n${usage()}`);
};

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
