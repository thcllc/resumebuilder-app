import type { ResumeData, WorkItem } from "./resume";

export type TailoringKeyword = {
  label: string;
  hit: boolean;
  weight: "high" | "medium" | "low";
};

export type TailoringPatch = {
  target: string;
  reason: string;
  before: string;
  after: string;
};

export type TailoringAnalysis = {
  job: { title: string; company: string; source: "parsed" | "unknown" };
  keywords: TailoringKeyword[];
  score: { base: number; tailored: number; delta: number };
  patches: TailoringPatch[];
  draftResume: ResumeData;
};

const STOPWORDS = new Set([
  "about",
  "across",
  "after",
  "also",
  "and",
  "are",
  "around",
  "because",
  "been",
  "build",
  "building",
  "but",
  "can",
  "candidate",
  "company",
  "continuous",
  "culture",
  "day",
  "each",
  "end",
  "every",
  "for",
  "from",
  "have",
  "hiring",
  "into",
  "its",
  "job",
  "join",
  "looking",
  "make",
  "more",
  "must",
  "our",
  "own",
  "partner",
  "people",
  "product",
  "production",
  "role",
  "senior",
  "ship",
  "shipping",
  "team",
  "that",
  "the",
  "their",
  "them",
  "this",
  "through",
  "will",
  "with",
  "work",
  "working",
  "you",
  "your",
]);

const PHRASE_HINTS = [
  "accessibility",
  "analytics",
  "api design",
  "brand design",
  "customer research",
  "customer success",
  "data analysis",
  "data visualization",
  "design systems",
  "developer experience",
  "deployment flows",
  "growth experiments",
  "information architecture",
  "interaction design",
  "machine learning",
  "market research",
  "mobile design",
  "platform design",
  "product strategy",
  "project management",
  "prototyping",
  "react",
  "research operations",
  "stakeholder management",
  "technical writing",
  "user interviews",
  "user research",
];

const REQUIREMENT_HEADINGS = /requirements|qualifications|what you will do|responsibilities|you will|you have|skills|experience/i;

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9+#.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const singularize = (value: string) =>
  value
    .split(" ")
    .map((token) => (token.length > 4 && token.endsWith("s") ? token.slice(0, -1) : token))
    .join(" ");

const tokensFor = (value: string) =>
  normalize(value)
    .split(" ")
    .filter((token) => token.length > 2 && !STOPWORDS.has(token));

const displayKeyword = (value: string) =>
  value
    .split(" ")
    .map((token) =>
      token.length <= 3 && token === token.toLowerCase()
        ? token.toUpperCase()
        : `${token.slice(0, 1).toUpperCase()}${token.slice(1)}`,
    )
    .join(" ");

const resumeText = (resume: ResumeData) =>
  [
    resume.basics.name,
    resume.basics.label,
    resume.summary,
    ...resume.work.flatMap((work) => [work.name, work.position, ...work.highlights]),
    ...resume.skills.flatMap((skill) => [skill.name, ...skill.keywords]),
  ].join(" ");

const cloneResume = (resume: ResumeData): ResumeData => ({
  ...resume,
  basics: {
    ...resume.basics,
    location: { ...resume.basics.location },
    profiles: resume.basics.profiles.map((profile) => ({ ...profile })),
  },
  work: resume.work.map((work) => ({
    ...work,
    highlights: [...work.highlights],
  })),
  education: resume.education.map((education) => ({ ...education })),
  skills: resume.skills.map((skill) => ({
    ...skill,
    keywords: [...skill.keywords],
  })),
});

