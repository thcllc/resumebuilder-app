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
