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
  | "selfhost";

type Tone = "warm" | "direct" | "formal" | "punchy";
type OutreachChannel = "linkedin" | "email" | "referral" | "recruiter";
type SocialTab = "linkedin" | "github" | "portfolio" | "cleanup";
type InterviewTab = "technical" | "craft" | "behavioral" | "asks";

const STORAGE_KEY = "resume-builder-workspace-v2";

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

const keywords = [
  { label: "design systems", hit: true, weight: "high" },
  { label: "platform", hit: true, weight: "high" },
  { label: "prototyping", hit: true, weight: "medium" },
  { label: "developer experience", hit: true, weight: "high" },
  { label: "api design", hit: false, weight: "high" },
  { label: "serverless", hit: false, weight: "low" },
  { label: "edge functions", hit: false, weight: "low" },
  { label: "figma", hit: true, weight: "medium" },
];

const diffRows = [
  {
    section: "Summary",
    reason: "Lead with platform because the JD opens there.",
    before:
      "Product designer with 7 years shipping tools for developers and designers. Led design for Figma's plugin ecosystem; before that, built the first design system at Linear.",
    after:
      "Platform product designer with 7 years shipping tools for developers. Led design for Figma's Plugin API, API design, developer experience, and Linear's first design system.",
  },
  {
    section: "Figma bullet",
    reason: "Name API design explicitly; it appears repeatedly in the JD.",
    before:
      "Led end-to-end design for the Plugin API v3, adopted by 14,000+ developers and surfaced across 9M files in the first year.",
    after:
      "Led end-to-end design for Plugin API v3, an API design and developer experience effort adopted by 14,000+ developers and surfaced across 9M files.",
  },
  {
    section: "Skills",
    reason: "Swap role-irrelevant tools for Vercel-facing language.",
    before: "Product design, Design systems, Prototyping, Figma, User research, React",
    after: "Product design, Design systems, Prototyping, Figma, React, API design, Developer experience",
  },
];

const versionRows = [
  { name: "Maya Chen - base", status: "draft", updated: "today", jd: "-", score: 68 },
  { name: "Vercel - Sr. Product Designer", status: "applied", updated: "today", jd: "vercel.com", score: 82 },
  { name: "Linear - Design Lead", status: "interview", updated: "2d", jd: "linear.app", score: 88 },
  { name: "Anthropic - Product Designer", status: "applied", updated: "5d", jd: "anthropic.com", score: 79 },
  { name: "Stripe - Staff Designer", status: "rejected", updated: "1w", jd: "stripe.com", score: 71 },
  { name: "Ramp - Senior Designer", status: "offer", updated: "2w", jd: "ramp.com", score: 85 },
];

const letters: Record<Tone, string[]> = {
  warm: [
    "I have been a Vercel customer since preview deploy URLs changed how I show work. Your platform role reads like the same kind of problem I have spent the last few years solving.",
    "At Figma I led design for Plugin API v3, from research through launch. The work was equal parts API design, developer experience, dashboards, and the design system that tied them together.",
    "Before that, I was the first design hire at Linear and helped establish the product system still used today. I prototype heavily, read the code, and prefer shipping real surfaces over handing off static mocks.",
  ],
  direct: [
    "Your platform team posting describes work I have already shipped. I would like to do that work at Vercel.",
    "At Figma I led Plugin API v3, adopted by 14,000 developers and surfaced across 9M files. At Linear I built the first design system.",
    "I prototype in code, collaborate closely with engineering, and know how to make complex developer surfaces feel humane.",
  ],
  formal: [
    "I am writing to express interest in the Senior Product Designer role on Vercel's platform team.",
    "My experience aligns with the responsibilities in the role: developer-facing platform surfaces, API design, and design systems at scale.",
    "I would welcome the opportunity to discuss how this background could contribute to the team.",
  ],
  punchy: [
    "Three lines, then I am done:",
    "Plugin API v3 at Figma. 14k developers. 9M files. I led design end to end.",
    "First designer at Linear. Built the system. I want to do the same kind of platform work at Vercel.",
  ],
};

