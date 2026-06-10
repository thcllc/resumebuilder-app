#!/usr/bin/env node
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";

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
  node cli/resume.mjs accept --input receipts --out receipts/ACCEPTED_RECEIPTS.json --owner "Jane Owner" --receipt-ids rbv-1234abcd
  node cli/resume.mjs release --input receipts --accepted receipts/ACCEPTED_RECEIPTS.json --waiver receipts/VALIDATION_WAIVER.md --json
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

const evidenceControlJsonFiles = new Set([
  "ACCEPTED_RECEIPTS.json",
  "ACCEPTED_RECEIPTS.example.json",
]);

const validationOutcomeStatuses = new Set([
  "not-sent",
  "sent",
  "interview",
  "offer",
  "rejected",
  "no-response",
]);

const requiredValidationCriterionIds = [
  "resume-ready",
  "jd-pasted",
  "tailoring-computed",
  "diff-reviewed",
  "draft-accepted",
  "no-operator-assistance",
  "tester-labeled",
  "json-exported",
  "pdf-exported",
];

const isInterviewStatus = (status) => status === "interview" || status === "offer";

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
      return entry.isFile() &&
        entry.name.endsWith(".json") &&
        !evidenceControlJsonFiles.has(entry.name)
        ? [path]
        : [];
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
  } else {
    const testerLabel = receipt.tester.label.trim().toLowerCase();
    if (!testerLabel || testerLabel === "anonymous tester") {
      errors.push("tester.label must be non-anonymous");
    }
  }

  if (!isObject(receipt.attestations)) {
    errors.push("attestations are required");
  } else if (typeof receipt.attestations.noOperatorAssistance !== "boolean") {
    errors.push("attestations.noOperatorAssistance must be boolean");
  }

  if (!isObject(receipt.target)) {
    errors.push("target is required");
  } else {
    if (typeof receipt.target.title !== "string" || !receipt.target.title.trim()) {
      errors.push("target.title is required");
    }
    if (typeof receipt.target.company !== "string" || !receipt.target.company.trim()) {
      errors.push("target.company is required");
    }
    if (receipt.target.source !== "parsed" && receipt.target.source !== "unknown") {
      errors.push("target.source must be parsed or unknown");
    }
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

  let passedCriteria = 0;
  if (!Array.isArray(receipt.criteria) || receipt.criteria.length === 0) {
    errors.push("criteria must be a non-empty array");
  } else {
    const criterionIds = new Set();
    for (const criterion of receipt.criteria) {
      if (!isObject(criterion)) {
        errors.push("criteria entries must be objects");
        continue;
      }
      if (typeof criterion.id !== "string" || !criterion.id.trim()) {
        errors.push("criteria.id is required");
      } else {
        if (criterionIds.has(criterion.id)) errors.push(`duplicate criteria id: ${criterion.id}`);
        criterionIds.add(criterion.id);
      }
      if (typeof criterion.label !== "string" || !criterion.label.trim()) {
        errors.push(`criteria.${criterion.id ?? "unknown"}.label is required`);
      }
      if (typeof criterion.pass !== "boolean") {
        errors.push(`criteria.${criterion.id ?? "unknown"}.pass must be boolean`);
      } else if (criterion.pass) {
        passedCriteria += 1;
      }
      if (typeof criterion.evidence !== "string" || !criterion.evidence.trim()) {
        errors.push(`criteria.${criterion.id ?? "unknown"}.evidence is required`);
      }
    }
    for (const criterionId of requiredValidationCriterionIds) {
      if (!criterionIds.has(criterionId)) errors.push(`criteria missing required id: ${criterionId}`);
    }
    for (const criterionId of criterionIds) {
      if (!requiredValidationCriterionIds.includes(criterionId)) {
        errors.push(`criteria contains unknown id: ${criterionId}`);
      }
    }
    const failed = receipt.criteria.filter((criterion) => criterion?.pass !== true).length;
    if (isObject(receipt.completion)) {
      if (
        Number.isInteger(receipt.completion.requiredPassed) &&
        receipt.completion.requiredPassed !== passedCriteria
      ) {
        errors.push("completion.requiredPassed must match passed criteria count");
      }
      if (
        Number.isInteger(receipt.completion.requiredTotal) &&
        receipt.completion.requiredTotal !== receipt.criteria.length
      ) {
        errors.push("completion.requiredTotal must match criteria count");
      }
      if (
        typeof receipt.completion.coreFlowComplete === "boolean" &&
        receipt.completion.coreFlowComplete !== (failed === 0)
      ) {
        errors.push("completion.coreFlowComplete must match criteria pass state");
      }
    }
    if (receipt.completion?.coreFlowComplete === true && failed > 0) {
      errors.push("coreFlowComplete cannot be true while criteria fail");
    }
  }

  if (!isObject(receipt.metrics)) {
    errors.push("metrics are required");
  } else {
    for (const field of ["baseScore", "tailoredScore", "scoreDelta"]) {
      if (typeof receipt.metrics[field] !== "number" || !Number.isFinite(receipt.metrics[field])) {
        errors.push(`metrics.${field} must be a finite number`);
      }
    }
    for (const field of ["keywordCount", "matchedKeywordCount", "patchCount", "savedApplicationForks"]) {
      if (!Number.isInteger(receipt.metrics[field]) || receipt.metrics[field] < 0) {
        errors.push(`metrics.${field} must be a non-negative integer`);
      }
    }
    if (
      Number.isFinite(receipt.metrics.baseScore) &&
      Number.isFinite(receipt.metrics.tailoredScore) &&
      Number.isFinite(receipt.metrics.scoreDelta) &&
      receipt.metrics.tailoredScore - receipt.metrics.baseScore !== receipt.metrics.scoreDelta
    ) {
      errors.push("metrics.scoreDelta must equal tailoredScore minus baseScore");
    }
    if (
      Number.isInteger(receipt.metrics.keywordCount) &&
      Number.isInteger(receipt.metrics.matchedKeywordCount) &&
      receipt.metrics.matchedKeywordCount > receipt.metrics.keywordCount
    ) {
      errors.push("metrics.matchedKeywordCount cannot exceed keywordCount");
    }
  }

  if (!isObject(receipt.exports)) {
    errors.push("exports are required");
  } else {
    if (
      receipt.exports.jsonAt !== undefined &&
      (typeof receipt.exports.jsonAt !== "string" || Number.isNaN(Date.parse(receipt.exports.jsonAt)))
    ) {
      errors.push("exports.jsonAt must be an ISO timestamp");
    }
    if (
      receipt.exports.pdfAt !== undefined &&
      (typeof receipt.exports.pdfAt !== "string" || Number.isNaN(Date.parse(receipt.exports.pdfAt)))
    ) {
      errors.push("exports.pdfAt must be an ISO timestamp");
    }
    if (receipt.completion?.coreFlowComplete === true) {
      if (Number.isNaN(Date.parse(receipt.exports.jsonAt ?? ""))) {
        errors.push("complete receipts require exports.jsonAt");
      }
      if (Number.isNaN(Date.parse(receipt.exports.pdfAt ?? ""))) {
        errors.push("complete receipts require exports.pdfAt");
      }
    }
  }

  if (!isObject(receipt.outcome) || typeof receipt.outcome.status !== "string") {
    errors.push("outcome.status is required");
  } else {
    if (!validationOutcomeStatuses.has(receipt.outcome.status)) {
      errors.push("outcome.status must be a known validation outcome");
    }
    if (typeof receipt.outcome.notes !== "string") {
      errors.push("outcome.notes must be a string");
    }
    if (
      isObject(receipt.completion) &&
      typeof receipt.completion.interviewOutcomeRecorded === "boolean" &&
      validationOutcomeStatuses.has(receipt.outcome.status) &&
      receipt.completion.interviewOutcomeRecorded !== isInterviewStatus(receipt.outcome.status)
    ) {
      errors.push("completion.interviewOutcomeRecorded must match outcome.status");
    }
    if (isInterviewStatus(receipt.outcome.status) && !receipt.outcome.notes?.trim()) {
      errors.push("interview or offer outcomes require outcome.notes");
    }
  }

  if (!isObject(receipt.fingerprints)) errors.push("fingerprints are required");
  else {
    if (typeof receipt.fingerprints.resume !== "string") errors.push("fingerprints.resume is required");
    if (typeof receipt.fingerprints.jobDescription !== "string") {
      errors.push("fingerprints.jobDescription is required");
    }
  }

  if (!Array.isArray(receipt.patchTargets)) {
    errors.push("patchTargets must be an array");
  } else {
    if (receipt.patchTargets.some((target) => typeof target !== "string" || !target.trim())) {
      errors.push("patchTargets entries must be non-empty strings");
    }
    if (receipt.completion?.coreFlowComplete === true && receipt.patchTargets.length === 0) {
      errors.push("complete receipts require at least one patch target");
    }
    if (
      isObject(receipt.metrics) &&
      Number.isInteger(receipt.metrics.patchCount) &&
      receipt.metrics.patchCount !== receipt.patchTargets.length
    ) {
      errors.push("metrics.patchCount must match patchTargets count");
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

const validateAcceptedReceipts = async (input) => {
  if (!input) {
    return {
      provided: false,
      valid: false,
      file: "",
      receiptIds: [],
      errors: ["No acceptance manifest provided"],
    };
  }

  let manifest = null;
  try {
    manifest = JSON.parse(await readFile(input, "utf8"));
  } catch (error) {
    return {
      provided: true,
      valid: false,
      file: input,
      receiptIds: [],
      errors: [`Cannot read acceptance manifest: ${error.message}`],
    };
  }

  const errors = [];
  if (!isObject(manifest)) {
    return {
      provided: true,
      valid: false,
      file: input,
      receiptIds: [],
      errors: ["Acceptance manifest must be an object"],
    };
  }

  if (manifest.schema !== "resumebuilder.accepted-receipts.v1") {
    errors.push("schema must be resumebuilder.accepted-receipts.v1");
  }
  if (manifest.project !== "resumebuilder-app") {
    errors.push("project must be resumebuilder-app");
  }
  if (isPlaceholder(manifest.acceptedBy)) {
    errors.push("acceptedBy is required");
  }
  if (Number.isNaN(Date.parse(manifest.acceptedAt ?? ""))) {
    errors.push("acceptedAt must be an ISO timestamp");
  } else if (Date.parse(manifest.acceptedAt) > Date.now()) {
    errors.push("acceptedAt cannot be in the future");
  }
  if (!Array.isArray(manifest.receiptIds) || manifest.receiptIds.length === 0) {
    errors.push("receiptIds must be a non-empty array");
  }

  const receiptIds = Array.isArray(manifest.receiptIds)
    ? manifest.receiptIds.map((receiptId) => String(receiptId).trim())
    : [];
  const uniqueReceiptIds = new Set(receiptIds);
  if (uniqueReceiptIds.size !== receiptIds.length) {
    errors.push("receiptIds must not contain duplicates");
  }
  for (const receiptId of receiptIds) {
    if (!/^rbv-[a-f0-9]{8}$/.test(receiptId)) {
      errors.push(`invalid receiptId: ${receiptId}`);
    }
  }

  return {
    provided: true,
    valid: errors.length === 0,
    file: input,
    receiptIds,
    acceptedBy: manifest.acceptedBy ?? "",
    acceptedAt: manifest.acceptedAt ?? "",
    errors,
  };
};

const parseWaiverFields = (text) => {
  const fields = {};
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z ]+):\s*(.*)$/);
    if (!match) continue;
    fields[match[1].trim().toLowerCase().replace(/\s+/g, "-")] = match[2].trim();
  }
  return fields;
};

