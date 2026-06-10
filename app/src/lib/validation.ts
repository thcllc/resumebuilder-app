import type { ResumeData } from "./resume";
import type { TailoringAnalysis } from "./tailoring";

export type ValidationOutcome =
  | "not-sent"
  | "sent"
  | "interview"
  | "offer"
  | "rejected"
  | "no-response";

export type ValidationState = {
  runId: string;
  startedAt: string;
  testerLabel: string;
  noOperatorAssistance: boolean;
  outcome: ValidationOutcome;
  notes: string;
  reviewedDiffAt?: string;
  acceptedDraftAt?: string;
  exportedJsonAt?: string;
  exportedPdfAt?: string;
};

export type ValidationVersion = {
  jd: string;
  jobTitle: string;
  company: string;
  status: string;
  matchScore: number;
};

export type ValidationCriterion = {
  id: string;
  label: string;
  pass: boolean;
  evidence: string;
};

export type ValidationReceipt = {
  schema: "resumebuilder.validation.v1";
  receiptId: string;
  createdAt: string;
  app: "resumebuilderapp";
  run: {
    id: string;
    startedAt: string;
  };
  privacy: {
    localOnly: true;
    noAccount: true;
    containsResumeBody: false;
    containsJobDescriptionBody: false;
  };
  tester: {
    label: string;
  };
  attestations: {
    noOperatorAssistance: boolean;
  };
  target: {
    title: string;
    company: string;
    source: TailoringAnalysis["job"]["source"];
  };
  completion: {
    coreFlowComplete: boolean;
    interviewOutcomeRecorded: boolean;
    requiredPassed: number;
    requiredTotal: number;
  };
  metrics: {
    baseScore: number;
    tailoredScore: number;
    scoreDelta: number;
    keywordCount: number;
    matchedKeywordCount: number;
    patchCount: number;
    savedApplicationForks: number;
  };
  criteria: ValidationCriterion[];
  exports: {
    jsonAt?: string;
    pdfAt?: string;
  };
  outcome: {
    status: ValidationOutcome;
    notes: string;
  };
  fingerprints: {
    resume: string;
    jobDescription: string;
  };
  patchTargets: string[];
  integrity: {
    algorithm: "fnv1a-stable-v1";
    digest: string;
  };
};

export type ReceiptAuditInput = {
  fileName: string;
  receipt?: unknown;
  error?: string;
};

export type ReceiptAuditRecord = {
  fileName: string;
  receiptId: string;
  tester: string;
  createdAt: string;
  coreFlowComplete: boolean;
  noOperatorAssistance: boolean;
  outcome: string;
  hasOutcomeNotes: boolean;
  countableCompletion: boolean;
  countableInterview: boolean;
  errors: string[];
};

export type ReceiptCohortAudit = {
  schema: "resumebuilder.validation-audit.v1";
  generatedAt: string;
  requirements: {
    uniqueCompletionUsers: number;
    interviewProducingReceipts: number;
    interviewWindowDays: number;
  };
  totals: {
    files: number;
    validReceipts: number;
    invalidReceipts: number;
    completeReceipts: number;
    uniqueCompletionUsers: number;
    interviewProducingReceipts: number;
    bestInterviewWindowCount: number;
  };
  bestInterviewWindow: {
    count: number;
    start: string;
    end: string;
    receiptIds: string[];
  };
  ownerReview: {
    completionReceiptIds: string[];
    interviewReceiptIds: string[];
    receipts: Array<{
      receiptId: string;
      tester: string;
      outcome: string;
      hasOutcomeNotes: boolean;
      createdAt: string;
      fileName: string;
    }>;
  };
  gates: {
    fiveUserCompletion: boolean;
    interviewProduction: boolean;
    noInvalidReceipts: boolean;
    all: boolean;
  };
  receipts: ReceiptAuditRecord[];
};

export type AcceptanceManifest = {
  schema: "resumebuilder.accepted-receipts.v1";
  project: "resumebuilder-app";
  acceptedBy: string;
  acceptedAt: string;
  receiptIds: string[];
  notes: string;
};