const parseJob = (jd: string): TailoringAnalysis["job"] => {
  const lines = jd
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const firstLine = lines[0] ?? "";
  let title = "";
  let company = "";

  const companyTitle = firstLine.match(/^([A-Z][A-Za-z0-9&.' ]{1,48})\s[-–—]\s(.{3,80})$/);
  if (companyTitle) {
    company = companyTitle[1].trim();
    title = companyTitle[2].trim();
  } else if (firstLine.length <= 90 && /designer|engineer|manager|lead|director|developer|analyst|marketer|writer|specialist|architect/i.test(firstLine)) {
    title = firstLine.replace(/\s+(?:at|@)\s+[A-Z].*$/, "").trim();
  }

  const companyPatterns = [
    /\b(?:at|@)\s+([A-Z][A-Za-z0-9&.'-]+(?:\s+[A-Z][A-Za-z0-9&.'-]+){0,3})\b/,
    /\b([A-Z][A-Za-z0-9&.'-]+(?:\s+[A-Z][A-Za-z0-9&.'-]+){0,3})\s+is\s+(?:seeking|looking|hiring|building)\b/,
    /\bjoin\s+([A-Z][A-Za-z0-9&.'-]+(?:\s+[A-Z][A-Za-z0-9&.'-]+){0,3})\b/,
  ];

  for (const pattern of companyPatterns) {
    const match = jd.match(pattern);
    if (match) {
      company = company || match[1].trim();
      break;
    }
  }

  return {
    title: title || "Untitled role",
    company: company || "Unknown company",
    source: title || company ? "parsed" : "unknown",
  };
};

const addCandidate = (
  candidates: Map<string, number>,
  rawLabel: string,
  points: number,
) => {
  const normalized = singularize(normalize(rawLabel));
  const words = normalized.split(" ").filter(Boolean);
  if (!words.length || words.some((word) => STOPWORDS.has(word))) return;
  if (words.length === 1 && words[0].length < 4) return;
  candidates.set(normalized, Math.max(candidates.get(normalized) ?? 0, points));
};

const extractKeywords = (jd: string, resume: ResumeData): TailoringKeyword[] => {
  const normalizedJd = normalize(jd);
  const normalizedResume = normalize(resumeText(resume));
  if (!normalizedJd) return [];

  const candidates = new Map<string, number>();
  const lines = jd
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  PHRASE_HINTS.forEach((phrase) => {
    if (normalizedJd.includes(singularize(normalize(phrase)))) {
      addCandidate(candidates, phrase, 8);
    }
  });

  lines.forEach((line, index) => {
    const lineTokens = tokensFor(line);
    const multiplier = index === 0 || REQUIREMENT_HEADINGS.test(line) ? 2 : 1;

    for (let size = 3; size >= 2; size -= 1) {
      for (let start = 0; start <= lineTokens.length - size; start += 1) {
        addCandidate(candidates, lineTokens.slice(start, start + size).join(" "), size + multiplier);
      }
    }

    lineTokens.forEach((token) => {
      addCandidate(candidates, token, multiplier + (normalizedJd.split(token).length - 1));
    });
  });

  const sorted = [...candidates.entries()]
    .filter(([label]) => label.length > 3)
    .sort((left, right) => {
      const [leftLabel, leftScore] = left;
      const [rightLabel, rightScore] = right;
      if (rightScore !== leftScore) return rightScore - leftScore;
      return rightLabel.length - leftLabel.length;
    });

  const selected: Array<[string, number]> = [];
  sorted.forEach(([label, points]) => {
    const isDuplicate = selected.some(([selectedLabel]) => {
      const labelTokens = label.split(" ");
      const selectedTokens = selectedLabel.split(" ");
      return (
        (labelTokens.length === 1 && selectedTokens.includes(label)) ||
        (selectedTokens.length === 1 && labelTokens.includes(selectedLabel)) ||
        selectedLabel.includes(label) ||
        label.includes(selectedLabel)
      );
    });

    if (!isDuplicate && selected.length < 10) {
      selected.push([label, points]);
    }
  });

  return selected.map(([label, points]) => {
    const normalizedLabel = singularize(normalize(label));
    return {
      label: displayKeyword(label),
      hit: singularize(normalizedResume).includes(normalizedLabel),
      weight: points >= 7 ? "high" : points >= 4 ? "medium" : "low",
    };
  });
};

const keywordScore = (keywords: TailoringKeyword[], text: string) => {
  const normalizedText = singularize(normalize(text));
  const total = keywords.reduce((sum, keyword) => {
    if (keyword.weight === "high") return sum + 3;
    if (keyword.weight === "medium") return sum + 2;
    return sum + 1;
  }, 0);

  if (!total) return 0;

  const matched = keywords.reduce((sum, keyword) => {
    const weight = keyword.weight === "high" ? 3 : keyword.weight === "medium" ? 2 : 1;
    return normalizedText.includes(singularize(normalize(keyword.label))) ? sum + weight : sum;
  }, 0);

  return Math.round((matched / total) * 100);
};