const isPlaceholder = (value) =>
  typeof value !== "string" ||
  !value.trim() ||
  /^(todo|tbd|n\/a|none|placeholder|\[.+\]|<.+>)$/i.test(value.trim());

const validateOwnerWaiver = async (input) => {
  if (!input) {
    return {
      provided: false,
      valid: false,
      file: "",
      fields: {},
      errors: ["No waiver file provided"],
    };
  }

  let text = "";
  try {
    text = await readFile(input, "utf8");
  } catch (error) {
    return {
      provided: true,
      valid: false,
      file: input,
      fields: {},
      errors: [`Cannot read waiver file: ${error.message}`],
    };
  }

  const fields = parseWaiverFields(text);
  const errors = [];
  const waiverDate = Date.parse(`${fields.date ?? ""}T00:00:00.000Z`);
  const now = Date.now();

  if (fields["waiver-status"] !== "waived") {
    errors.push("Waiver status must be waived");
  }
  if (fields.project !== "resumebuilder-app") {
    errors.push("Project must be resumebuilder-app");
  }
  if (isPlaceholder(fields.owner)) {
    errors.push("Owner is required");
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fields.date ?? "") || Number.isNaN(waiverDate)) {
    errors.push("Date must be YYYY-MM-DD");
  } else if (waiverDate > now) {
    errors.push("Date cannot be in the future");
  }
  if (fields.scope !== "external validation receipt gate") {
    errors.push("Scope must be external validation receipt gate");
  }
  const statement = fields.statement ?? "";
  if (!/explicitly waive/i.test(statement) || !/real-user validation/i.test(statement)) {
    errors.push("Statement must explicitly waive the real-user validation gate");
  }
  if (isPlaceholder(fields.signature)) {
    errors.push("Signature is required");
  }

  return {
    provided: true,
    valid: errors.length === 0,
    file: input,
    fields,
    errors,
  };
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