type ValidationInput = {
  resume: ResumeData;
  jd: string;
  analysis: TailoringAnalysis;
  versions: ValidationVersion[];
  state: ValidationState;
};

type ReceiptInput = ValidationInput & {
  createdAt?: string;
};

export const validationOutcomes: Array<[ValidationOutcome, string]> = [
  ["not-sent", "Not sent"],
  ["sent", "Sent"],
  ["interview", "Interview"],
  ["offer", "Offer"],
  ["rejected", "Rejected"],
  ["no-response", "No response"],
];

const validationOutcomeStatuses = new Set(validationOutcomes.map(([outcome]) => outcome));

const isPlaceholderValue = (value: string) =>
  !value.trim() || /^(todo|tbd|n\/a|none|placeholder|\[.+\]|<.+>)$/i.test(value.trim());

export const isAcceptanceOwnerNameValid = (owner: string) => !isPlaceholderValue(owner);

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

const validationRunId = () =>
  `run-${checksum(`${Date.now()}:${Math.random().toString(16).slice(2)}`)}`;

export const createValidationState = (): ValidationState => ({
  runId: validationRunId(),
  startedAt: new Date().toISOString(),
  testerLabel: "",
  noOperatorAssistance: false,
  outcome: "not-sent",
  notes: "",
});

const hasResumeContent = (resume: ResumeData) =>
  Boolean(resume.basics.name.trim()) &&
  Boolean(resume.basics.email.trim()) &&
  resume.summary.trim().length >= 40 &&
  resume.work.some((work) => work.name.trim() && work.position.trim() && work.highlights.some(Boolean)) &&
  resume.skills.some((skill) => skill.keywords.length >= 3);

const hasDetailedJd = (jd: string) => jd.trim().length >= 120;

