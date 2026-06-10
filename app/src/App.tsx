import {
  BookOpen,
  Bot,
  Briefcase,
  Check,
  ChevronRight,
  Code2,
  Download,
  FileDown,
  FileJson,
  FileText,
  GitBranch,
  Home,
  LayoutTemplate,
  Mail,
  MessageSquare,
  Mic,
  Plus,
  Printer,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  UserRound,
} from "lucide-react";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  ResumeData,
  WorkItem,
  parseResume,
  sampleResume,
  scoreResume,
  toJsonResume,
} from "./lib/resume";
import { analyzeTailoring, type TailoringAnalysis } from "./lib/tailoring";
import { createResumePdfBlob } from "./lib/pdf";
import {
  buildValidationChecklist,
  buildValidationReceipt,
  createValidationState,
  isInterviewOutcome,
  validationOutcomes,
  type ValidationOutcome,
  type ValidationState,
} from "./lib/validation";

type Template =
  | "kraft"
  | "folio"
  | "monolith"
  | "letter"
  | "masthead"
  | "readme"
  | "academic"
  | "creative";

type Page =
  | "home"
  | "editor"
  | "tailor"
  | "diff"
  | "templates"
  | "versions"
  | "letter"
  | "outreach"
  | "social"
  | "interview"
  | "validate"
  | "selfhost";

type Tone = "warm" | "direct" | "formal" | "punchy";
type OutreachChannel = "linkedin" | "email" | "referral" | "recruiter";
type SocialTab = "linkedin" | "github" | "portfolio" | "cleanup";
type InterviewTab = "technical" | "craft" | "behavioral" | "asks";
type ApplicationStatus = "draft" | "applied" | "interview" | "offer" | "rejected";
type ApplicationVersion = {
  id: string;
  name: string;
  status: ApplicationStatus;
  updatedAt: string;
  jobTitle: string;
  company: string;
  jd: string;
  matchScore: number;
  resume: ResumeData;
  template: Template;
};
type OutreachDraft = { tag: string; title?: string; body: string };
type InterviewQuestion = { q: string; why: string; hook: string; likelihood: string };
type SocialCheck = { label: string; state: "done" | "fix" | "watch"; note: string };
type SocialPolish = { label: string; before: string; after: string };
type SocialProfileAnalysis = {
  score: number;
  headline: string;
  about: string;
  checks: SocialCheck[];
  polish: SocialPolish[];
};
type CampaignAction = {
  title: string;
  body: string;
  copyLabel: string;
  copyText: string;
};
type PostAuditRow = {
  age: string;
  source: string;
  issue: string;
  action: "Archive" | "Rewrite" | "Keep" | "Refresh";
  reason: string;
};

const STORAGE_KEY = "resume-builder-workspace-v2";
const VERSIONS_STORAGE_KEY = "resume-builder-versions-v1";
const VALIDATION_STORAGE_KEY = "resume-builder-validation-v1";
const applicationStatuses: ApplicationStatus[] = ["draft", "applied", "interview", "offer", "rejected"];

const pages: Array<{ id: Page; label: string; icon: typeof Home }> = [
  { id: "home", label: "Home", icon: Home },
  { id: "editor", label: "Editor", icon: FileText },
  { id: "tailor", label: "Tailor", icon: Sparkles },
  { id: "diff", label: "AI diff", icon: GitBranch },
  { id: "templates", label: "Templates", icon: LayoutTemplate },
  { id: "versions", label: "Versions", icon: Briefcase },
  { id: "letter", label: "Letter", icon: Mail },
  { id: "outreach", label: "Outreach", icon: MessageSquare },
  { id: "social", label: "Social", icon: UserRound },
  { id: "interview", label: "Interview", icon: Mic },
  { id: "validate", label: "Validate", icon: ShieldCheck },
  { id: "selfhost", label: "Self-host", icon: Code2 },
];

const templates: Array<{
  id: Template;
  name: string;
  style: string;
  ats: number;
  note: string;
}> = [
  { id: "kraft", name: "Kraft", style: "Classic", ats: 98, note: "Single column, centered, hard to break." },
  { id: "folio", name: "Folio", style: "Editorial", ats: 94, note: "Serif header, quiet portfolio tone." },
  { id: "monolith", name: "Monolith", style: "Technical", ats: 91, note: "Monospace accents for builders." },
  { id: "letter", name: "Letter", style: "Classic", ats: 99, note: "Strict, compact, no color." },
  { id: "masthead", name: "Masthead", style: "Editorial", ats: 90, note: "Larger name, restrained body." },
  { id: "readme", name: "README", style: "Technical", ats: 89, note: "Markdown-adjacent without gimmicks." },
  { id: "academic", name: "Academic", style: "Formal", ats: 96, note: "Built for publications and grants." },
  { id: "creative", name: "Creative", style: "Modern", ats: 88, note: "Expressive, still parseable." },
];

const sampleJd = `Senior Product Designer, Platform

We are building the platform team at Vercel. You will own the design of developer-facing platform surfaces: dashboards, deployment flows, and the design system that powers them.

What you will do
- Design end-to-end for dashboards, settings, and deployment flows
- Partner with engineers on API design and developer experience
- Evolve our design system and prototyping culture
- Ship continuously in production`;

const testerInviteText = `I need a no-account validation run for Resume Builder.
Open https://resumebuilder.app/#validate and click Start new run.
Use your own resume or edit the sample into a usable resume.
Paste a real job description for a role you would apply to.
Review the computed diff, accept the tailored draft only if it is truthful, then export JSON and PDF.
Return to Validate, enter a non-anonymous tester label, attest no assistance only if true, choose the outcome, add notes if an interview or offer happened, and export the receipt.
Send back only the exported rbv-*.json file unless you explicitly want to share your resume or job description.`;

const outcomeFollowUpText = `Did the application created with Resume Builder lead to an interview, recruiter screen, offer, rejection, no response, or no submission?
If it led to an interview, recruiter screen, or offer, open https://resumebuilder.app/#validate, use the same resume/JD context if available, set Outcome to Interview or Offer, add a short evidence note, and export a fresh rbv-*.json receipt.
Send back only the fresh receipt unless you explicitly want to share more detail.`;

const ownerCommandText = `node app/cli/resume.mjs validate --input receipts --require-completions 5 --require-interviews 10 --window-days 7
node app/cli/resume.mjs accept --input receipts --out receipts/ACCEPTED_RECEIPTS.json --owner "OWNER NAME" --receipt-ids rbv-1234abcd,rbv-5678efab
node app/cli/resume.mjs release --input receipts --accepted receipts/ACCEPTED_RECEIPTS.json --waiver receipts/VALIDATION_WAIVER.md`;

const validationCampaignActions: CampaignAction[] = [
  {
    title: "Tester invite",
    body: "Send this before a tester starts. It points them to the live app and states the no-assistance, privacy, and receipt-return expectations.",
    copyLabel: "Copy tester invite",
    copyText: testerInviteText,
  },
  {
    title: "Outcome follow-up",
    body: "Send this after the tailored resume is used so interview-producing receipts can be captured without changing the privacy posture.",
    copyLabel: "Copy outcome follow-up",
    copyText: outcomeFollowUpText,
  },
  {
    title: "Owner commands",
    body: "Run these locally after receipts arrive to audit the cohort, write explicit owner acceptance, and prove the release decision.",
    copyLabel: "Copy owner commands",
    copyText: ownerCommandText,
  },
];

const initialPage = (): Page => {
  const hash = window.location.hash.replace("#", "") as Page;
  return pages.some((page) => page.id === hash) ? hash : "home";
};

const loadResume = (): ResumeData => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return sampleResume;

  try {
    return parseResume(JSON.parse(stored));
  } catch {
    return sampleResume;
  }
};

const isApplicationStatus = (value: unknown): value is ApplicationStatus =>
  typeof value === "string" && applicationStatuses.includes(value as ApplicationStatus);

const parseVersions = (input: unknown): ApplicationVersion[] => {
  if (!Array.isArray(input)) return [];

  return input.flatMap((item): ApplicationVersion[] => {
    if (!item || typeof item !== "object") return [];
    const value = item as Record<string, unknown>;

    try {
      return [
        {
          id: typeof value.id === "string" ? value.id : `version-${crypto.randomUUID()}`,
          name: typeof value.name === "string" ? value.name : "Untitled application",
          status: isApplicationStatus(value.status) ? value.status : "draft",
          updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : new Date().toISOString(),
          jobTitle: typeof value.jobTitle === "string" ? value.jobTitle : "Untitled role",
          company: typeof value.company === "string" ? value.company : "Unknown company",
          jd: typeof value.jd === "string" ? value.jd : "",
          matchScore: typeof value.matchScore === "number" ? value.matchScore : 0,
          resume: parseResume(value.resume),
          template: templates.some((template) => template.id === value.template)
            ? (value.template as Template)
            : "kraft",
        },
      ];
    } catch {
      return [];
    }
  });
};

const loadVersions = (): ApplicationVersion[] => {
  const stored = localStorage.getItem(VERSIONS_STORAGE_KEY);
  if (!stored) return [];

  try {
    return parseVersions(JSON.parse(stored));
  } catch {
    return [];
  }
};

const isValidationOutcome = (value: unknown): value is ValidationOutcome =>
  typeof value === "string" && validationOutcomes.some(([outcome]) => outcome === value);

