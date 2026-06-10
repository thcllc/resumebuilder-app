import type { ResumeData } from "./resume";

export type ResumeScoreCheck = {
  label: string;
  pass: boolean;
  detail: string;
  weight: number;
};

export type ResumeScore = {
  score: number;
  checks: ResumeScoreCheck[];
};

const ACTION_VERBS = [
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

const wordCount = (value: string) => value.trim().split(/\s+/).filter(Boolean).length;

const normalized = (value: string) => value.trim().toLowerCase();

const phoneDigits = (value: string) => value.replace(/\D/g, "").length;

const hasValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

const hasActionVerb = (value: string) =>
  ACTION_VERBS.some((verb) => normalized(value).startsWith(`${verb} `));

const uniqueSkills = (resume: ResumeData) =>
  new Set(
    resume.skills
      .flatMap((skill) => skill.keywords)
      .map(normalized)
      .filter(Boolean),
  );

const allHighlights = (resume: ResumeData) => resume.work.flatMap((work) => work.highlights);

export const scoreResume = (resume: ResumeData): ResumeScore => {
  const summaryWords = wordCount(resume.summary);
  const highlights = allHighlights(resume);
  const quantifiedHighlights = highlights.filter((line) => /\d|%|\$/.test(line));
  const actionHighlights = highlights.filter(hasActionVerb);
  const skills = uniqueSkills(resume);
  const completeRoles = resume.work.filter(
    (work) =>
      work.name.trim() &&
      work.position.trim() &&
      work.startDate.trim() &&
      work.highlights.some((line) => line.trim().length >= 35),
  );

  const checks: ResumeScoreCheck[] = [
    {
      label: "Contact",
      pass: hasValidEmail(resume.basics.email) && phoneDigits(resume.basics.phone) >= 7,
      detail: "Valid email and phone number are present.",
      weight: 14,
    },
    {
      label: "Headline",
      pass: wordCount(resume.basics.label) >= 2 && wordCount(resume.basics.label) <= 12,
      detail: "Headline is specific without becoming a paragraph.",
      weight: 8,
    },
    {
      label: "Summary",
      pass: summaryWords >= 18 && summaryWords <= 90,
      detail: "Summary is long enough for context and short enough for scanning.",
      weight: 14,
    },
    {
      label: "Experience",
      pass: resume.work.length >= 2 && completeRoles.length === resume.work.length,
      detail: "Roles include company, title, dates, and at least one substantive bullet.",
      weight: 18,
    },
    {
      label: "Bullets",
      pass: highlights.length >= 4 && actionHighlights.length >= Math.min(4, highlights.length),
      detail: "Experience bullets start with clear action verbs.",
      weight: 14,
    },
    {
      label: "Impact",
      pass: quantifiedHighlights.length >= 2,
      detail: "At least two bullets include measurable impact or scale.",
      weight: 14,
    },
    {
      label: "Skills",
      pass: skills.size >= 5,
      detail: "Searchable skills include at least five unique terms.",
      weight: 10,
    },
    {
      label: "Links",
      pass: Boolean(resume.basics.url?.trim() || resume.basics.profiles.some((profile) => profile.url.trim())),
      detail: "Portfolio, website, or public profile link is present.",
      weight: 8,
    },
  ];

  const totalWeight = checks.reduce((sum, check) => sum + check.weight, 0);
  const passedWeight = checks.reduce((sum, check) => sum + (check.pass ? check.weight : 0), 0);

  return {
    score: Math.round((passedWeight / totalWeight) * 100),
    checks,
  };
};