const isCountableTester = (tester) => {
  const testerKey = String(tester ?? "").trim().toLowerCase();
  return Boolean(testerKey) && testerKey !== "anonymous tester" && testerKey !== "missing";
};

const isReviewCandidate = (record) =>
  record.errors.length === 0 &&
  record.coreFlowComplete &&
  record.noOperatorAssistance &&
  isCountableTester(record.tester);

const ownerReviewFor = (records) => {
  const completionCandidates = records.filter(isReviewCandidate);
  const interviewCandidates = completionCandidates.filter(
    (record) =>
      (record.outcome === "interview" || record.outcome === "offer") &&
      record.hasOutcomeNotes,
  );

  return {
    completionReceiptIds: completionCandidates.map((record) => record.receiptId),
    interviewReceiptIds: interviewCandidates.map((record) => record.receiptId),
    receipts: completionCandidates.map((record) => ({
      receiptId: record.receiptId,
      tester: record.tester,
      outcome: record.outcome,
      hasOutcomeNotes: record.hasOutcomeNotes,
      createdAt: record.createdAt,
      file: record.file,
    })),
  };
};

const defaultAcceptanceOutFor = async (input) => {
  const info = await stat(input);
  return join(info.isDirectory() ? input : dirname(input), "ACCEPTED_RECEIPTS.json");
};