const parseValidationState = (input: unknown): ValidationState => {
  const fallback = createValidationState();
  if (!input || typeof input !== "object") return fallback;

  const value = input as Record<string, unknown>;
  return {
    runId: typeof value.runId === "string" ? value.runId : fallback.runId,
    startedAt: typeof value.startedAt === "string" ? value.startedAt : fallback.startedAt,
    testerLabel: typeof value.testerLabel === "string" ? value.testerLabel : fallback.testerLabel,
    noOperatorAssistance:
      typeof value.noOperatorAssistance === "boolean"
        ? value.noOperatorAssistance
        : fallback.noOperatorAssistance,
    outcome: isValidationOutcome(value.outcome) ? value.outcome : fallback.outcome,
    notes: typeof value.notes === "string" ? value.notes : fallback.notes,
    reviewedDiffAt: typeof value.reviewedDiffAt === "string" ? value.reviewedDiffAt : undefined,
    acceptedDraftAt: typeof value.acceptedDraftAt === "string" ? value.acceptedDraftAt : undefined,
    exportedJsonAt: typeof value.exportedJsonAt === "string" ? value.exportedJsonAt : undefined,
    exportedPdfAt: typeof value.exportedPdfAt === "string" ? value.exportedPdfAt : undefined,
  };
};

const loadValidationState = (): ValidationState => {
  const stored = localStorage.getItem(VALIDATION_STORAGE_KEY);
  if (!stored) return createValidationState();

  try {
    return parseValidationState(JSON.parse(stored));
  } catch {
    return createValidationState();
  }
};