const outreachDrafts: Record<OutreachChannel, Array<{ tag: string; title?: string; body: string }>> = {
  linkedin: [
    {
      tag: "Warm",
      body:
        "Hi Lee - your post about platform DX made me re-read your SDK notes. I led Plugin API v3 at Figma and saw the platform PD role. Open to a short chat?",
    },
    {
      tag: "Direct",
      body:
        "Hi Lee - Maya Chen, designer. Led Plugin API v3 at Figma, 14k developers and 9M files. Vercel's platform role looks like the same shape of problem.",
    },
    {
      tag: "Portfolio",
      body:
        "Long-time Vercel user. I wrote up my Plugin API design process here: mayachen.design/plugin-api. Happy to send a tailored resume if the role is still open.",
    },
  ],
  email: [
    {
      tag: "Warm",
      title: "Plugin API v3 -> platform PD",
      body:
        "Hi Lee,\n\nI am Maya, a designer who led Plugin API v3 at Figma. The Vercel platform role maps closely to work I have shipped: API design, DX, dashboards, and design systems.\n\nResume attached if useful.",
    },
    {
      tag: "Direct",
      title: "Senior PD, platform",
      body:
        "Applying to the platform PD role. Most relevant work: Plugin API v3 at Figma and Linear's first design system. Available to talk this week.",
    },
    {
      tag: "Story",
      title: "A Plugin API question",
      body:
        "When you redesign a deploy pipeline, do you start with failure states or the happy path? I led similar work at Figma, and that question is why the role caught my eye.",
    },
  ],
  referral: [
    {
      tag: "Warm",
      body:
        "Sam - I saw Vercel posted a platform design role and it looks like a strong fit. Would a referral to Lee or the hiring manager feel okay?",
    },
    {
      tag: "Short",
      body: "Vercel platform PD role is open. Do you know who is hiring? I would value a referral if it is easy.",
    },
    {
      tag: "Context",
      body:
        "The role overlaps with my Plugin API v3 work at Figma. No pressure if it is awkward, but you were the obvious person to ask first.",
    },
  ],
  recruiter: [
    {
      tag: "Interested",
      body:
        "Thanks for reaching out. I would like to talk about the platform PD role. Available Tuesday or Wednesday afternoon ET.",
    },
    {
      tag: "Questions",
      body:
        "Open to learning more. Before we book: is this Lee's team, is it remote-friendly, and what is the compensation band?",
    },
    {
      tag: "Later",
      body:
        "Appreciate the note. I am not actively looking right now, but please keep me in mind for next year.",
    },
  ],
};

const socialProfiles: Record<
  Exclude<SocialTab, "cleanup">,
  {
    score: number;
    headline: string;
    about: string;
    checks: Array<{ label: string; state: "done" | "fix" | "watch"; note: string }>;
    polish: Array<{ label: string; before: string; after: string }>;
  }