const defaultWaiverOutFor = async (input) => {
  const info = await stat(input);
  return join(info.isDirectory() ? input : dirname(input), "VALIDATION_WAIVER.md");
};

const shellToken = (value) => {
  const text = String(value ?? "");
  if (/^[A-Za-z0-9_./:@%+=,-]+$/.test(text)) return text;
  return `'${text.replaceAll("'", "'\\''")}'`;
};

const ownerAcceptanceCommandFor = ({ input, out, receiptIds }) =>
  [
    "node app/cli/resume.mjs accept",
    `--input ${shellToken(input)}`,
    `--out ${shellToken(out)}`,
    `--owner ${shellToken("OWNER NAME")}`,
    `--receipt-ids ${shellToken(receiptIds.join(","))}`,
  ].join(" ");

const auditValidationReceipts = async (flags) => {
  const files = await receiptFilesFor(flags.input);
  const acceptanceRequired = flags.requireAccepted === true || flags["require-accepted"] === "true";
  const acceptance = await validateAcceptedReceipts(flags.accepted);
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
    const coreFlowComplete = receipt?.completion?.coreFlowComplete === true;
    const noOperatorAssistance = receipt?.attestations?.noOperatorAssistance === true;
    const hasOutcomeNotes = Boolean(receipt?.outcome?.notes?.trim());
    records.push({
      file,
      receiptId: receipt?.receiptId ?? basename(file),
      tester: tester || "missing",
      createdAt: receipt?.createdAt ?? "",
      coreFlowComplete,
      noOperatorAssistance,
      ownerAccepted: false,
      outcome: receipt?.outcome?.status ?? "missing",
      hasOutcomeNotes,
      countableCompletion: false,
      countableInterview: false,
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
  if (acceptance.valid) {
    const recordIds = new Set(records.map((record) => record.receiptId));
    for (const receiptId of acceptance.receiptIds) {
      if (!recordIds.has(receiptId)) {
        acceptance.errors.push(`accepted receiptId not found: ${receiptId}`);
      }
    }
    acceptance.valid = acceptance.errors.length === 0;
  }
  for (const record of records) {
    record.ownerAccepted = acceptance.valid && acceptance.receiptIds.includes(record.receiptId);
    const acceptedForCounting =
      record.ownerAccepted || (!acceptance.provided && !acceptanceRequired);
    record.countableCompletion =
      record.errors.length === 0 &&
      record.coreFlowComplete &&
      record.noOperatorAssistance &&
      acceptedForCounting &&
      isCountableTester(record.tester);
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
  const ownerAcceptance = (!acceptance.provided && !acceptanceRequired) || acceptance.valid;
  const ownerReview = {
    ...ownerReviewFor(records),
    acceptanceOut: await defaultAcceptanceOutFor(flags.input),
  };
  ownerReview.acceptanceCommand = ownerReview.completionReceiptIds.length
    ? ownerAcceptanceCommandFor({
        input: flags.input,
        out: ownerReview.acceptanceOut,
        receiptIds: ownerReview.completionReceiptIds,
      })
    : "";
  const gates = {
    fiveUserCompletion: completionUsers.size >= requiredCompletions,
    interviewProduction: bestInterviewWindow.count >= requiredInterviews,
    noInvalidReceipts: invalidReceipts === 0,
    ownerAcceptance,
  };

  return {
    schema: "resumebuilder.validation-audit.v1",
    generatedAt: new Date().toISOString(),
    input: flags.input,
    requirements: {
      uniqueCompletionUsers: requiredCompletions,
      interviewProducingReceipts: requiredInterviews,
      interviewWindowDays: windowDays,
      ownerAcceptanceRequired: acceptanceRequired,
    },
    totals: {
      files: files.length,
      validReceipts: files.length - invalidReceipts,
      invalidReceipts,
      ownerAcceptedReceipts: records.filter((record) => record.ownerAccepted).length,
      completeReceipts: records.filter((record) => record.countableCompletion).length,
      uniqueCompletionUsers: completionUsers.size,
      interviewProducingReceipts: interviewReceipts.length,
      bestInterviewWindowCount: bestInterviewWindow.count,
    },
    bestInterviewWindow,
    ownerReview,
    acceptance,
    gates: {
      ...gates,
      all:
        gates.fiveUserCompletion &&
        gates.interviewProduction &&
        gates.noInvalidReceipts &&
        gates.ownerAcceptance,
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
  if (report.ownerReview.completionReceiptIds.length) {
    console.log("Owner review candidates:");
    for (const receipt of report.ownerReview.receipts) {
      const outcomeNote = receipt.hasOutcomeNotes ? "notes" : "no notes";
      console.log(`- ${receipt.receiptId}: ${receipt.tester}, ${receipt.outcome}, ${outcomeNote}`);
    }
    console.log(`Acceptance command template: ${report.ownerReview.acceptanceCommand}`);
  }
  if (report.acceptance.provided || report.requirements.ownerAcceptanceRequired) {
    console.log(`Owner acceptance: ${report.acceptance.valid ? "pass" : "fail"}`);
    if (report.acceptance.errors.length) console.log(`Acceptance errors: ${report.acceptance.errors.join("; ")}`);
  }
  console.log(`Result: ${report.gates.all ? "pass" : "fail"}`);
};

const parseReceiptIds = (value) =>
  String(value ?? "")
    .split(/[,\s]+/)
    .map((receiptId) => receiptId.trim())
    .filter(Boolean);

const writeAcceptanceManifest = async (flags) => {
  const input = flags.input || "receipts";
  const owner = String(flags.owner ?? "").trim();
  const receiptIds = parseReceiptIds(flags["receipt-ids"]);
  const errors = [];

  if (isPlaceholder(owner)) errors.push("--owner is required and cannot be a placeholder");
  if (!receiptIds.length) errors.push("--receipt-ids must list at least one explicit receipt id");

  const uniqueReceiptIds = new Set(receiptIds);
  if (uniqueReceiptIds.size !== receiptIds.length) errors.push("--receipt-ids must not contain duplicates");
  for (const receiptId of receiptIds) {
    if (!/^rbv-[a-f0-9]{8}$/.test(receiptId)) errors.push(`invalid receiptId: ${receiptId}`);
  }
  if (errors.length) throw new Error(`Cannot write acceptance manifest:\n- ${errors.join("\n- ")}`);

  const audit = await auditValidationReceipts({
    input,
    "require-completions": 0,
    "require-interviews": 0,
    "window-days": flags["window-days"] || 7,
  });
  const recordsById = new Map(audit.receipts.map((record) => [record.receiptId, record]));
  const acceptanceErrors = [];

  for (const receiptId of receiptIds) {
    const record = recordsById.get(receiptId);
    if (!record) {
      acceptanceErrors.push(`${receiptId}: receipt not found in ${input}`);
      continue;
    }
    if (record.errors.length) {
      acceptanceErrors.push(`${receiptId}: ${record.errors.join("; ")}`);
      continue;
    }
    const testerKey = record.tester.trim().toLowerCase();
    if (!record.coreFlowComplete) acceptanceErrors.push(`${receiptId}: core flow is incomplete`);
    if (!record.noOperatorAssistance) {
      acceptanceErrors.push(`${receiptId}: no-assistance attestation is missing`);
    }
    if (!testerKey || testerKey === "anonymous tester" || testerKey === "missing") {
      acceptanceErrors.push(`${receiptId}: tester label is not countable`);
    }
  }

  if (acceptanceErrors.length) {
    throw new Error(`Cannot accept receipts:\n- ${acceptanceErrors.join("\n- ")}`);
  }

  const out = flags.out || (await defaultAcceptanceOutFor(input));
  const manifest = {
    schema: "resumebuilder.accepted-receipts.v1",
    project: "resumebuilder-app",
    acceptedBy: owner,
    acceptedAt: new Date().toISOString(),
    receiptIds,
    notes: flags.notes || "Accepted by the owner as real-user validation evidence.",
  };

  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, `${JSON.stringify(manifest, null, 2)}\n`);

  return {
    schema: "resumebuilder.acceptance-write.v1",
    generatedAt: new Date().toISOString(),
    input,
    out,
    acceptedReceipts: receiptIds.length,
    manifest,
  };
};

const printAcceptanceWrite = (report) => {
  console.log(`Wrote ${report.out}`);
  console.log(`Accepted receipts: ${report.acceptedReceipts}`);
  console.log(`Owner: ${report.manifest.acceptedBy}`);
};

const releaseBlockersFor = ({ validation, waiver, externalValidation }) => {
  if (externalValidation) return [];

  const blockers = [];
  if (validation.totals.invalidReceipts > 0) {
    blockers.push({
      id: "receipt.invalid",
      message: "Fix or remove invalid validation receipt files.",
      evidence: `${validation.totals.invalidReceipts} invalid receipt(s)`,
    });
  }
  if (!validation.gates.fiveUserCompletion) {
    blockers.push({
      id: "receipt.completion-shortfall",
      message: "Collect enough owner-accepted completion receipts from unique non-anonymous testers.",
      evidence: `${validation.totals.uniqueCompletionUsers}/${validation.requirements.uniqueCompletionUsers} unique completion users`,
    });
  }
  if (!validation.gates.interviewProduction) {
    blockers.push({
      id: "receipt.interview-shortfall",
      message: "Collect enough owner-accepted interview-producing receipts inside the configured window.",
      evidence: `${validation.totals.bestInterviewWindowCount}/${validation.requirements.interviewProducingReceipts} interview-producing receipts in ${validation.requirements.interviewWindowDays} days`,
    });
  }
  if (!validation.gates.ownerAcceptance) {
    blockers.push({
      id: "receipt.owner-acceptance",
      message: "Write a valid owner acceptance manifest for explicit reviewed receipt ids.",
      evidence: validation.acceptance.errors.join("; ") || "Owner acceptance manifest is not valid",
    });
  }
  if (!waiver.valid) {
    blockers.push({
      id: "waiver.invalid-or-missing",
      message: "Provide an explicit valid owner waiver only if the owner chooses to waive external validation.",
      evidence: waiver.errors.join("; ") || "Owner waiver is not valid",
    });
  }

  return blockers;
};

const releaseNextActionsFor = ({ validation, waiver, acceptedPath, waiverPath }) => {
  if (validation.gates.all || waiver.valid) return [];

  const actions = [];
  if (validation.totals.invalidReceipts > 0) {
    actions.push({
      id: "fix-invalid-receipts",
      command: `node app/cli/resume.mjs validate --input ${shellToken(validation.input)} --json`,
      description: "Inspect receipt errors, then remove or replace invalid receipt files.",
    });
  }
  if (!validation.gates.fiveUserCompletion || !validation.gates.interviewProduction) {
    actions.push({
      id: "collect-more-receipts",
      url: "https://resumebuilder.app/#validate",
      description: "Run the tester campaign until countable receipts satisfy completion and interview gates.",
    });
  }
  if (!validation.gates.ownerAcceptance && validation.ownerReview.acceptanceCommand) {
    actions.push({
      id: "review-and-accept-receipts",
      command: validation.ownerReview.acceptanceCommand,
      description: "Review candidate receipt files, then accept only ids the owner explicitly approves.",
    });
  } else if (!validation.gates.ownerAcceptance) {
    actions.push({
      id: "write-owner-acceptance",
      command: `node app/cli/resume.mjs accept --input ${shellToken(validation.input)} --out ${shellToken(acceptedPath)} --owner ${shellToken("OWNER NAME")} --receipt-ids ${shellToken("rbv-1234abcd")}`,
      description: "Write an owner acceptance manifest after countable receipt ids exist.",
    });
  }
  if (!waiver.valid) {
    actions.push({
      id: "optional-owner-waiver",
      command: `cp receipts/VALIDATION_WAIVER.example.md ${shellToken(waiverPath)}`,
      description: "Use only if the owner explicitly waives the real-user validation gate.",
    });
  }

  return actions;
};

const auditReleaseReadiness = async (flags) => {
  const input = flags.input || "receipts";
  const validation = await auditValidationReceipts({
    ...flags,
    input,
    requireAccepted: true,
  });
  const waiver = await validateOwnerWaiver(flags.waiver);
  const externalValidation = validation.gates.all || waiver.valid;
  const acceptedPath = flags.accepted || (await defaultAcceptanceOutFor(validation.input));
  const waiverPath = flags.waiver || (await defaultWaiverOutFor(validation.input));
  const blockers = releaseBlockersFor({ validation, waiver, externalValidation });
  const nextActions = releaseNextActionsFor({ validation, waiver, acceptedPath, waiverPath });

  return {
    schema: "resumebuilder.release-audit.v1",
    generatedAt: new Date().toISOString(),
    requirements: {
      externalValidation: "valid receipt cohort or explicit owner waiver",
    },
    validation: {
      input: validation.input,
      gates: validation.gates,
      totals: validation.totals,
      bestInterviewWindow: validation.bestInterviewWindow,
      requirements: validation.requirements,
      ownerReview: validation.ownerReview,
      acceptance: validation.acceptance,
    },
    waiver,
    blockers,
    nextActions,
    gates: {
      receipts: validation.gates.all,
      ownerWaiver: waiver.valid,
      externalValidation,
      all: externalValidation,
    },
  };
};

const printReleaseAudit = (report) => {
  console.log("Release readiness audit");
  console.log(`Receipt gate: ${report.gates.receipts ? "pass" : "fail"}`);
  console.log(`Owner waiver: ${report.gates.ownerWaiver ? "pass" : "fail"}`);
  if (report.waiver.errors.length) {
    console.log(`Waiver errors: ${report.waiver.errors.join("; ")}`);
  }
  if (report.blockers.length) {
    console.log("Blockers:");
    for (const blocker of report.blockers) {
      console.log(`- ${blocker.id}: ${blocker.evidence}`);
    }
  }
  if (report.nextActions.length) {
    console.log("Next actions:");
    for (const action of report.nextActions) {
      console.log(`- ${action.id}: ${action.command ?? action.url}`);
    }
  }
  console.log(`External validation: ${report.gates.externalValidation ? "pass" : "fail"}`);
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

  if (flags.command === "accept") {
    const report = await writeAcceptanceManifest(flags);
    if (flags.json) console.log(JSON.stringify(report, null, 2));
    else printAcceptanceWrite(report);
    return;
  }

  if (flags.command === "release") {
    const report = await auditReleaseReadiness(flags);
    if (flags.json) console.log(JSON.stringify(report, null, 2));
    else printReleaseAudit(report);
    if (!report.gates.all) process.exitCode = 1;
    return;
  }

  throw new Error(`Unknown command: ${flags.command}\n${usage()}`);
};

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