const formatUpdated = (updatedAt: string) => {
  const timestamp = new Date(updatedAt).getTime();
  if (Number.isNaN(timestamp)) return "unknown";
  const diffMs = Date.now() - timestamp;
  const minutes = Math.max(0, Math.floor(diffMs / 60_000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
};

const roleLabel = (analysis: TailoringAnalysis) =>
  analysis.job.title === "Untitled role" ? "the role" : analysis.job.title;

const companyLabel = (analysis: TailoringAnalysis) =>
  analysis.job.company === "Unknown company" ? "your team" : analysis.job.company;

const topKeywordLabels = (analysis: TailoringAnalysis, limit = 3) =>
  analysis.keywords
    .filter((keyword) => keyword.hit || keyword.weight === "high")
    .slice(0, limit)
    .map((keyword) => keyword.label.toLowerCase());

const strongestProof = (resume: ResumeData) =>
  resume.work.flatMap((work) => work.highlights).find((highlight) => /\d|%|\$/.test(highlight)) ??
  resume.work[0]?.highlights[0] ??
  resume.summary;

const buildCoverLetter = (resume: ResumeData, analysis: TailoringAnalysis, tone: Tone) => {
  const company = companyLabel(analysis);
  const role = roleLabel(analysis);
  const keywords = topKeywordLabels(analysis, 3);
  const keywordPhrase = keywords.length ? keywords.join(", ") : "the priorities in the posting";
  const proof = strongestProof(resume);
  const applicant = resume.basics.name || "The applicant";
  const firstName = applicant.split(" ")[0] || "I";

  const paragraphs: Record<Tone, string[]> = {
    warm: [
      `I am interested in ${role} at ${company} because the posting points at work I have already been doing: ${keywordPhrase}.`,
      `${proof}`,
      `I would bring ${resume.basics.label || "a focused background"} and a practical bias toward turning the job description into shipped, measurable work.`,
    ],
    direct: [
      `${company} needs ${keywordPhrase}; my resume already has proof in those areas.`,
      `${proof}`,
      `I would like to discuss where ${role} is expected to create measurable impact first.`,
    ],
    formal: [
      `I am writing to express interest in ${role} at ${company}.`,
      `My background as ${resume.basics.label || "a candidate"} aligns with the role's emphasis on ${keywordPhrase}. ${proof}`,
      "I would welcome the opportunity to discuss how this experience can contribute to the team.",
    ],
    punchy: [
      `${role} at ${company} maps to three things in my resume: ${keywordPhrase}.`,
      `${proof}`,
      "If those are the problems this hire needs to solve, I would value a conversation.",
    ],
  };

  return {
    date: new Date().toLocaleDateString(undefined, {
      month: "long",
      day: "numeric",
      year: "numeric",
    }),
    to: `${company} - Hiring Team`,
    greeting: company === "your team" ? "Hi team," : `Hi ${company} team,`,
    paragraphs: paragraphs[tone],
    signature: applicant,
    meters: {
      personal: analysis.job.source === "parsed" ? 92 : 76,
      mentionsJd: Math.min(96, 60 + analysis.keywords.length * 5),
      avoidsRestating: tone === "formal" ? 76 : 84,
      cliches: tone === "punchy" ? 88 : 82,
    },
    firstName,
  };
};

const buildOutreachDrafts = (
  resume: ResumeData,
  analysis: TailoringAnalysis,
): Record<OutreachChannel, OutreachDraft[]> => {
  const company = companyLabel(analysis);
  const role = roleLabel(analysis);
  const applicant = resume.basics.name || "Candidate";
  const headline = resume.basics.label || "candidate";
  const proof = strongestProof(resume);
  const keywords = topKeywordLabels(analysis, 2).join(" and ") || "the role priorities";
  const portfolio = resume.basics.url ? ` Portfolio: ${resume.basics.url}.` : "";

  return {
    linkedin: [
      {
        tag: "Warm",
        body: `Hi - I saw ${company} is hiring for ${role}. My background as ${headline} lines up with ${keywords}. Open to a short chat?`,
      },
      {
        tag: "Proof",
        body: `Hi - ${applicant} here. Most relevant proof for ${role}: ${proof} Would value a quick conversation if this is still open.`,
      },
      {
        tag: "Portfolio",
        body: `The ${role} posting maps closely to work in my resume around ${keywords}.${portfolio} Happy to send the tailored resume.`,
      },
    ],
    email: [
      {
        tag: "Warm",
        title: `${role} - ${applicant}`,
        body: `Hi,\n\nI am interested in ${role} at ${company}. My resume lines up with ${keywords}, and the clearest proof is: ${proof}\n\n${portfolio ? `${portfolio}\n\n` : ""}Best,\n${applicant}`,
      },
      {
        tag: "Direct",
        title: `${role} application`,
        body: `Applying to ${role}. Relevant background: ${headline}. Most relevant proof: ${proof}\n\nAvailable to talk this week if the role is still open.`,
      },
      {
        tag: "Question",
        title: `Question about ${role}`,
        body: `Hi,\n\nBefore applying more formally, I wanted to ask what ${company} expects ${role} to improve first. The posting emphasizes ${keywords}, which maps to work I have already shipped.\n\n${applicant}`,
      },
    ],
    referral: [
      {
        tag: "Warm",
        body: `I saw ${company} posted ${role}. It looks aligned with ${keywords}. Would a referral or intro feel appropriate?`,
      },
      {
        tag: "Short",
        body: `${company} has ${role} open. My most relevant proof: ${proof} Do you know who owns the search?`,
      },
      {
        tag: "Context",
        body: `No pressure if it is awkward, but the role overlaps with my ${headline} work and I wanted to ask you before applying cold.`,
      },
    ],
    recruiter: [
      {
        tag: "Interested",
        body: `Thanks for reaching out. I would like to discuss ${role}; the strongest overlap in my resume is ${keywords}.`,
      },
      {
        tag: "Questions",
        body: `Open to learning more. Before booking: who owns the role, is it remote-friendly, and what is the compensation band?`,
      },
      {
        tag: "Later",
        body: `Appreciate the note. I am not ready to move forward today, but ${role} is aligned enough that I would like to stay in touch.`,
      },
    ],
  };
};

const buildInterviewQuestions = (
  resume: ResumeData,
  analysis: TailoringAnalysis,
): Record<InterviewTab, InterviewQuestion[]> => {
  const company = companyLabel(analysis);
  const role = roleLabel(analysis);
  const keywords = topKeywordLabels(analysis, 4);
  const primaryKeyword = keywords[0] ?? "the role's core priority";
  const secondaryKeyword = keywords[1] ?? "cross-functional execution";
  const proof = strongestProof(resume);
  const strongestRole = resume.work[0];
  const roleProof = strongestRole
    ? `${strongestRole.position} at ${strongestRole.name}: ${strongestRole.highlights[0]}`
    : resume.summary;

  return {
    technical: [
      {
        q: `How would you approach ${primaryKeyword} for ${company}?`,
        why: `The pasted JD emphasizes ${primaryKeyword}, so interviewers will test practical depth.`,
        hook: proof,
        likelihood: "High",
      },
      {
        q: `What tradeoff would you watch while improving ${secondaryKeyword}?`,
        why: "Senior interviews probe judgment, not only familiarity with keywords.",
        hook: roleProof,
        likelihood: "High",
      },
      {
        q: `Which part of ${role} would you validate first?`,
        why: "The team needs to know how you reduce ambiguity before execution.",
        hook: `Use the resume's measurable proof point: ${proof}`,
        likelihood: "Medium",
      },
    ],
    craft: [
      {
        q: "Walk me through the project that best matches this posting.",
        why: `Pick the story with the clearest connection to ${keywords.slice(0, 2).join(" and ") || role}.`,
        hook: roleProof,
        likelihood: "High",
      },
      {
        q: "Show a decision where you made the work simpler.",
        why: "Craft screens test whether you can explain constraints and taste together.",
        hook: proof,
        likelihood: "Medium",
      },
    ],
    behavioral: [
      {
        q: `Tell me about a disagreement while working on ${primaryKeyword}.`,
        why: "The JD implies collaboration; behavioral rounds will test how you handle friction.",
        hook: "Anchor the answer in a specific decision, not a personality story.",
        likelihood: "High",
      },
      {
        q: "When did evidence change your plan?",
        why: "The strongest candidates can show learning speed and judgment under uncertainty.",
        hook: proof,
        likelihood: "Medium",
      },
    ],
    asks: [
      {
        q: `What would success for ${role} look like in the first six months?`,
        why: "Clarifies whether the role has a concrete mandate.",
        hook: `Listen for measurable ownership around ${primaryKeyword}.`,
        likelihood: "High",
      },
      {
        q: `Where is ${company} strongest and weakest on ${secondaryKeyword} today?`,
        why: "Turns the JD keywords into a sharper operating conversation.",
        hook: "Use the answer to decide which resume proof to lead with in follow-up.",
        likelihood: "High",
      },
    ],
  };
};

const profileUrlFor = (resume: ResumeData, network: string) =>
  resume.basics.profiles.find((profile) => profile.network.toLowerCase() === network.toLowerCase())?.url;

const hasAnyProfile = (resume: ResumeData, network: string) => Boolean(profileUrlFor(resume, network));

const initialsFor = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "R/";

const scoreChecks = (checks: SocialCheck[]) => {
  const points = checks.reduce((sum, check) => {
    if (check.state === "done") return sum + 2;
    if (check.state === "watch") return sum + 1;
    return sum;
  }, 0);
  return Math.round((points / (checks.length * 2)) * 100);
};

const buildSocialProfiles = (
  resume: ResumeData,
  analysis: TailoringAnalysis,
): Record<Exclude<SocialTab, "cleanup">, SocialProfileAnalysis> => {
  const keywords = topKeywordLabels(analysis, 3);
  const keywordPhrase = keywords.length ? keywords.join(", ") : roleLabel(analysis).toLowerCase();
  const headline = resume.basics.label || roleLabel(analysis);
  const proof = strongestProof(resume);
  const skills = resume.skills.flatMap((skill) => skill.keywords).map((keyword) => keyword.toLowerCase());
  const resumeHasKeyword = (keyword: string) =>
    skills.some((skill) => skill.includes(keyword.toLowerCase())) ||
    resume.summary.toLowerCase().includes(keyword.toLowerCase());

  const linkedInChecks: SocialCheck[] = [
    {
      label: "Headline mirrors target role",
      state: resume.basics.label.toLowerCase().includes(roleLabel(analysis).split(" ")[0]?.toLowerCase() ?? "")
        ? "done"
        : "watch",
      note: `Make ${roleLabel(analysis)} visible in the first line.`,
    },
    {
      label: "Keyword alignment",
      state: keywords.every(resumeHasKeyword) ? "done" : "fix",
      note: `Pin ${keywordPhrase} in About and Skills.`,
    },
    {
      label: "Proof above responsibilities",
      state: /\d|%|\$/.test(proof) ? "done" : "watch",
      note: "Lead with measurable outcomes before broad responsibilities.",
    },
    {
      label: "Profile link",
      state: hasAnyProfile(resume, "LinkedIn") ? "done" : "fix",
      note: "Add a LinkedIn profile URL to JSON Resume profiles.",
    },
  ];

  const githubChecks: SocialCheck[] = [
    {
      label: "GitHub profile present",
      state: hasAnyProfile(resume, "GitHub") ? "done" : "fix",
      note: "Add a GitHub URL if public code supports this application.",
    },
    {
      label: "Pinned repos match target",
      state: keywords.some((keyword) => keyword.includes("api") || keyword.includes("developer") || keyword.includes("react"))
        ? "done"
        : "watch",
      note: `Pin projects that prove ${keywordPhrase}.`,
    },
    {
      label: "README narrative",
      state: resume.summary.length > 90 ? "done" : "watch",
      note: "Mirror the resume summary in a short GitHub profile README.",
    },
    {
      label: "Stale experiments",
      state: "watch",
      note: "Archive unfinished repos or add honest status notes before applying.",
    },
  ];

  const portfolioChecks: SocialCheck[] = [
    {
      label: "Portfolio URL",
      state: Boolean(resume.basics.url) ? "done" : "fix",
      note: "Add a portfolio or personal site URL to the resume basics.",
    },
    {
      label: "Hero states fit",
      state: keywords.length >= 2 ? "done" : "watch",
      note: `Lead with ${keywordPhrase}, not a generic bio.`,
    },
    {
      label: "Case-study proof",
      state: /\d|%|\$/.test(proof) ? "done" : "fix",
      note: "Surface the strongest measurable resume proof in the first case study.",
    },
    {
      label: "Contact path",
      state: Boolean(resume.basics.email) ? "done" : "fix",
      note: "Make the same email visible in the portfolio header or footer.",
    },
  ];

  return {
    linkedin: {
      score: scoreChecks(linkedInChecks),
      headline: `${headline} | ${keywords.map((keyword) => keyword.replace(/\b\w/g, (letter) => letter.toUpperCase())).join(", ") || roleLabel(analysis)}`,
      about: `Position the profile around ${companyLabel(analysis)}'s needs: ${keywordPhrase}. Lead with this proof: ${proof}`,
      checks: linkedInChecks,
      polish: [
        {
          label: "Headline",
          before: headline,
          after: `${headline} | ${keywordPhrase}`,
        },
        {
          label: "About opener",
          before: resume.summary || "I am exploring my next role.",
          after: `I help teams with ${keywordPhrase}; the strongest proof is ${proof}`,
        },
        {
          label: "Featured link label",
          before: "Portfolio",
          after: `${roleLabel(analysis)} proof for ${companyLabel(analysis)}`,
        },
      ],
    },
    github: {
      score: scoreChecks(githubChecks),
      headline: `Pinned repos should prove ${keywordPhrase}.`,
      about: `Make GitHub support the resume story for ${roleLabel(analysis)}: readable READMEs, relevant pinned work, and clear status on experiments.`,
      checks: githubChecks,
      polish: [
        {
          label: "Profile README line",
          before: `${headline}.`,
          after: `${headline} working on ${keywordPhrase}.`,
        },
        {
          label: "Pinned repo description",
          before: "Side project.",
          after: `Evidence for ${roleLabel(analysis)}: ${keywordPhrase}, decisions, setup, and tradeoffs.`,
        },
        {
          label: "Archive note",
          before: "old-experiment",
          after: `Archived exploration; not part of the ${companyLabel(analysis)} application story.`,
        },
      ],
    },
    portfolio: {
      score: scoreChecks(portfolioChecks),
      headline: `Portfolio should answer fit for ${roleLabel(analysis)} before the recruiter opens the resume.`,
      about: `The portfolio homepage should make the same promise as the tailored resume: ${keywordPhrase}, backed by measurable proof.`,
      checks: portfolioChecks,
      polish: [
        {
          label: "Homepage H1",
          before: `${headline}.`,
          after: `I work on ${keywordPhrase} for teams like ${companyLabel(analysis)}.`,
        },
        {
          label: "Case study title",
          before: "Selected work",
          after: `${roleLabel(analysis)} proof: ${proof}`,
        },
        {
          label: "CTA",
          before: "Get in touch",
          after: `See ${roleLabel(analysis)} case-study proof`,
        },
      ],
    },
  };
};

const buildPostAuditRows = (
  resume: ResumeData,
  analysis: TailoringAnalysis,
): PostAuditRow[] => {
  const keywords = topKeywordLabels(analysis, 3);
  const keywordPhrase = keywords.join(", ") || roleLabel(analysis).toLowerCase();
  return [
    {
      age: "before applying",
      source: "LinkedIn",
      issue: "Generic career advice or reposts",
      action: "Archive",
      reason: `Remove posts that distract from ${keywordPhrase}.`,
    },
    {
      age: "last 12m",
      source: "GitHub",
      issue: "Unfinished experiments without README context",
      action: "Refresh",
      reason: `Add status notes or setup instructions before ${companyLabel(analysis)} reviews the profile.`,
    },
    {
      age: "recent",
      source: "Portfolio",
      issue: "Strong resume proof not featured",
      action: "Keep",
      reason: `Feature this proof: ${strongestProof(resume)}`,
    },
    {
      age: "any",
      source: "Public posts",
      issue: "Absolute claims about tools or teams",
      action: "Rewrite",
      reason: "Keep the insight, remove language that could read as brittle judgment.",
    },
  ];
};

const downloadBlob = (name: string, blob: Blob) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
};

const downloadFile = (name: string, type: string, body: string) => {
  downloadBlob(name, new Blob([body], { type }));
};

const fileSafeName = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48) || "resume";

const emptyWork = (): WorkItem => ({
  id: `work-${crypto.randomUUID()}`,
  name: "Company",
  position: "Role",
  location: "",
  startDate: "",
  endDate: "",
  highlights: ["Shipped a measurable outcome."],
});