> = {
  linkedin: {
    score: 78,
    headline: "Senior Product Designer | Developer Platforms, Design Systems, API Design",
    about:
      "I design developer-facing platform products: APIs, dashboards, design systems, and workflows that help teams ship with less friction.",
    checks: [
      { label: "Headline mirrors target role", state: "done", note: "Platform, API design, and design systems are visible." },
      { label: "Featured work links", state: "fix", note: "Add Plugin API v3 case study and one resume PDF." },
      { label: "About section hook", state: "done", note: "First line states the category of work clearly." },
      { label: "Experience bullets", state: "watch", note: "Move metrics above soft responsibilities." },
      { label: "Skills order", state: "fix", note: "Pin API design, developer experience, systems, and prototyping." },
    ],
    polish: [
      {
        label: "Headline",
        before: "Senior Product Designer at Figma",
        after: "Senior Product Designer | Developer Platforms, Design Systems, API Design",
      },
      {
        label: "About opener",
        before: "I am a product designer passionate about building great products.",
        after: "I design developer-facing platform products: APIs, dashboards, design systems, and workflows that help teams ship with less friction.",
      },
      {
        label: "Featured link label",
        before: "Portfolio",
        after: "Plugin API v3 case study: 14k developers, 9M files",
      },
    ],
  },
  github: {
    score: 72,
    headline: "Pinned repos should prove craft, systems thinking, and code literacy.",
    about:
      "Make GitHub support the resume story: clean README files, pinned projects that match the role, and no abandoned experiments in the first impression.",
    checks: [
      { label: "Pinned repos match target", state: "fix", note: "Pin design-system and prototype repos first." },
      { label: "README quality", state: "watch", note: "Add screenshots, setup, and what decisions were hard." },
      { label: "Profile README", state: "done", note: "Use a short role statement and 3 proof links." },
      { label: "Stale repos", state: "fix", note: "Archive unfinished experiments or add honest status notes." },
      { label: "Contribution signal", state: "watch", note: "Keep recent commits focused and readable." },
    ],
    polish: [
      {
        label: "Profile README line",
        before: "Designer learning code.",
        after: "Product designer building developer tools, design systems, and React prototypes.",
      },
      {
        label: "Pinned repo description",
        before: "Components and stuff.",
        after: "Token-driven React component system with accessibility fixtures and visual regression tests.",
      },
      {
        label: "Archive note",
        before: "old-plugin-tests",
        after: "Archived exploration from Plugin API v2 research; kept for reference, not maintained.",
      },
    ],
  },
  portfolio: {
    score: 84,
    headline: "Portfolio should answer fit before the recruiter opens a PDF.",
    about:
      "The portfolio homepage should make the same promise as the tailored resume: platform design, API design, systems work, and measurable outcomes.",
    checks: [
      { label: "Hero states target work", state: "done", note: "Lead with developer platforms, not generic product design." },
      { label: "Case study order", state: "done", note: "Plugin API first, Linear system second." },
      { label: "Outcome metrics", state: "watch", note: "Put adoption and retention metrics in the first viewport." },
      { label: "Contact path", state: "fix", note: "Add email and LinkedIn in footer and header." },
      { label: "Resume link", state: "fix", note: "Link tailored PDF and JSON Resume export." },
    ],
    polish: [
      {
        label: "Homepage H1",
        before: "Product designer based in Brooklyn.",
        after: "I design developer platforms, APIs, and systems that make complex tools easier to ship.",
      },
      {
        label: "Case study title",
        before: "Figma Plugins",
        after: "Plugin API v3: designing a platform used by 14,000 developers.",
      },
      {
        label: "CTA",
        before: "Get in touch",
        after: "See the platform case study",
      },
    ],
  },
};

const postAuditRows = [
  {
    age: "2y",
    source: "LinkedIn",
    issue: "Generic career advice thread",
    action: "Archive",
    reason: "Does not support platform-design positioning.",
  },
  {
    age: "1y",
    source: "X",
    issue: "Hot take about design systems",
    action: "Rewrite",
    reason: "Keep the insight, remove the absolute language.",
  },
  {
    age: "8m",
    source: "LinkedIn",
    issue: "Plugin API launch post",
    action: "Keep",
    reason: "Strong proof point; add it to Featured.",
  },
  {
    age: "5m",
    source: "Blog",
    issue: "Unfinished prototyping note",
    action: "Refresh",
    reason: "Turn into a short case-study sidebar.",
  },
];