const termHasResumeSupport = (keyword: TailoringKeyword, resumeTokens: Set<string>) =>
  singularize(normalize(keyword.label))
    .split(" ")
    .some((token) => resumeTokens.has(token) || resumeTokens.has(`${token}s`));

const joinTerms = (terms: string[]) => {
  if (terms.length <= 1) return terms[0] ?? "";
  if (terms.length === 2) return `${terms[0]} and ${terms[1]}`;
  return `${terms.slice(0, -1).join(", ")}, and ${terms.at(-1)}`;
};

const chooseWorkItem = (resume: ResumeData, terms: string[]): WorkItem | undefined => {
  const termTokens = new Set(terms.flatMap(tokensFor));
  return resume.work
    .map((work) => {
      const text = normalize([work.position, work.name, ...work.highlights].join(" "));
      const score = [...termTokens].filter((token) => text.includes(token)).length;
      return { work, score };
    })
    .sort((left, right) => right.score - left.score)[0]?.work;
};

const appendFocusClause = (value: string, terms: string[]) => {
  const focus = joinTerms(terms);
  if (!focus || normalize(value).includes(normalize(focus))) return value;
  const trimmed = value.trim().replace(/\.$/, "");
  return `${trimmed}, with emphasis on ${focus}.`;
};

const buildDraft = (
  resume: ResumeData,
  keywords: TailoringKeyword[],
): { draftResume: ResumeData; patches: TailoringPatch[] } => {
  const draftResume = cloneResume(resume);
  const patches: TailoringPatch[] = [];
  const resumeTokens = new Set(tokensFor(resumeText(resume)));
  const missingSupportedTerms = keywords
    .filter((keyword) => !keyword.hit && keyword.weight !== "low" && termHasResumeSupport(keyword, resumeTokens))
    .map((keyword) => keyword.label)
    .slice(0, 3);

  if (!missingSupportedTerms.length) {
    return { draftResume, patches };
  }

  const summaryBefore = draftResume.summary;
  const summaryAfter = appendFocusClause(summaryBefore, missingSupportedTerms.slice(0, 2));
  if (summaryBefore && summaryAfter !== summaryBefore) {
    draftResume.summary = summaryAfter;
    patches.push({
      target: "Summary",
      reason: `Use JD language already supported by the resume: ${joinTerms(missingSupportedTerms.slice(0, 2))}.`,
      before: summaryBefore,
      after: summaryAfter,
    });
  }

  const work = chooseWorkItem(draftResume, missingSupportedTerms);
  const firstHighlight = work?.highlights[0];
  if (work && firstHighlight) {
    const bulletAfter = appendFocusClause(firstHighlight, missingSupportedTerms.slice(0, 2));
    if (bulletAfter !== firstHighlight) {
      work.highlights[0] = bulletAfter;
      patches.push({
        target: `${work.name || "Experience"} bullet`,
        reason: "Make the strongest existing proof easier for this JD to match.",
        before: firstHighlight,
        after: bulletAfter,
      });
    }
  }

  const skillGroup = draftResume.skills[0];
  if (skillGroup) {
    const beforeSkills = skillGroup.keywords.join(", ");
    const existing = new Set(skillGroup.keywords.map((skill) => normalize(skill)));
    const additions = missingSupportedTerms.filter((term) => !existing.has(normalize(term)));
    if (additions.length) {
      skillGroup.keywords = [...skillGroup.keywords, ...additions];
      patches.push({
        target: "Skills",
        reason: "Add supported JD language to the searchable skill list.",
        before: beforeSkills,
        after: skillGroup.keywords.join(", "),
      });
    }
  }

  return { draftResume, patches };
};

export const analyzeTailoring = (resume: ResumeData, jd: string): TailoringAnalysis => {
  const job = parseJob(jd);
  const keywords = extractKeywords(jd, resume);
  const { draftResume, patches } = buildDraft(resume, keywords);
  const base = keywordScore(keywords, resumeText(resume));
  const tailored = keywordScore(keywords, resumeText(draftResume));

  return {
    job,
    keywords,
    score: {
      base,
      tailored,
      delta: Math.max(0, tailored - base),
    },
    patches,
    draftResume,
  };
};