export function App() {
  const [page, setPage] = useState<Page>(initialPage);
  const [resume, setResume] = useState<ResumeData>(loadResume);
  const [versions, setVersions] = useState<ApplicationVersion[]>(loadVersions);
  const [validationState, setValidationState] = useState<ValidationState>(loadValidationState);
  const [activeVersionId, setActiveVersionId] = useState("");
  const [template, setTemplate] = useState<Template>("kraft");
  const [activeWorkId, setActiveWorkId] = useState(resume.work[0]?.id ?? "");
  const [importError, setImportError] = useState("");
  const [jd, setJd] = useState(sampleJd);
  const [tone, setTone] = useState<Tone>("warm");
  const [outreachChannel, setOutreachChannel] = useState<OutreachChannel>("linkedin");
  const [socialTab, setSocialTab] = useState<SocialTab>("linkedin");
  const [interviewTab, setInterviewTab] = useState<InterviewTab>("technical");
  const inputRef = useRef<HTMLInputElement>(null);
  const score = useMemo(() => scoreResume(resume), [resume]);
  const tailoringAnalysis = useMemo(() => analyzeTailoring(resume, jd), [resume, jd]);
  const activeWork = resume.work.find((work) => work.id === activeWorkId) ?? resume.work[0];
  const activeVersion = versions.find((version) => version.id === activeVersionId);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(resume));
  }, [resume]);

  useEffect(() => {
    localStorage.setItem(VERSIONS_STORAGE_KEY, JSON.stringify(versions));
  }, [versions]);

  useEffect(() => {
    localStorage.setItem(VALIDATION_STORAGE_KEY, JSON.stringify(validationState));
  }, [validationState]);

  useEffect(() => {
    if (!activeVersionId) return;
    setVersions((current) =>
      current.map((version) =>
        version.id === activeVersionId
          ? {
              ...version,
              resume,
              template,
              updatedAt: new Date().toISOString(),
            }
          : version,
      ),
    );
  }, [activeVersionId, resume, template]);

  useEffect(() => {
    const syncHash = () => setPage(initialPage());
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  const go = (next: Page) => {
    window.location.hash = next;
    setPage(next);
  };

  const updateValidationState = (patch: Partial<ValidationState>) => {
    setValidationState((current) => ({ ...current, ...patch }));
  };

  const stampValidationEvent = (
    key: "reviewedDiffAt" | "acceptedDraftAt" | "exportedJsonAt" | "exportedPdfAt",
  ) => {
    updateValidationState({ [key]: new Date().toISOString() });
  };

  const resetValidationRun = () => {
    setValidationState(createValidationState());
  };

  const updateBasics = (key: keyof ResumeData["basics"], value: string) => {
    setResume((current) => ({
      ...current,
      basics: { ...current.basics, [key]: value },
    }));
  };

  const updateLocation = (key: "city" | "region", value: string) => {
    setResume((current) => ({
      ...current,
      basics: {
        ...current.basics,
        location: { ...current.basics.location, [key]: value },
      },
    }));
  };

  const updateSummary = (value: string) => {
    setResume((current) => ({ ...current, summary: value }));
  };

  const updateWork = (id: string, patch: Partial<WorkItem>) => {
    setResume((current) => ({
      ...current,
      work: current.work.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }));
  };

  const updateHighlight = (workId: string, index: number, value: string) => {
    setResume((current) => ({
      ...current,
      work: current.work.map((item) =>
        item.id === workId
          ? {
              ...item,
              highlights: item.highlights.map((line, lineIndex) =>
                lineIndex === index ? value : line,
              ),
            }
          : item,
      ),
    }));
  };

  const updateSkills = (value: string) => {
    setResume((current) => ({
      ...current,
      skills: [
        {
          id: current.skills[0]?.id ?? `skill-${crypto.randomUUID()}`,
          name: "Core",
          keywords: value
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
        },
      ],
    }));
  };

  const addWork = () => {
    const next = emptyWork();
    setResume((current) => ({ ...current, work: [...current.work, next] }));
    setActiveWorkId(next.id);
  };

  const removeWork = (id: string) => {
    setResume((current) => {
      const nextWork = current.work.filter((item) => item.id !== id);
      setActiveWorkId(nextWork[0]?.id ?? "");
      return { ...current, work: nextWork };
    });
  };

  const addHighlight = (workId: string) => {
    setResume((current) => ({
      ...current,
      work: current.work.map((item) =>
        item.id === workId ? { ...item, highlights: [...item.highlights, ""] } : item,
      ),
    }));
  };

  const removeHighlight = (workId: string, index: number) => {
    setResume((current) => ({
      ...current,
      work: current.work.map((item) =>
        item.id === workId
          ? { ...item, highlights: item.highlights.filter((_, itemIndex) => itemIndex !== index) }
          : item,
      ),
    }));
  };

  const importJson = async (event: ChangeEvent<HTMLInputElement>) => {
    setImportError("");
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const next = parseResume(JSON.parse(text));
      setResume(next);
      setActiveWorkId(next.work[0]?.id ?? "");
      setActiveVersionId("");
    } catch {
      setImportError("Invalid JSON Resume file.");
    } finally {
      event.target.value = "";
    }
  };

  const exportJson = () => {
    stampValidationEvent("exportedJsonAt");
    downloadFile("resume.json", "application/json", JSON.stringify(toJsonResume(resume), null, 2));
  };

  const exportPdf = () => {
    stampValidationEvent("exportedPdfAt");
    downloadBlob(`${fileSafeName(resume.basics.name)}.pdf`, createResumePdfBlob(resume));
  };

  const reviewTailoredDraft = () => {
    stampValidationEvent("reviewedDiffAt");
    go("diff");
  };

  const acceptTailoredDraft = () => {
    const existingVersion = versions.find(
      (version) =>
        version.jd === jd &&
        version.jobTitle === tailoringAnalysis.job.title &&
        version.company === tailoringAnalysis.job.company,
    );
    const nextVersionId = existingVersion?.id ?? `version-${crypto.randomUUID()}`;
    const versionName =
      tailoringAnalysis.job.source === "parsed"
        ? `${tailoringAnalysis.job.company} - ${tailoringAnalysis.job.title}`
        : `Application fork - ${new Date().toLocaleDateString()}`;
    const nextVersion: ApplicationVersion = {
      id: nextVersionId,
      name: versionName,
      status: existingVersion?.status ?? "draft",
      updatedAt: new Date().toISOString(),
      jobTitle: tailoringAnalysis.job.title,
      company: tailoringAnalysis.job.company,
      jd,
      matchScore: tailoringAnalysis.score.tailored,
      resume: tailoringAnalysis.draftResume,
      template,
    };

    setVersions((current) => [
      nextVersion,
      ...current.filter((version) => version.id !== nextVersionId),
    ]);
    setActiveVersionId(nextVersionId);
    setResume(nextVersion.resume);
    setActiveWorkId(nextVersion.resume.work[0]?.id ?? "");
    stampValidationEvent("acceptedDraftAt");
    go("editor");
  };

  const exportValidationReceipt = () => {
    const receipt = buildValidationReceipt({
      resume,
      jd,
      analysis: tailoringAnalysis,
      versions,
      state: validationState,
    });
    downloadFile(
      `${receipt.receiptId}.json`,
      "application/json",
      JSON.stringify(receipt, null, 2),
    );
  };

  const openVersion = (versionId: string) => {
    const version = versions.find((item) => item.id === versionId);
    if (!version) return;
    setResume(version.resume);
    setJd(version.jd);
    setTemplate(version.template);
    setActiveVersionId(version.id);
    setActiveWorkId(version.resume.work[0]?.id ?? "");
    go("editor");
  };

  const updateVersionStatus = (versionId: string, status: ApplicationStatus) => {
    setVersions((current) =>
      current.map((version) =>
        version.id === versionId
          ? { ...version, status, updatedAt: new Date().toISOString() }
          : version,
      ),
    );
  };

  const deleteVersion = (versionId: string) => {
    setVersions((current) => current.filter((version) => version.id !== versionId));
    if (activeVersionId === versionId) setActiveVersionId("");
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => go("home")} aria-label="Open home">
          <div className="brand-mark">r/</div>
          <div>
            <div className="brand-name">resume/</div>
            <div className="brand-subtitle">local</div>
          </div>
        </button>

        <nav className="nav-strip" aria-label="Primary">
          {pages.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={page === item.id ? "nav-item active" : "nav-item"}
                onClick={() => go(item.id)}
              >
                <Icon size={15} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="topbar-actions">
          <input
            ref={inputRef}
            className="hidden-input"
            type="file"
            accept="application/json,.json"
            onChange={importJson}
          />
          <button className="button quiet" onClick={() => inputRef.current?.click()}>
            <Upload size={16} />
            Import
          </button>
          <button className="button quiet" onClick={exportJson}>
            <FileJson size={16} />
            JSON
          </button>
          <button className="button primary" onClick={exportPdf}>
            <Printer size={16} />
            PDF
          </button>
        </div>
      </header>

      {page === "home" && <HomePage resume={resume} score={score.score} go={go} />}
      {page === "editor" && (
        <EditorPage
          resume={resume}
          score={score}
          template={template}
          setTemplate={setTemplate}
          activeWork={activeWork}
          activeVersion={activeVersion}
          activeWorkId={activeWorkId}
          setActiveWorkId={setActiveWorkId}
          importError={importError}
          updateBasics={updateBasics}
          updateLocation={updateLocation}
          updateSummary={updateSummary}
          updateWork={updateWork}
          updateHighlight={updateHighlight}
          updateSkills={updateSkills}
          addWork={addWork}
          removeWork={removeWork}
          addHighlight={addHighlight}
          removeHighlight={removeHighlight}
          exportJson={exportJson}
          exportPdf={exportPdf}
        />
      )}
      {page === "tailor" && (
        <TailorPage
          jd={jd}
          setJd={setJd}
          template={template}
          analysis={tailoringAnalysis}
          reviewTailoredDraft={reviewTailoredDraft}
        />
      )}
      {page === "diff" && (
        <DiffPage analysis={tailoringAnalysis} acceptTailoredDraft={acceptTailoredDraft} />
      )}
      {page === "templates" && (
        <TemplatesPage resume={resume} template={template} setTemplate={setTemplate} go={go} />
      )}
      {page === "versions" && (
        <VersionsPage
          versions={versions}
          activeVersionId={activeVersionId}
          openVersion={openVersion}
          updateVersionStatus={updateVersionStatus}
          deleteVersion={deleteVersion}
          go={go}
        />
      )}
      {page === "letter" && (
        <CoverLetterPage
          resume={resume}
          analysis={tailoringAnalysis}
          tone={tone}
          setTone={setTone}
        />
      )}
      {page === "outreach" && (
        <OutreachPage
          resume={resume}
          analysis={tailoringAnalysis}
          channel={outreachChannel}
          setChannel={setOutreachChannel}
        />
      )}
      {page === "social" && (
        <SocialPage
          resume={resume}
          analysis={tailoringAnalysis}
          tab={socialTab}
          setTab={setSocialTab}
        />
      )}
      {page === "interview" && (
        <InterviewPage
          resume={resume}
          analysis={tailoringAnalysis}
          tab={interviewTab}
          setTab={setInterviewTab}
        />
      )}
      {page === "validate" && (
        <ValidationPage
          resume={resume}
          jd={jd}
          analysis={tailoringAnalysis}
          versions={versions}
          validationState={validationState}
          updateValidationState={updateValidationState}
          resetValidationRun={resetValidationRun}
          exportValidationReceipt={exportValidationReceipt}
        />
      )}
      {page === "selfhost" && <SelfHostPage />}
    </div>
  );
}