const interviewQuestions: Record<InterviewTab, Array<{ q: string; why: string; hook: string; likelihood: string }>> = {
  technical: [
    {
      q: "How do you design an API that designers will actually use?",
      why: "The JD asks for API design and developer experience.",
      hook: "Plugin API v3 was the bet that designers would write code if the failure modes were humane.",
      likelihood: "High",
    },
    {
      q: "Walk me through a system you owned end to end.",
      why: "Senior platform roles test ownership depth.",
      hook: "Linear's design system, from zero to adopted by every team.",
      likelihood: "High",
    },
    {
      q: "How do you balance code prototypes and Figma?",
      why: "The role explicitly asks for prototyping strength.",
      hook: "Code for state and edge cases, Figma for surface exploration.",
      likelihood: "Medium",
    },
  ],
  craft: [
    {
      q: "Walk me through your portfolio.",
      why: "The first screen will test narrative focus.",
      hook: "Three projects: one platform, one system, one healthcare workflow.",
      likelihood: "High",
    },
    {
      q: "Show a piece of work you are not proud of.",
      why: "They want self-awareness, not polish.",
      hook: "Plugin store v2 looked good and converted poorly.",
      likelihood: "High",
    },
  ],
  behavioral: [
    {
      q: "Tell me about a conflict with an engineer.",
      why: "Senior IC collaboration matters more than taste.",
      hook: "Plugin API method names: technical precision vs writer-friendly shape.",
      likelihood: "High",
    },
    {
      q: "When did you change your mind?",
      why: "Tests learning speed.",
      hook: "I used to think design systems should be exhaustive.",
      likelihood: "Medium",
    },
  ],
  asks: [
    {
      q: "What does success look like in six months?",
      why: "Clarifies whether the role has a real mandate.",
      hook: "Use it to pin scope and decision rights.",
      likelihood: "High",
    },
    {
      q: "How does design get work into the roadmap?",
      why: "Reveals whether design is upstream or downstream.",
      hook: "Listen for ownership, not ceremonies.",
      likelihood: "High",
    },
  ],
};

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