const hasCountableTesterLabel = (label: string) => {
  const normalized = label.trim().toLowerCase();
  return Boolean(normalized) && normalized !== "anonymous tester";
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const hasSavedApplicationFork = ({ jd, analysis, versions }: ValidationInput) =>
  versions.some(
    (version) =>
      version.jd === jd &&
      version.jobTitle === analysis.job.title &&
      version.company === analysis.job.company,
  );

export const buildValidationChecklist = (input: ValidationInput): ValidationCriterion[] => {
  const { resume, jd, analysis, versions, state } = input;
  const matchedKeywords = analysis.keywords.filter((keyword) => keyword.hit).length;

  return [
    {
      id: "resume-ready",
      label: "Resume content is usable",
      pass: hasResumeContent(resume),
      evidence: `${resume.work.length} roles, ${resume.skills.flatMap((skill) => skill.keywords).length} skills, summary ${resume.summary.trim().length} chars`,
    },
    {
      id: "jd-pasted",
      label: "Job description was pasted",
      pass: hasDetailedJd(jd),
      evidence: `${jd.trim().length} JD characters analyzed locally`,
    },
    {
      id: "tailoring-computed",
      label: "Tailoring produced computed receipts",
      pass: analysis.keywords.length >= 3 && analysis.patches.length > 0,
      evidence: `${analysis.keywords.length} keywords, ${matchedKeywords} matched, ${analysis.patches.length} patches`,
    },
    {
      id: "diff-reviewed",
      label: "Diff page was reviewed",
      pass: Boolean(state.reviewedDiffAt),
      evidence: state.reviewedDiffAt ?? "No review timestamp yet",
    },
    {
      id: "draft-accepted",
      label: "Tailored draft was accepted",
      pass: Boolean(state.acceptedDraftAt) && hasSavedApplicationFork(input),
      evidence: state.acceptedDraftAt
        ? `${versions.length} saved forks; accepted ${state.acceptedDraftAt}`
        : `${versions.length} saved forks`,
    },
    {
      id: "no-operator-assistance",
      label: "Tester attested no operator assistance",
      pass: state.noOperatorAssistance,
      evidence: state.noOperatorAssistance
        ? "Tester marked the flow as completed without operator assistance"
        : "Tester has not attested independent completion",
    },
    {
      id: "tester-labeled",
      label: "Tester label is non-anonymous",
      pass: hasCountableTesterLabel(state.testerLabel),
      evidence: hasCountableTesterLabel(state.testerLabel)
        ? `Tester label: ${state.testerLabel.trim()}`
        : "Enter a non-anonymous tester label before exporting the receipt",
    },
    {
      id: "json-exported",
      label: "JSON Resume export was generated",
      pass: Boolean(state.exportedJsonAt),
      evidence: state.exportedJsonAt ?? "No JSON export timestamp yet",
    },
    {
      id: "pdf-exported",
      label: "PDF export was generated",
      pass: Boolean(state.exportedPdfAt),
      evidence: state.exportedPdfAt ?? "No PDF export timestamp yet",
    },
  ];
};

export const isInterviewOutcome = (outcome: ValidationOutcome) =>
  outcome === "interview" || outcome === "offer";

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

const integritySourceFor = (receipt: Record<string, unknown>) => {
  const { integrity: _integrity, ...source } = receipt;
  return source;
};

const resumeFingerprint = (resume: ResumeData) =>
  checksum(
    stableStringify({
      basics: resume.basics,
      education: resume.education,
      skills: resume.skills,
      summary: resume.summary,
      work: resume.work,
    }),
  );

export const buildValidationReceipt = ({
  resume,
  jd,
  analysis,
  versions,
  state,
  createdAt = new Date().toISOString(),
}: ReceiptInput): ValidationReceipt => {
  const criteria = buildValidationChecklist({ resume, jd, analysis, versions, state });
  const requiredPassed = criteria.filter((criterion) => criterion.pass).length;
  const jobDescription = jd.trim();
  const fingerprints = {
    resume: resumeFingerprint(resume),
    jobDescription: checksum(jobDescription),
  };
  const receiptId = `rbv-${checksum(
    stableStringify({
      createdAt,
      fingerprints,
      outcome: state.outcome,
      testerLabel: state.testerLabel,
      noOperatorAssistance: state.noOperatorAssistance,
    }),
  )}`;

  const receipt = {
    schema: "resumebuilder.validation.v1",
    receiptId,
    createdAt,
    app: "resumebuilderapp",
    run: {
      id: state.runId,
      startedAt: state.startedAt,
    },
    privacy: {
      localOnly: true,
      noAccount: true,
      containsResumeBody: false,
      containsJobDescriptionBody: false,
    },
    tester: {
      label: state.testerLabel.trim() || "anonymous tester",
    },
    attestations: {
      noOperatorAssistance: state.noOperatorAssistance,
    },
    target: {
      title: analysis.job.title,
      company: analysis.job.company,
      source: analysis.job.source,
    },
    completion: {
      coreFlowComplete: requiredPassed === criteria.length,
      interviewOutcomeRecorded: isInterviewOutcome(state.outcome),
      requiredPassed,
      requiredTotal: criteria.length,
    },
    metrics: {
      baseScore: analysis.score.base,
      tailoredScore: analysis.score.tailored,
      scoreDelta: analysis.score.delta,
      keywordCount: analysis.keywords.length,
      matchedKeywordCount: analysis.keywords.filter((keyword) => keyword.hit).length,
      patchCount: analysis.patches.length,
      savedApplicationForks: versions.length,
    },
    criteria,
    exports: {
      jsonAt: state.exportedJsonAt,
      pdfAt: state.exportedPdfAt,
    },
    outcome: {
      status: state.outcome,
      notes: state.notes.trim(),
    },
    fingerprints,
    patchTargets: analysis.patches.map((patch) => patch.target),
  } satisfies Omit<ValidationReceipt, "integrity">;

  return {
    ...receipt,
    integrity: {
      algorithm: "fnv1a-stable-v1",
      digest: checksum(stableStringify(receipt)),
    },
  };
};

const finiteNumber = (value: unknown) => typeof value === "number" && Number.isFinite(value);

const nonNegativeInteger = (value: unknown) => Number.isInteger(value) && Number(value) >= 0;

export const validateReceiptShape = (receipt: unknown): string[] => {
  const errors: string[] = [];
  if (!isObject(receipt)) return ["Receipt is not an object"];

  if (receipt.schema !== "resumebuilder.validation.v1") errors.push("schema must be resumebuilder.validation.v1");
  if (receipt.app !== "resumebuilderapp") errors.push("app must be resumebuilderapp");
  if (typeof receipt.receiptId !== "string" || !/^rbv-[a-f0-9]{8}$/.test(receipt.receiptId)) {
    errors.push("receiptId must match rbv-xxxxxxxx");
  }
  if (Number.isNaN(Date.parse(String(receipt.createdAt ?? "")))) {
    errors.push("createdAt must be an ISO timestamp");
  }

  const run = receipt.run;
  if (!isObject(run)) errors.push("run is required");
  else {
    if (typeof run.id !== "string" || !/^run-[a-f0-9]{8}$/.test(run.id)) {
      errors.push("run.id must match run-xxxxxxxx");
    }
    if (Number.isNaN(Date.parse(String(run.startedAt ?? "")))) {
      errors.push("run.startedAt must be an ISO timestamp");
    }
    if (
      !Number.isNaN(Date.parse(String(run.startedAt ?? ""))) &&
      !Number.isNaN(Date.parse(String(receipt.createdAt ?? ""))) &&
      Date.parse(String(run.startedAt)) > Date.parse(String(receipt.createdAt))
    ) {
      errors.push("run.startedAt cannot be after createdAt");
    }
  }

  const privacy = receipt.privacy;
  if (!isObject(privacy)) errors.push("privacy is required");
  else {
    if (privacy.localOnly !== true) errors.push("privacy.localOnly must be true");
    if (privacy.noAccount !== true) errors.push("privacy.noAccount must be true");
    if (privacy.containsResumeBody !== false) errors.push("receipt must not contain resume body");
    if (privacy.containsJobDescriptionBody !== false) errors.push("receipt must not contain JD body");
  }

  const tester = receipt.tester;
  if (!isObject(tester) || typeof tester.label !== "string") {
    errors.push("tester.label is required");
  } else if (!hasCountableTesterLabel(tester.label)) {
    errors.push("tester.label must be non-anonymous");
  }

  const attestations = receipt.attestations;
  if (!isObject(attestations)) {
    errors.push("attestations are required");
  } else if (typeof attestations.noOperatorAssistance !== "boolean") {
    errors.push("attestations.noOperatorAssistance must be boolean");
  }

  const target = receipt.target;
  if (!isObject(target)) {
    errors.push("target is required");
  } else {
    if (typeof target.title !== "string" || !target.title.trim()) {
      errors.push("target.title is required");
    }
    if (typeof target.company !== "string" || !target.company.trim()) {
      errors.push("target.company is required");
    }
    if (target.source !== "parsed" && target.source !== "unknown") {
      errors.push("target.source must be parsed or unknown");
    }
  }

  const completion = receipt.completion;
  if (!isObject(completion)) errors.push("completion is required");
  else {
    if (typeof completion.coreFlowComplete !== "boolean") {
      errors.push("completion.coreFlowComplete must be boolean");
    }
    if (typeof completion.interviewOutcomeRecorded !== "boolean") {
      errors.push("completion.interviewOutcomeRecorded must be boolean");
    }
    if (!Number.isInteger(completion.requiredPassed)) {
      errors.push("completion.requiredPassed must be integer");
    }
    if (!Number.isInteger(completion.requiredTotal)) {
      errors.push("completion.requiredTotal must be integer");
    }
    if (
      Number.isInteger(completion.requiredPassed) &&
      Number.isInteger(completion.requiredTotal) &&
      completion.coreFlowComplete !== (completion.requiredPassed === completion.requiredTotal)
    ) {
      errors.push("completion.coreFlowComplete must match requiredPassed/requiredTotal");
    }
    if (
      completion.coreFlowComplete === true &&
      (!isObject(attestations) || attestations.noOperatorAssistance !== true)
    ) {
      errors.push("coreFlowComplete requires no operator assistance attestation");
    }
  }

  let passedCriteria = 0;
  const criteria = receipt.criteria;
  if (!Array.isArray(criteria) || criteria.length === 0) {
    errors.push("criteria must be a non-empty array");
  } else {
    const criterionIds = new Set<string>();
    for (const criterion of criteria) {
      if (!isObject(criterion)) {
        errors.push("criteria entries must be objects");
        continue;
      }
      const id = typeof criterion.id === "string" ? criterion.id : "unknown";
      if (typeof criterion.id !== "string" || !criterion.id.trim()) {
        errors.push("criteria.id is required");
      } else {
        if (criterionIds.has(criterion.id)) errors.push(`duplicate criteria id: ${criterion.id}`);
        criterionIds.add(criterion.id);
      }
      if (typeof criterion.label !== "string" || !criterion.label.trim()) {
        errors.push(`criteria.${id}.label is required`);
      }
      if (typeof criterion.pass !== "boolean") {
        errors.push(`criteria.${id}.pass must be boolean`);
      } else if (criterion.pass) {
        passedCriteria += 1;
      }
      if (typeof criterion.evidence !== "string" || !criterion.evidence.trim()) {
        errors.push(`criteria.${id}.evidence is required`);
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

    const failedCriteria = criteria.filter((criterion) => !isObject(criterion) || criterion.pass !== true).length;
    if (isObject(completion)) {
      if (Number.isInteger(completion.requiredPassed) && completion.requiredPassed !== passedCriteria) {
        errors.push("completion.requiredPassed must match passed criteria count");
      }
      if (Number.isInteger(completion.requiredTotal) && completion.requiredTotal !== criteria.length) {
        errors.push("completion.requiredTotal must match criteria count");
      }
      if (
        typeof completion.coreFlowComplete === "boolean" &&
        completion.coreFlowComplete !== (failedCriteria === 0)
      ) {
        errors.push("completion.coreFlowComplete must match criteria pass state");
      }
    }
    if (isObject(completion) && completion.coreFlowComplete === true && failedCriteria > 0) {
      errors.push("coreFlowComplete cannot be true while criteria fail");
    }
  }

  const metrics = receipt.metrics;
  if (!isObject(metrics)) {
    errors.push("metrics are required");
  } else {
    for (const field of ["baseScore", "tailoredScore", "scoreDelta"]) {
      if (!finiteNumber(metrics[field])) errors.push(`metrics.${field} must be a finite number`);
    }
    for (const field of ["keywordCount", "matchedKeywordCount", "patchCount", "savedApplicationForks"]) {
      if (!nonNegativeInteger(metrics[field])) errors.push(`metrics.${field} must be a non-negative integer`);
    }
    if (
      finiteNumber(metrics.baseScore) &&
      finiteNumber(metrics.tailoredScore) &&
      finiteNumber(metrics.scoreDelta) &&
      Number(metrics.tailoredScore) - Number(metrics.baseScore) !== Number(metrics.scoreDelta)
    ) {
      errors.push("metrics.scoreDelta must equal tailoredScore minus baseScore");
    }
    if (
      nonNegativeInteger(metrics.keywordCount) &&
      nonNegativeInteger(metrics.matchedKeywordCount) &&
      Number(metrics.matchedKeywordCount) > Number(metrics.keywordCount)
    ) {
      errors.push("metrics.matchedKeywordCount cannot exceed keywordCount");
    }
  }

  const exports = receipt.exports;
  if (!isObject(exports)) {
    errors.push("exports are required");
  } else {
    if (
      exports.jsonAt !== undefined &&
      (typeof exports.jsonAt !== "string" || Number.isNaN(Date.parse(exports.jsonAt)))
    ) {
      errors.push("exports.jsonAt must be an ISO timestamp");
    }
    if (
      exports.pdfAt !== undefined &&
      (typeof exports.pdfAt !== "string" || Number.isNaN(Date.parse(exports.pdfAt)))
    ) {
      errors.push("exports.pdfAt must be an ISO timestamp");
    }
    if (isObject(completion) && completion.coreFlowComplete === true) {
      if (Number.isNaN(Date.parse(String(exports.jsonAt ?? "")))) {
        errors.push("complete receipts require exports.jsonAt");
      }
      if (Number.isNaN(Date.parse(String(exports.pdfAt ?? "")))) {
        errors.push("complete receipts require exports.pdfAt");
      }
    }
  }

  const outcome = receipt.outcome;
  if (!isObject(outcome) || typeof outcome.status !== "string") {
    errors.push("outcome.status is required");
  } else {
    if (!validationOutcomeStatuses.has(outcome.status as ValidationOutcome)) {
      errors.push("outcome.status must be a known validation outcome");
    }
    if (typeof outcome.notes !== "string") {
      errors.push("outcome.notes must be a string");
    }
    if (
      isObject(completion) &&
      typeof completion.interviewOutcomeRecorded === "boolean" &&
      validationOutcomeStatuses.has(outcome.status as ValidationOutcome) &&
      completion.interviewOutcomeRecorded !== isInterviewOutcome(outcome.status as ValidationOutcome)
    ) {
      errors.push("completion.interviewOutcomeRecorded must match outcome.status");
    }
    if (
      isInterviewOutcome(outcome.status as ValidationOutcome) &&
      (typeof outcome.notes !== "string" || !outcome.notes.trim())
    ) {
      errors.push("interview or offer outcomes require outcome.notes");
    }
  }

  const fingerprints = receipt.fingerprints;
  if (!isObject(fingerprints)) errors.push("fingerprints are required");
  else {
    if (typeof fingerprints.resume !== "string") errors.push("fingerprints.resume is required");
    if (typeof fingerprints.jobDescription !== "string") {
      errors.push("fingerprints.jobDescription is required");
    }
  }

  const patchTargets = receipt.patchTargets;
  if (!Array.isArray(patchTargets)) {
    errors.push("patchTargets must be an array");
  } else {
    if (patchTargets.some((target) => typeof target !== "string" || !target.trim())) {
      errors.push("patchTargets entries must be non-empty strings");
    }
    if (isObject(completion) && completion.coreFlowComplete === true && patchTargets.length === 0) {
      errors.push("complete receipts require at least one patch target");
    }
    if (isObject(metrics) && Number.isInteger(metrics.patchCount) && metrics.patchCount !== patchTargets.length) {
      errors.push("metrics.patchCount must match patchTargets count");
    }
  }

  const integrity = receipt.integrity;
  if (!isObject(integrity)) errors.push("integrity is required");
  else {
    if (integrity.algorithm !== "fnv1a-stable-v1") {
      errors.push("integrity.algorithm must be fnv1a-stable-v1");
    }
    if (typeof integrity.digest !== "string" || !/^[a-f0-9]{8}$/.test(integrity.digest)) {
      errors.push("integrity.digest must be 8 lowercase hex chars");
    } else if (integrity.digest !== checksum(stableStringify(integritySourceFor(receipt)))) {
      errors.push("integrity.digest mismatch");
    }
  }

  return errors;
};

const bestWindowFor = (receipts: ReceiptAuditRecord[], windowDays: number) => {
  const windowMs = windowDays * 24 * 60 * 60 * 1000;
  const sorted = receipts
    .map((receipt) => ({ ...receipt, timestamp: Date.parse(receipt.createdAt) }))
    .filter((receipt) => Number.isFinite(receipt.timestamp))
    .sort((left, right) => left.timestamp - right.timestamp);

  let best = { count: 0, start: "", end: "", receiptIds: [] as string[] };
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

const isReviewCandidate = (record: ReceiptAuditRecord) =>
  record.errors.length === 0 &&
  record.coreFlowComplete &&
  record.noOperatorAssistance &&
  hasCountableTesterLabel(record.tester);

export const auditReceiptCohort = (
  inputs: ReceiptAuditInput[],
  options: {
    requireCompletions?: number;
    requireInterviews?: number;
    windowDays?: number;
    generatedAt?: string;
  } = {},
): ReceiptCohortAudit => {
  const records: ReceiptAuditRecord[] = inputs.map(({ fileName, receipt, error }) => {
    const value = isObject(receipt) ? receipt : {};
    const tester = isObject(value.tester) && typeof value.tester.label === "string" ? value.tester.label.trim() : "";
    const outcome = isObject(value.outcome) && typeof value.outcome.status === "string" ? value.outcome.status : "missing";
    const outcomeNotes = isObject(value.outcome) && typeof value.outcome.notes === "string" ? value.outcome.notes : "";

    return {
      fileName,
      receiptId: typeof value.receiptId === "string" ? value.receiptId : fileName,
      tester: tester || "missing",
      createdAt: typeof value.createdAt === "string" ? value.createdAt : "",
      coreFlowComplete: isObject(value.completion) && value.completion.coreFlowComplete === true,
      noOperatorAssistance: isObject(value.attestations) && value.attestations.noOperatorAssistance === true,
      outcome,
      hasOutcomeNotes: Boolean(outcomeNotes.trim()),
      countableCompletion: false,
      countableInterview: false,
      errors: error ? [`Invalid JSON: ${error}`] : validateReceiptShape(receipt),
    };
  });

  const ids = new Map<string, number>();
  for (const record of records) ids.set(record.receiptId, (ids.get(record.receiptId) ?? 0) + 1);
  for (const record of records) {
    if ((ids.get(record.receiptId) ?? 0) > 1) record.errors.push("duplicate receiptId");
  }

  for (const record of records) {
    record.countableCompletion = isReviewCandidate(record);
    record.countableInterview =
      record.countableCompletion &&
      (record.outcome === "interview" || record.outcome === "offer") &&
      record.hasOutcomeNotes;
  }

  const requiredCompletions = options.requireCompletions ?? 5;
  const requiredInterviews = options.requireInterviews ?? 10;
  const windowDays = Math.max(1, options.windowDays ?? 7);
  const invalidReceipts = records.filter((record) => record.errors.length > 0).length;
  const completionUsers = new Set(
    records.filter((record) => record.countableCompletion).map((record) => record.tester.toLowerCase()),
  );
  const interviewReceipts = records.filter((record) => record.countableInterview);
  const bestInterviewWindow = bestWindowFor(interviewReceipts, windowDays);
  const completionCandidates = records.filter(isReviewCandidate);
  const interviewCandidates = completionCandidates.filter((record) => record.countableInterview);
  const gates = {
    fiveUserCompletion: completionUsers.size >= requiredCompletions,
    interviewProduction: bestInterviewWindow.count >= requiredInterviews,
    noInvalidReceipts: invalidReceipts === 0,
  };

  return {
    schema: "resumebuilder.validation-audit.v1",
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    requirements: {
      uniqueCompletionUsers: requiredCompletions,
      interviewProducingReceipts: requiredInterviews,
      interviewWindowDays: windowDays,
    },
    totals: {
      files: inputs.length,
      validReceipts: inputs.length - invalidReceipts,
      invalidReceipts,
      completeReceipts: records.filter((record) => record.countableCompletion).length,
      uniqueCompletionUsers: completionUsers.size,
      interviewProducingReceipts: interviewReceipts.length,
      bestInterviewWindowCount: bestInterviewWindow.count,
    },
    bestInterviewWindow,
    ownerReview: {
      completionReceiptIds: completionCandidates.map((record) => record.receiptId),
      interviewReceiptIds: interviewCandidates.map((record) => record.receiptId),
      receipts: completionCandidates.map((record) => ({
        receiptId: record.receiptId,
        tester: record.tester,
        outcome: record.outcome,
        hasOutcomeNotes: record.hasOutcomeNotes,
        createdAt: record.createdAt,
        fileName: record.fileName,
      })),
    },
    gates: {
      ...gates,
      all: gates.fiveUserCompletion && gates.interviewProduction && gates.noInvalidReceipts,
    },
    receipts: records,
  };
};

export const buildAcceptanceManifest = ({
  owner,
  receiptIds,
  acceptedAt = new Date().toISOString(),
  notes = "Accepted by the owner as real-user validation evidence.",
}: {
  owner: string;
  receiptIds: string[];
  acceptedAt?: string;
  notes?: string;
}): AcceptanceManifest => ({
  schema: "resumebuilder.accepted-receipts.v1",
  project: "resumebuilder-app",
  acceptedBy: owner.trim(),
  acceptedAt,
  receiptIds,
  notes,
});