function HomePage({
  resume,
  score,
  go,
}: {
  resume: ResumeData;
  score: number;
  go: (page: Page) => void;
}) {
  return (
    <main className="home-page">
      <section className="home-hero">
        <div className="home-copy">
          <div className="kicker">Open source, local-first, no account</div>
          <h1>Build the resume, then tailor it to the job.</h1>
          <p>
            JSON Resume at the center, ATS-safe templates, diffable AI edits, and
            job-search documents from the same local workspace.
          </p>
          <div className="hero-actions">
            <button className="button primary large" onClick={() => go("editor")}>
              Start writing
              <ChevronRight size={17} />
            </button>
            <button className="button large" onClick={() => go("tailor")}>
              <Sparkles size={17} />
              Tailor to JD
            </button>
          </div>
          <div className="hero-facts">
            <span>No account</span>
            <span>Works offline</span>
            <span>JSON Resume export</span>
          </div>
        </div>

        <div className="hero-stage">
          <div className="hero-score">
            <span>ATS</span>
            {score}
          </div>
          <ResumePaper resume={resume} template="folio" compact />
        </div>
      </section>

      <section className="feature-band">
        {[
          ["Editor", "Split form and live paper preview with local PDF export."],
          ["Tailor", "Paste a job description and review structured suggestions."],
          ["Beyond", "Cover letter, outreach, and interview prep from the same resume."],
          ["Open", "Self-hostable posture with CLI, Docker, and plugin SDK path."],
        ].map(([title, body]) => (
          <article className="feature-tile" key={title}>
            <span>{title}</span>
            <p>{body}</p>
          </article>
        ))}
      </section>
    </main>
  );
}