const downloadFile = (name: string, type: string, body: string) => {
  const blob = new Blob([body], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
};

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
  const activeWork = resume.work.find((work) => work.id === activeWorkId) ?? resume.work[0];

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(resume));
  }, [resume]);

  useEffect(() => {
    const syncHash = () => setPage(initialPage());
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  const go = (next: Page) => {
    window.location.hash = next;
    setPage(next);
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
    } catch {
      setImportError("Invalid JSON Resume file.");
    } finally {
      event.target.value = "";
    }
  };

  const exportJson = () => {
    downloadFile("resume.json", "application/json", JSON.stringify(toJsonResume(resume), null, 2));
  };

  const applyTailoredDraft = () => {
    setResume((current) => ({
      ...current,
      summary:
        "Platform product designer with 7 years shipping tools for developers. Led design for Figma's Plugin API, API design, developer experience, and Linear's first design system.",
      work: current.work.map((work, index) =>
        index === 0
          ? {
              ...work,
              highlights: [
                "Led end-to-end design for Plugin API v3, an API design and developer experience effort adopted by 14,000+ developers and surfaced across 9M files.",
                "Redesigned plugin platform surfaces across dashboards, settings, and install flows, lifting install-through rate 38%.",
                "Evolved the platform design system, 120+ components used by 6 product teams.",
              ],
            }
          : work,
      ),
      skills: [
        {
          id: current.skills[0]?.id ?? "skill-core",
          name: "Core",
          keywords: [
            "Product design",
            "Design systems",
            "Prototyping",
            "Figma",
            "React",
            "API design",
            "Developer experience",
          ],
        },
      ],
    }));
    go("diff");
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
          <button className="button primary" onClick={() => window.print()}>
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
        />
      )}
      {page === "tailor" && (
        <TailorPage
          resume={resume}
          jd={jd}
          setJd={setJd}
          template={template}
          applyTailoredDraft={applyTailoredDraft}
        />
      )}
      {page === "diff" && <DiffPage resume={resume} applyTailoredDraft={applyTailoredDraft} />}
      {page === "templates" && (
        <TemplatesPage resume={resume} template={template} setTemplate={setTemplate} go={go} />
      )}
      {page === "versions" && <VersionsPage />}
      {page === "letter" && <CoverLetterPage tone={tone} setTone={setTone} />}
      {page === "outreach" && (
        <OutreachPage channel={outreachChannel} setChannel={setOutreachChannel} />
      )}
      {page === "social" && <SocialPage tab={socialTab} setTab={setSocialTab} />}
      {page === "interview" && (
        <InterviewPage tab={interviewTab} setTab={setInterviewTab} />
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
          ["Editor", "Split form and live paper preview with browser PDF export."],
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
}: {
  resume: ResumeData;
  score: ReturnType<typeof scoreResume>;
  template: Template;
  setTemplate: (template: Template) => void;
  activeWork?: WorkItem;
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
}) {
  return (
    <main className="workspace">
      <aside className="sidebar">
        <ScoreWidget score={score} />
        <div className="sidebar-section">
          <div className="eyebrow">Templates</div>
          <div className="template-list" role="tablist" aria-label="Resume templates">
            {templates.slice(0, 3).map((item) => (
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
          <button className="button quiet" onClick={() => window.print()}>
            <FileDown size={16} />
            Print
          </button>
        </div>
        <ResumePaper resume={resume} template={template} />
      </section>
    </main>
  );
}

function TailorPage({
  resume,
  jd,
  setJd,
  template,
  applyTailoredDraft,
}: {
  resume: ResumeData;
  jd: string;
  setJd: (value: string) => void;
  template: Template;
  applyTailoredDraft: () => void;
}) {
  return (
    <main className="tailor-layout">
      <section className="jd-panel">
        <div className="panel-head">
          <div>
            <div className="eyebrow">Job description</div>
            <h1>Senior Product Designer</h1>
            <p>Vercel - Remote - pasted locally</p>
          </div>
          <button className="button primary" onClick={applyTailoredDraft}>
            <Sparkles size={16} />
            Re-tailor
          </button>
        </div>
        <textarea className="jd-textarea" value={jd} onChange={(event) => setJd(event.target.value)} />
      </section>

      <aside className="analysis-panel">
        <MetricCard label="Match score" value="82" note="+14 vs base" />
        <div className="keyword-list">
          <div className="eyebrow">Keywords</div>
          {keywords.map((keyword) => (
            <div className="keyword-row" key={keyword.label}>
              <span className={keyword.hit ? "keyword-dot hit" : "keyword-dot"}>{keyword.hit ? <Check size={11} /> : null}</span>
              <span>{keyword.label}</span>
              <small>{keyword.weight}</small>
            </div>
          ))}
        </div>
        <div className="suggestion-list">
          <div className="eyebrow">Suggested edits</div>
          {diffRows.map((row) => (
            <button className="suggestion-card" key={row.section} onClick={applyTailoredDraft}>
              <strong>{row.section}</strong>
              <span>{row.reason}</span>
            </button>
          ))}
        </div>
      </aside>

      <section className="tailored-preview">
        <div className="preview-toolbar">
          <span>Tailored draft - v2</span>
        </div>
        <ResumePaper resume={resume} template={template} />
      </section>
    </main>
  );
}

function DiffPage({
  resume,
  applyTailoredDraft,
}: {
  resume: ResumeData;
  applyTailoredDraft: () => void;
}) {
  return (
    <main className="content-page">
      <PageHeader
        kicker="AI diff"
        title="Every change shows its receipt."
        body="Suggestions are patch-shaped: target, rationale, confidence, before, after."
        action={
          <button className="button primary" onClick={applyTailoredDraft}>
            <Check size={16} />
            Accept all
          </button>
        }
      />
      <div className="diff-grid">
        <section className="diff-list">
          {diffRows.map((row) => (
            <article className="diff-card" key={row.section}>
              <header>
                <span>{row.section}</span>
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
          ))}
        </section>
        <aside className="diff-paper">
          <ResumePaper resume={resume} template="kraft" compact />
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

function VersionsPage() {
  return (
    <main className="content-page">
      <PageHeader
        kicker="Versions"
        title="One resume. Many forks."
        body="Each application keeps its own local patch set while the base resume stays intact."
      />
      <section className="version-table">
        <div className="version-head">
          <span>Resume</span>
          <span>Status</span>
          <span>Updated</span>
          <span>Job</span>
          <span>Match</span>
        </div>
        {versionRows.map((row) => (
          <div className="version-row" key={row.name}>
            <strong>{row.name}</strong>
            <span className={`status ${row.status}`}>{row.status}</span>
            <span>{row.updated}</span>
            <span>{row.jd}</span>
            <span className="score-mini">{row.score}</span>
          </div>
        ))}
      </section>
    </main>
  );
}

function CoverLetterPage({
  tone,
  setTone,
}: {
  tone: Tone;
  setTone: (tone: Tone) => void;
}) {
  return (
    <main className="document-layout">
      <aside className="document-controls">
        <div className="panel-head compact">
          <div>
            <div className="eyebrow">Cover letter</div>
            <h1>Vercel</h1>
            <p>Generated from the tailored resume and JD.</p>
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
        <SignalMeter label="Personal" value={92} />
        <SignalMeter label="Mentions JD" value={88} />
        <SignalMeter label="Avoids restating resume" value={76} />
        <SignalMeter label="Cliches" value={94} />
      </aside>
      <section className="letter-paper">
        <div className="letter-date">May 8, 2026</div>
        <div className="letter-to">
          <strong>Vercel - Hiring Team</strong>
          <span>vercel.com/careers</span>
        </div>
        <p>Hi Vercel team,</p>
        {letters[tone].map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
        <p>Warmly,</p>
        <div className="signature">Maya Chen</div>
      </section>
    </main>
  );
}

function OutreachPage({
  channel,
  setChannel,
}: {
  channel: OutreachChannel;
  setChannel: (channel: OutreachChannel) => void;
}) {
  return (
    <main className="content-page">
      <PageHeader
        kicker="Outreach"
        title="Three drafts to pick from."
        body="Short, channel-aware messages generated from the resume and job context."
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
        {outreachDrafts[channel].map((draft) => (
          <article className="draft-card" key={draft.tag}>
            <span>{draft.tag}</span>
            {draft.title && <strong>{draft.title}</strong>}
            <p>{draft.body}</p>
            <button className="button">Copy</button>
          </article>
        ))}
      </section>
    </main>
  );
}

function SocialPage({
  tab,
  setTab,
}: {
  tab: SocialTab;
  setTab: (tab: SocialTab) => void;
}) {
  const profile = tab === "cleanup" ? null : socialProfiles[tab];

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
              <div className="avatar-block">MC</div>
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
  tab,
  setTab,
}: {
  tab: InterviewTab;
  setTab: (tab: InterviewTab) => void;
}) {
  return (
    <main className="content-page">
      <PageHeader
        kicker="Interview prep"
        title="Likely questions from the JD."
        body="Question, why it will come up, and the hook back to your resume."
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
        {interviewQuestions[tab].map((item, index) => (
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

function SelfHostPage() {
  return (
    <main className="content-page">
      <PageHeader
        kicker="Open and portable"
        title="Your resume is a file."
        body="JSON Resume underneath, a static web app on Pages, and a clear path to CLI, Docker, and plugin SDK."
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
        <DevCard title="Docker" command="docker run -p 3210:3210 resume/app" />
        <DevCard title="CLI" command="npx resume@latest export --template folio --pdf" />
        <DevCard title="GitHub Action" command="uses: resume/render-action@v1" />
        <DevCard title="Plugin SDK" command="defineTemplate({ name: 'my-template', render })" />
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