function EditorPage({
  resume,
  score,
  template,
  setTemplate,
  activeWork,
  activeVersion,
  activeWorkId,
  setActiveWorkId,
  importError,
  updateBasics,
  updateLocation,
  updateSummary,
  updateWork,
  updateHighlight,
  updateSkills,
  addWork,
  removeWork,
  addHighlight,
  removeHighlight,
  exportJson,
  exportPdf,
}: {
  resume: ResumeData;
  score: ReturnType<typeof scoreResume>;
  template: Template;
  setTemplate: (template: Template) => void;
  activeWork?: WorkItem;
  activeVersion?: ApplicationVersion;
  activeWorkId: string;
  setActiveWorkId: (id: string) => void;
  importError: string;
  updateBasics: (key: keyof ResumeData["basics"], value: string) => void;
  updateLocation: (key: "city" | "region", value: string) => void;
  updateSummary: (value: string) => void;
  updateWork: (id: string, patch: Partial<WorkItem>) => void;
  updateHighlight: (workId: string, index: number, value: string) => void;
  updateSkills: (value: string) => void;
  addWork: () => void;
  removeWork: (id: string) => void;
  addHighlight: (workId: string) => void;
  removeHighlight: (workId: string, index: number) => void;
  exportJson: () => void;
  exportPdf: () => void;
}) {
  return (
    <main className="workspace">
      <aside className="sidebar">
        <ScoreWidget score={score} />
        <div className="sidebar-section">
          <div className="eyebrow">Templates</div>
          <div className="template-list" role="tablist" aria-label="Resume templates">
            {templates.map((item) => (
              <button
                key={item.id}
                className={template === item.id ? "template active" : "template"}
                onClick={() => setTemplate(item.id)}
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>

        <div className="sidebar-section">
          <div className="eyebrow">Roles</div>
          <div className="role-list">
            {resume.work.map((work) => (
              <button
                key={work.id}
                className={work.id === activeWorkId ? "role active" : "role"}
                onClick={() => setActiveWorkId(work.id)}
              >
                <span>{work.position || "Role"}</span>
                <small>{work.name || "Company"}</small>
              </button>
            ))}
          </div>
          <button className="button full" onClick={addWork}>
            <Plus size={16} />
            Role
          </button>
        </div>
      </aside>

      <section className="editor-pane">
        <div className="editor-header">
          <div>
            <h1>{resume.basics.name || "Untitled resume"}</h1>
            <p>{resume.basics.label || "Add a headline"}</p>
            {activeVersion && (
              <div className="version-context">
                Editing fork: <strong>{activeVersion.name}</strong>
              </div>
            )}
          </div>
          {importError && <div className="error">{importError}</div>}
        </div>

        <div className="form-section">
          <div className="section-title">Basics</div>
          <div className="grid two">
            <Field label="Name" value={resume.basics.name} onChange={(value) => updateBasics("name", value)} />
            <Field label="Headline" value={resume.basics.label} onChange={(value) => updateBasics("label", value)} />
            <Field label="Email" value={resume.basics.email} onChange={(value) => updateBasics("email", value)} />
            <Field label="Phone" value={resume.basics.phone} onChange={(value) => updateBasics("phone", value)} />
            <Field label="City" value={resume.basics.location.city} onChange={(value) => updateLocation("city", value)} />
            <Field label="Region" value={resume.basics.location.region} onChange={(value) => updateLocation("region", value)} />
          </div>
        </div>

        <div className="form-section">
          <div className="section-title">Summary</div>
          <textarea
            className="textarea"
            value={resume.summary}
            onChange={(event) => updateSummary(event.target.value)}
          />
        </div>

        {activeWork && (
          <div className="form-section">
            <div className="section-title-row">
              <div className="section-title">Experience</div>
              <button
                className="icon-button"
                onClick={() => removeWork(activeWork.id)}
                aria-label="Remove role"
                title="Remove role"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <div className="grid two">
              <Field label="Company" value={activeWork.name} onChange={(value) => updateWork(activeWork.id, { name: value })} />
              <Field label="Role" value={activeWork.position} onChange={(value) => updateWork(activeWork.id, { position: value })} />
              <Field label="Start" value={activeWork.startDate} onChange={(value) => updateWork(activeWork.id, { startDate: value })} />
              <Field label="End" value={activeWork.endDate ?? ""} onChange={(value) => updateWork(activeWork.id, { endDate: value })} />
            </div>
            <div className="bullets">
              {activeWork.highlights.map((highlight, index) => (
                <div className="bullet-editor" key={`${activeWork.id}-${index}`}>
                  <textarea
                    className="textarea compact"
                    value={highlight}
                    onChange={(event) => updateHighlight(activeWork.id, index, event.target.value)}
                  />
                  <button
                    className="icon-button"
                    onClick={() => removeHighlight(activeWork.id, index)}
                    aria-label="Remove bullet"
                    title="Remove bullet"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <button className="button" onClick={() => addHighlight(activeWork.id)}>
                <Plus size={16} />
                Bullet
              </button>
            </div>
          </div>
        )}

        <div className="form-section">
          <div className="section-title">Skills</div>
          <textarea
            className="textarea compact"
            value={resume.skills[0]?.keywords.join(", ") ?? ""}
            onChange={(event) => updateSkills(event.target.value)}
          />
        </div>
      </section>

      <section className="preview-pane">
        <div className="preview-toolbar">
          <span>Letter</span>
          <button className="button quiet" onClick={exportJson}>
            <Download size={16} />
            Export
          </button>
          <button className="button quiet" onClick={exportPdf}>
            <FileDown size={16} />
            PDF
          </button>
        </div>
        <ResumePaper resume={resume} template={template} />
      </section>
    </main>
  );
}

function TailorPage({
  jd,
  setJd,
  template,
  analysis,
  reviewTailoredDraft,
}: {
  jd: string;
  setJd: (value: string) => void;
  template: Template;
  analysis: TailoringAnalysis;
  reviewTailoredDraft: () => void;
}) {
  const hasPatches = analysis.patches.length > 0;

  return (
    <main className="tailor-layout">
      <section className="jd-panel">
        <div className="panel-head">
          <div>
            <div className="eyebrow">Job description</div>
            <h1>{analysis.job.title}</h1>
            <p>
              {analysis.job.source === "parsed"
                ? `${analysis.job.company} - pasted locally`
                : "Paste a job description to analyze locally"}
            </p>
          </div>
          <button className="button primary" onClick={reviewTailoredDraft}>
            <Sparkles size={16} />
            Review diff
          </button>
        </div>
        <textarea
          aria-label="Job description"
          className="jd-textarea"
          value={jd}
          onChange={(event) => setJd(event.target.value)}
        />
      </section>

      <aside className="analysis-panel">
        <MetricCard
          label="Match score"
          value={String(analysis.score.tailored)}
          note={
            analysis.score.delta > 0
              ? `+${analysis.score.delta} vs base`
              : `${analysis.score.base} base score`
          }
        />
        <div className="keyword-list">
          <div className="eyebrow">Keywords</div>
          {analysis.keywords.length ? (
            analysis.keywords.map((keyword) => (
              <div className="keyword-row" key={keyword.label}>
                <span className={keyword.hit ? "keyword-dot hit" : "keyword-dot"}>
                  {keyword.hit ? <Check size={11} /> : null}
                </span>
                <span>{keyword.label}</span>
                <small>{keyword.weight}</small>
              </div>
            ))
          ) : (
            <p className="empty-state">Paste a detailed JD to compute keyword gaps.</p>
          )}
        </div>
        <div className="suggestion-list">
          <div className="eyebrow">Suggested edits</div>
          {hasPatches ? (
            analysis.patches.map((row) => (
              <button className="suggestion-card" key={row.target} onClick={reviewTailoredDraft}>
                <strong>{row.target}</strong>
                <span>{row.reason}</span>
              </button>
            ))
          ) : (
            <p className="empty-state">
              No safe resume edits yet. Add more JD detail or resume proof before accepting changes.
            </p>
          )}
        </div>
      </aside>

      <section className="tailored-preview">
        <div className="preview-toolbar">
          <span>{hasPatches ? "Tailored draft" : "Current resume preview"}</span>
        </div>
        <ResumePaper resume={analysis.draftResume} template={template} />
      </section>
    </main>
  );
}

function DiffPage({
  analysis,
  acceptTailoredDraft,
}: {
  analysis: TailoringAnalysis;
  acceptTailoredDraft: () => void;
}) {
  const hasPatches = analysis.patches.length > 0;

  return (
    <main className="content-page">
      <PageHeader
        kicker="AI diff"
        title="Every change shows its receipt."
        body="Suggestions are patch-shaped: target, rationale, before, after."
        action={
          <button className="button primary" onClick={acceptTailoredDraft} disabled={!hasPatches}>
            <Check size={16} />
            Accept all
          </button>
        }
      />
      <div className="diff-grid">
        <section className="diff-list">
          {hasPatches ? (
            analysis.patches.map((row) => (
              <article className="diff-card" key={row.target}>
                <header>
                  <span>{row.target}</span>
                  <p>{row.reason}</p>
                </header>
                <div className="diff-columns">
                  <div>
                    <div className="diff-label minus">Before</div>
                    <p>{row.before}</p>
                  </div>
                  <div>
                    <div className="diff-label plus">After</div>
                    <p>{row.after}</p>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <article className="diff-card">
              <header>
                <span>No safe patches</span>
                <p>
                  The current JD did not produce supported resume edits. Add more JD detail or add
                  truthful resume proof before accepting a tailored draft.
                </p>
              </header>
            </article>
          )}
        </section>
        <aside className="diff-paper">
          <ResumePaper resume={analysis.draftResume} template="kraft" compact />
        </aside>
      </div>
    </main>
  );
}

function TemplatesPage({
  resume,
  template,
  setTemplate,
  go,
}: {
  resume: ResumeData;
  template: Template;
  setTemplate: (template: Template) => void;
  go: (page: Page) => void;
}) {
  return (
    <main className="content-page">
      <PageHeader
        kicker="Templates"
        title="Eight ATS-safe templates."
        body="All free, all switchable, all rendered from the same JSON Resume data."
      />
      <section className="template-gallery">
        {templates.map((item) => (
          <article
            className={template === item.id ? "template-card active" : "template-card"}
            key={item.id}
          >
            <button
              className="template-preview"
              onClick={() => {
                setTemplate(item.id);
                go("editor");
              }}
            >
              <MiniPaper resume={resume} template={item.id} />
            </button>
            <div className="template-meta">
              <div>
                <h2>{item.name}</h2>
                <p>{item.style}</p>
              </div>
              <span>ATS {item.ats}</span>
            </div>
            <p>{item.note}</p>
          </article>
        ))}
      </section>
    </main>
  );
}

function VersionsPage({
  versions,
  activeVersionId,
  openVersion,
  updateVersionStatus,
  deleteVersion,
  go,
}: {
  versions: ApplicationVersion[];
  activeVersionId: string;
  openVersion: (versionId: string) => void;
  updateVersionStatus: (versionId: string, status: ApplicationStatus) => void;
  deleteVersion: (versionId: string) => void;
  go: (page: Page) => void;
}) {
  return (
    <main className="content-page">
      <PageHeader
        kicker="Versions"
        title="One resume. Many forks."
        body="Each accepted tailored draft is saved locally as an application-specific resume fork."
        action={
          <button className="button primary" onClick={() => go("tailor")}>
            <Sparkles size={16} />
            Create from JD
          </button>
        }
      />
      {versions.length ? (
        <section className="version-table">
          <div className="version-head">
            <span>Resume</span>
            <span>Status</span>
            <span>Updated</span>
            <span>Job</span>
            <span>Match</span>
            <span>Actions</span>
          </div>
          {versions.map((version) => (
            <div
              className={version.id === activeVersionId ? "version-row active" : "version-row"}
              key={version.id}
            >
              <strong>{version.name}</strong>
              <label className="status-select">
                <span className={`status ${version.status}`}>{version.status}</span>
                <select
                  aria-label={`Status for ${version.name}`}
                  value={version.status}
                  onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                    updateVersionStatus(version.id, event.target.value as ApplicationStatus)
                  }
                >
                  {applicationStatuses.map((status) => (
                    <option value={status} key={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
              <span>{formatUpdated(version.updatedAt)}</span>
              <span>{version.company === "Unknown company" ? version.jobTitle : version.company}</span>
              <span className="score-mini">{version.matchScore}</span>
              <div className="version-actions">
                <button className="button quiet" onClick={() => openVersion(version.id)}>
                  Open
                </button>
                <button className="button quiet" onClick={() => deleteVersion(version.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </section>
      ) : (
        <section className="empty-version-state">
          <h2>No application forks yet.</h2>
          <p>
            Paste a job description, review the computed diff, and accept the tailored draft to save
            the first local version.
          </p>
          <button className="button primary" onClick={() => go("tailor")}>
            Tailor to a JD
          </button>
        </section>
      )}
    </main>
  );
}

function CoverLetterPage({
  resume,
  analysis,
  tone,
  setTone,
}: {
  resume: ResumeData;
  analysis: TailoringAnalysis;
  tone: Tone;
  setTone: (tone: Tone) => void;
}) {
  const letter = buildCoverLetter(resume, analysis, tone);

  return (
    <main className="document-layout">
      <aside className="document-controls">
        <div className="panel-head compact">
          <div>
            <div className="eyebrow">Cover letter</div>
            <h1>{companyLabel(analysis)}</h1>
            <p>Generated locally from the current resume and pasted JD.</p>
          </div>
        </div>
        <Segmented<Tone>
          label="Tone"
          value={tone}
          options={[
            ["warm", "Warm"],
            ["direct", "Direct"],
            ["formal", "Formal"],
            ["punchy", "Punchy"],
          ]}
          onChange={setTone}
        />
        <SignalMeter label="Personal" value={letter.meters.personal} />
        <SignalMeter label="Mentions JD" value={letter.meters.mentionsJd} />
        <SignalMeter label="Avoids restating resume" value={letter.meters.avoidsRestating} />
        <SignalMeter label="Cliches" value={letter.meters.cliches} />
      </aside>
      <section className="letter-paper">
        <div className="letter-date">{letter.date}</div>
        <div className="letter-to">
          <strong>{letter.to}</strong>
          <span>{roleLabel(analysis)}</span>
        </div>
        <p>{letter.greeting}</p>
        {letter.paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
        <p>Warmly,</p>
        <div className="signature">{letter.signature}</div>
      </section>
    </main>
  );
}

function OutreachPage({
  resume,
  analysis,
  channel,
  setChannel,
}: {
  resume: ResumeData;
  analysis: TailoringAnalysis;
  channel: OutreachChannel;
  setChannel: (channel: OutreachChannel) => void;
}) {
  const drafts = buildOutreachDrafts(resume, analysis);
  const copyDraft = async (body: string) => {
    await navigator.clipboard?.writeText(body);
  };

  return (
    <main className="content-page">
      <PageHeader
        kicker="Outreach"
        title="Three drafts to pick from."
        body="Short, channel-aware messages generated locally from the resume and job context."
      />
      <Segmented<OutreachChannel>
        label="Channel"
        value={channel}
        options={[
          ["linkedin", "LinkedIn"],
          ["email", "Email"],
          ["referral", "Referral"],
          ["recruiter", "Recruiter"],
        ]}
        onChange={setChannel}
      />
      <section className="draft-grid">
        {drafts[channel].map((draft) => (
          <article className="draft-card" key={draft.tag}>
            <span>{draft.tag}</span>
            {draft.title && <strong>{draft.title}</strong>}
            <p>{draft.body}</p>
            <button className="button" onClick={() => void copyDraft(draft.body)}>
              Copy
            </button>
          </article>
        ))}
      </section>
    </main>
  );
}

function SocialPage({
  resume,
  analysis,
  tab,
  setTab,
}: {
  resume: ResumeData;
  analysis: TailoringAnalysis;
  tab: SocialTab;
  setTab: (tab: SocialTab) => void;
}) {
  const profiles = buildSocialProfiles(resume, analysis);
  const postAuditRows = buildPostAuditRows(resume, analysis);
  const profile = tab === "cleanup" ? null : profiles[tab];
  const initials = initialsFor(resume.basics.name);

  return (
    <main className="content-page">
      <PageHeader
        kicker="Social profile polish"
        title="Make every public profile support the application."
        body="Audit LinkedIn, GitHub, portfolio, and old posts so the recruiter sees one coherent story after opening the resume."
      />
      <Segmented<SocialTab>
        label="Surface"
        value={tab}
        options={[
          ["linkedin", "LinkedIn"],
          ["github", "GitHub"],
          ["portfolio", "Portfolio"],
          ["cleanup", "Old posts"],
        ]}
        onChange={setTab}
      />

      {profile ? (
        <section className="social-layout">
          <aside className="social-score-card">
            <div className="score-label">Profile score</div>
            <strong>{profile.score}</strong>
            <div className="score-bar">
              <span style={{ width: `${profile.score}%` }} />
            </div>
            <p>{profile.about}</p>
          </aside>

          <section className="social-main">
            <article className="profile-preview-card">
              <div className="avatar-block">{initials}</div>
              <div>
                <span>{tab}</span>
                <h2>{profile.headline}</h2>
                <p>{profile.about}</p>
              </div>
            </article>

            <div className="social-columns">
              <section className="social-panel">
                <div className="eyebrow">Best-practice checks</div>
                <div className="social-checklist">
                  {profile.checks.map((check) => (
                    <article className={`social-check ${check.state}`} key={check.label}>
                      <div>
                        <strong>{check.label}</strong>
                        <p>{check.note}</p>
                      </div>
                      <span>{check.state}</span>
                    </article>
                  ))}
                </div>
              </section>

              <section className="social-panel">
                <div className="eyebrow">Polish suggestions</div>
                <div className="polish-list">
                  {profile.polish.map((item) => (
                    <article className="polish-card" key={item.label}>
                      <strong>{item.label}</strong>
                      <div className="polish-copy before">{item.before}</div>
                      <div className="polish-copy after">{item.after}</div>
                    </article>
                  ))}
                </div>
              </section>
            </div>
          </section>
        </section>
      ) : (
        <section className="post-audit">
          <article className="cleanup-summary">
            <div className="score-label">Public history</div>
            <strong>14</strong>
            <p>
              Posts to review before applying: archive weak material, refresh strong proof,
              and rewrite anything that distracts from the role.
            </p>
          </article>
          <div className="post-table">
            <div className="post-head">
              <span>Age</span>
              <span>Surface</span>
              <span>Issue</span>
              <span>Action</span>
              <span>Reason</span>
            </div>
            {postAuditRows.map((row) => (
              <div className="post-row" key={`${row.source}-${row.issue}`}>
                <span>{row.age}</span>
                <strong>{row.source}</strong>
                <span>{row.issue}</span>
                <span className={`post-action ${row.action.toLowerCase()}`}>{row.action}</span>
                <span>{row.reason}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function InterviewPage({
  resume,
  analysis,
  tab,
  setTab,
}: {
  resume: ResumeData;
  analysis: TailoringAnalysis;
  tab: InterviewTab;
  setTab: (tab: InterviewTab) => void;
}) {
  const questions = buildInterviewQuestions(resume, analysis);

  return (
    <main className="content-page">
      <PageHeader
        kicker="Interview prep"
        title="Likely questions from the JD."
        body="Question, why it will come up, and the hook back to your current resume."
      />
      <Segmented<InterviewTab>
        label="Category"
        value={tab}
        options={[
          ["technical", "Technical"],
          ["craft", "Craft"],
          ["behavioral", "Behavioral"],
          ["asks", "Your asks"],
        ]}
        onChange={setTab}
      />
      <section className="question-list">
        {questions[tab].map((item, index) => (
          <article className="question-card" key={item.q}>
            <div className="question-number">Q{index + 1}</div>
            <div>
              <div className="question-topline">
                <h2>{item.q}</h2>
                <span>{item.likelihood}</span>
              </div>
              <p>{item.why}</p>
              <blockquote>{item.hook}</blockquote>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

function ValidationPage({
  resume,
  jd,
  analysis,
  versions,
  validationState,
  updateValidationState,
  resetValidationRun,
  exportValidationReceipt,
}: {
  resume: ResumeData;
  jd: string;
  analysis: TailoringAnalysis;
  versions: ApplicationVersion[];
  validationState: ValidationState;
  updateValidationState: (patch: Partial<ValidationState>) => void;
  resetValidationRun: () => void;
  exportValidationReceipt: () => void;
}) {
  const criteria = buildValidationChecklist({
    resume,
    jd,
    analysis,
    versions,
    state: validationState,
  });
  const passed = criteria.filter((criterion) => criterion.pass).length;
  const coreFlowComplete = passed === criteria.length;
  const receiptExportReady = coreFlowComplete;
  const outcomeRecorded = isInterviewOutcome(validationState.outcome);
  const cohortLine = coreFlowComplete
    ? "This tester can count toward the five-user completion gate after the receipt is exported."
    : "Finish every checklist item before exporting a countable receipt.";
  const role = analysis.job.company === "Unknown company"
    ? analysis.job.title
    : `${analysis.job.company} - ${analysis.job.title}`;
  const copyCampaignText = async (text: string) => {
    await navigator.clipboard?.writeText(text);
  };

  return (
    <main className="content-page">
      <PageHeader
        kicker="Validation"
        title="Export evidence the core loop worked."
        body="No analytics, accounts, or cloud sync. A tester controls the receipt and can hand it to the project owner as proof of the local workflow."
        action={
          <div className="page-actions">
            <button className="button quiet" onClick={resetValidationRun}>
              Start new run
            </button>
            <button
              className="button primary"
              disabled={!receiptExportReady}
              onClick={exportValidationReceipt}
              title={
                receiptExportReady
                  ? "Export a countable validation receipt"
                  : "Finish every required receipt criterion first"
              }
            >
              <Download size={16} />
              Export receipt
            </button>
          </div>
        }
      />

      <section className="validation-grid">
        <article className={`validation-status ${coreFlowComplete ? "pass" : "missing"}`}>
          <div className="score-label">Core flow</div>
          <strong>{coreFlowComplete ? "Complete" : `${passed}/${criteria.length}`}</strong>
          <p>{cohortLine}</p>
        </article>

        <article className={`validation-status ${outcomeRecorded ? "pass" : "watch"}`}>
          <div className="score-label">Interview outcome</div>
          <strong>{outcomeRecorded ? "Recorded" : "Pending"}</strong>
          <p>
            The August gate needs interview-producing resumes. Mark Interview or Offer only after
            a real response.
          </p>
        </article>

        <article className="validation-status">
          <div className="score-label">Target</div>
          <strong>{analysis.score.tailored}</strong>
          <p>
            {role} match score after {analysis.patches.length} patch-shaped edits and{" "}
            {analysis.keywords.length} keyword checks.
          </p>
        </article>
      </section>

      <section className="validation-layout">
        <section className="validation-panel">
          <div className="eyebrow">Required receipt criteria</div>
          <div className="validation-checklist">
            {criteria.map((criterion) => (
              <article
                className={`social-check ${criterion.pass ? "done" : "fix"}`}
                key={criterion.id}
              >
                <div>
                  <strong>{criterion.label}</strong>
                  <p>{criterion.evidence}</p>
                </div>
                <span>{criterion.pass ? "pass" : "missing"}</span>
              </article>
            ))}
          </div>
        </section>

        <aside className="validation-panel">
          <div className="eyebrow">Tester receipt fields</div>
          <div className="validation-form">
            <div className="receipt-note compact">
              <strong>Run {validationState.runId}</strong>
              <p>Started {new Date(validationState.startedAt).toLocaleString()}</p>
            </div>
            <Field
              label="Tester label"
              value={validationState.testerLabel}
              onChange={(testerLabel) => updateValidationState({ testerLabel })}
            />
            <label className="attestation-check">
              <input
                aria-label="No operator assistance"
                type="checkbox"
                checked={validationState.noOperatorAssistance}
                onChange={(event) =>
                  updateValidationState({ noOperatorAssistance: event.target.checked })
                }
              />
              <span>
                I completed this validation run without operator assistance.
              </span>
            </label>
            <label className="field">
              <span>Outcome</span>
              <select
                aria-label="Outcome"
                value={validationState.outcome}
                onChange={(event) =>
                  updateValidationState({ outcome: event.target.value as ValidationOutcome })
                }
              >
                {validationOutcomes.map(([id, label]) => (
                  <option value={id} key={id}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Outcome notes</span>
              <textarea
                className="textarea compact"
                aria-label="Outcome notes"
                value={validationState.notes}
                onChange={(event) => updateValidationState({ notes: event.target.value })}
                placeholder="Example: Applied on June 12; recruiter screen booked June 18."
              />
            </label>
          </div>

          <div className="receipt-note">
            <strong>Receipt privacy</strong>
            <p>
              The exported JSON includes timestamps, scores, fingerprints, patch targets, a run id,
              and an integrity digest. It does not include the full resume body or pasted job
              description body.
            </p>
          </div>
        </aside>
      </section>

      <section className="campaign-actions" aria-label="Validation campaign actions">
        {validationCampaignActions.map((action) => (
          <article className="campaign-action-card" key={action.title}>
            <div>
              <div className="eyebrow">Campaign action</div>
              <h2>{action.title}</h2>
              <p>{action.body}</p>
            </div>
            <button className="button" onClick={() => void copyCampaignText(action.copyText)}>
              {action.copyLabel}
            </button>
          </article>
        ))}
      </section>

      <section className="validation-protocol">
        <article className="code-card wide">
          <span>Validation campaign pack</span>
          <p>
            Recruit at least five real testers who are actively applying to jobs. Store returned{" "}
            <code>rbv-*.json</code> files locally, accept only reviewed receipt ids, then keep
            following up until accepted receipts prove ten interview-producing resumes in a
            seven-day window.
          </p>
          <pre>{`Tester invite:
${testerInviteText}`}</pre>
        </article>
        <article className="code-card wide">
          <span>Owner intake command</span>
          <p>
            Put tester-controlled <code>rbv-*.json</code> files in the repository{" "}
            <code>receipts/</code> folder, then audit the cohort locally.
          </p>
          <pre>{`node app/cli/resume.mjs validate --input receipts --require-completions 5 --require-interviews 10 --window-days 7`}</pre>
          <p>The audit prints owner review candidate receipt ids; review files before accepting.</p>
          <p>Then write the owner acceptance manifest with explicit accepted receipt ids:</p>
          <pre>{`node app/cli/resume.mjs accept --input receipts --out receipts/ACCEPTED_RECEIPTS.json --owner "OWNER NAME" --receipt-ids rbv-1234abcd,rbv-5678efab`}</pre>
          <p>Prove the release decision gate after the manifest exists:</p>
          <pre>{`node app/cli/resume.mjs release --input receipts --accepted receipts/ACCEPTED_RECEIPTS.json --waiver receipts/VALIDATION_WAIVER.md`}</pre>
        </article>
        <article className="code-card">
          <span>Tester handoff</span>
          <p>
            Send testers to <code>https://resumebuilder.app/#validate</code>. They should start a
            new run, complete the resume/JD/diff/export loop, attest no operator assistance, export
            a receipt, and return only the <code>rbv-*.json</code> file.
          </p>
        </article>
        <article className="code-card">
          <span>2026-07-15 gate</span>
          <p>
            Collect five receipts where every required criterion passes. A receipt only counts if
            the tester completed the flow without operator assistance.
          </p>
        </article>
        <article className="code-card">
          <span>2026-08-31 gate</span>
          <p>
            Update receipts after real outcomes. Count only receipts marked Interview or Offer
            toward interview-producing-resume evidence.
          </p>
          <pre>{`Outcome follow-up:
${outcomeFollowUpText}`}</pre>
        </article>
      </section>
    </main>
  );
}

function SelfHostPage() {
  return (
    <main className="content-page">
      <PageHeader
        kicker="Open and portable"
        title="Your resume is a file."
        body="JSON Resume underneath, a static web app on Pages, a Docker image, a local CLI, validation receipt audits, release decision audits, CI, and a typed template plugin contract."
      />
      <section className="dev-grid">
        <article className="code-card wide">
          <span>resume.json</span>
          <pre>{`{
  "$schema": "https://jsonresume.org/schema",
  "basics": {
    "name": "Maya Chen",
    "label": "Senior Product Designer"
  },
  "work": [
    {
      "name": "Figma",
      "position": "Senior Product Designer, Platform",
      "highlights": ["Led Plugin API v3..."]
    }
  ]
}`}</pre>
        </article>
        <DevCard title="Docker" command="docker build -t resumebuilderapp . && docker run --rm -p 3210:80 resumebuilderapp" />
        <DevCard title="CLI" command="node cli/resume.mjs export --input resume.json --out exports --json --pdf" />
        <DevCard title="Validation audit" command="node cli/resume.mjs validate --input ../receipts --require-completions 5 --require-interviews 10 --window-days 7" />
        <DevCard title="Owner acceptance" command="node cli/resume.mjs accept --input ../receipts --out ../receipts/ACCEPTED_RECEIPTS.json --owner 'OWNER NAME' --receipt-ids rbv-1234abcd" />
        <DevCard title="Release audit" command="node cli/resume.mjs release --input ../receipts --accepted ../receipts/ACCEPTED_RECEIPTS.json --waiver ../receipts/VALIDATION_WAIVER.md" />
        <DevCard title="GitHub Action" command="pnpm typecheck && pnpm test:smoke && pnpm build" />
        <DevCard title="Plugin SDK" command="defineTemplate({ id: 'plain', name: 'Plain', description: 'Text', render })" />
      </section>
    </main>
  );
}

function PageHeader({
  kicker,
  title,
  body,
  action,
}: {
  kicker: string;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="page-header">
      <div>
        <div className="kicker">{kicker}</div>
        <h1>{title}</h1>
        <p>{body}</p>
      </div>
      {action}
    </header>
  );
}

function ScoreWidget({ score }: { score: ReturnType<typeof scoreResume> }) {
  return (
    <>
      <div className="score-block">
        <div className="score-label">ATS</div>
        <div className="score-value">{score.score}</div>
        <div className="score-bar">
          <span style={{ width: `${score.score}%` }} />
        </div>
      </div>
      <div className="check-list">
        {score.checks.map((check) => (
          <div className="check-row" key={check.label}>
            <span className={check.pass ? "check pass" : "check"} />
            {check.label}
          </div>
        ))}
      </div>
    </>
  );
}

function MetricCard({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <article className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{note}</p>
    </article>
  );
}

function SignalMeter({ label, value }: { label: string; value: number }) {
  return (
    <div className="signal-meter">
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <div className="meter-track">
        <span style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Array<[T, string]>;
  onChange: (value: T) => void;
}) {
  return (
    <div className="segmented-wrap">
      <div className="eyebrow">{label}</div>
      <div className="segmented">
        {options.map(([id, text]) => (
          <button key={id} className={value === id ? "active" : ""} onClick={() => onChange(id)}>
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}

function DevCard({ title, command }: { title: string; command: string }) {
  return (
    <article className="code-card">
      <span>{title}</span>
      <pre>{command}</pre>
    </article>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function MiniPaper({ resume, template }: { resume: ResumeData; template: Template }) {
  return (
    <div className="mini-paper">
      <ResumePaper resume={resume} template={template} compact />
    </div>
  );
}

function ResumePaper({
  resume,
  template,
  compact,
}: {
  resume: ResumeData;
  template: Template;
  compact?: boolean;
}) {
  const location = [resume.basics.location.city, resume.basics.location.region].filter(Boolean).join(", ");
  const contact = [resume.basics.email, resume.basics.phone, location, resume.basics.url]
    .filter(Boolean)
    .join(" | ");
  const skills = resume.skills.flatMap((skill) => skill.keywords).join(" | ");

  return (
    <article className={`resume-paper ${template} ${compact ? "compact-paper" : ""}`}>
      <header className="paper-header">
        <h2>{resume.basics.name}</h2>
        <div className="paper-title">{resume.basics.label}</div>
        <div className="paper-contact">{contact}</div>
      </header>

      <PaperSection title="Summary">
        <p>{resume.summary}</p>
      </PaperSection>

      <PaperSection title="Experience">
        {resume.work.map((work) => (
          <div className="paper-role" key={work.id}>
            <div className="paper-role-heading">
              <strong>
                {work.position}, {work.name}
              </strong>
              <span>
                {work.startDate}
                {work.endDate ? ` - ${work.endDate}` : ""}
              </span>
            </div>
            {work.location && <div className="paper-muted">{work.location}</div>}
            <ul>
              {work.highlights.filter(Boolean).map((highlight, index) => (
                <li key={index}>{highlight}</li>
              ))}
            </ul>
          </div>
        ))}
      </PaperSection>

      <PaperSection title="Education">
        {resume.education.map((item) => (
          <div className="paper-role-heading" key={item.id}>
            <strong>
              {item.institution} - {item.studyType}, {item.area}
            </strong>
            <span>{item.endDate}</span>
          </div>
        ))}
      </PaperSection>

      <PaperSection title="Skills">
        <p>{skills}</p>
      </PaperSection>
    </article>
  );
}

function PaperSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="paper-section">
      <h3>{title}</h3>
      {children}
    </section>
  );
}
