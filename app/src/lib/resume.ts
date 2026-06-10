import { z } from "zod";

export type Profile = {
  network: string;
  username?: string;
  url: string;
};

export type WorkItem = {
  id: string;
  name: string;
  position: string;
  location?: string;
  startDate: string;
  endDate?: string;
  highlights: string[];
};

export type EducationItem = {
  id: string;
  institution: string;
  area: string;
  studyType: string;
  startDate?: string;
  endDate?: string;
};

export type SkillItem = {
  id: string;
  name: string;
  keywords: string[];
};

export type ResumeData = {
  basics: {
    name: string;
    label: string;
    email: string;
    phone: string;
    location: {
      city: string;
      region: string;
    };
    url?: string;
    profiles: Profile[];
  };
  summary: string;
  work: WorkItem[];
  education: EducationItem[];
  skills: SkillItem[];
};

const profileSchema = z.object({
  network: z.string().default("Website"),
  username: z.string().optional(),
  url: z.string().default(""),
});

const workSchema = z.object({
  id: z.string().optional(),
  name: z.string().default(""),
  position: z.string().default(""),
  location: z.string().optional(),
  startDate: z.string().default(""),
  endDate: z.string().optional(),
  summary: z.string().optional(),
  highlights: z.array(z.string()).default([]),
});

const educationSchema = z.object({
  id: z.string().optional(),
  institution: z.string().default(""),
  area: z.string().default(""),
  studyType: z.string().default(""),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

const skillSchema = z.object({
  id: z.string().optional(),
  name: z.string().default(""),
  keywords: z.array(z.string()).default([]),
});

export const resumeSchema = z.object({
  basics: z
    .object({
      name: z.string().default(""),
      label: z.string().default(""),
      email: z.string().default(""),
      phone: z.string().default(""),
      url: z.string().optional(),
      location: z
        .object({
          city: z.string().default(""),
          region: z.string().default(""),
        })
        .default({ city: "", region: "" }),
      profiles: z.array(profileSchema).default([]),
    })
    .default({
      name: "",
      label: "",
      email: "",
      phone: "",
      location: { city: "", region: "" },
      profiles: [],
    }),
  summary: z.string().default(""),
  work: z.array(workSchema).default([]),
  education: z.array(educationSchema).default([]),
  skills: z.array(skillSchema).default([]),
});

export const sampleResume: ResumeData = {
  basics: {
    name: "Maya Chen",
    label: "Senior Product Designer",
    email: "maya.chen@hey.com",
    phone: "(415) 555-0142",
    location: { city: "Brooklyn", region: "NY" },
    url: "mayachen.design",
    profiles: [
      { network: "GitHub", username: "mayac", url: "github.com/mayac" },
      { network: "Portfolio", url: "mayachen.design" },
    ],
  },
  summary:
    "Product designer with 7 years shipping tools for developers and designers. Led design for Figma's plugin ecosystem; before that, built the first design system at Linear.",
  work: [
    {
      id: "work-figma",
      name: "Figma",
      position: "Senior Product Designer, Platform",
      location: "Remote",
      startDate: "2022",
      endDate: "Present",
      highlights: [
        "Led end-to-end design for the Plugin API v3, adopted by 14,000+ developers and surfaced across 9M files in the first year.",
        "Ran a cross-functional redesign of the plugin store, lifting install-through rate 38% and author retention 22%.",
        "Built the internal design system for platform surfaces, 120+ components used by 6 product teams.",
      ],
    },
    {
      id: "work-linear",
      name: "Linear",
      position: "Product Designer",
      location: "San Francisco, CA",
      startDate: "2019",
      endDate: "2022",
      highlights: [
        "Designed the first version of Cycles, now used by 70% of Linear teams to plan their work.",
        "Established the foundational design system still in use today.",
        "Shipped the command menu, cited by customers as their single favorite feature.",
      ],
    },
    {
      id: "work-ideo",
      name: "IDEO",
      position: "Interaction Designer",
      location: "New York, NY",
      startDate: "2017",
      endDate: "2019",
      highlights: [
        "Led design for a patient-intake redesign at a major hospital system, cutting average check-in time from 12 to 4 minutes.",
      ],
    },
  ],
  education: [
    {
      id: "edu-risd",
      institution: "Rhode Island School of Design",
      area: "Graphic Design",
      studyType: "BFA",
      endDate: "2017",
    },
  ],
  skills: [
    {
      id: "skill-core",
      name: "Core",
      keywords: [
        "Product design",
        "Design systems",
        "Prototyping",
        "Figma",
        "User research",
        "React",
      ],
    },
  ],
};

const withIds = (resume: z.infer<typeof resumeSchema>): ResumeData => ({
  ...resume,
  work: resume.work.map((item, index) => ({ ...item, id: item.id ?? `work-${index}-${crypto.randomUUID()}` })),
  education: resume.education.map((item, index) => ({ ...item, id: item.id ?? `edu-${index}-${crypto.randomUUID()}` })),
  skills: resume.skills.map((item, index) => ({ ...item, id: item.id ?? `skill-${index}-${crypto.randomUUID()}` })),
});

export const parseResume = (input: unknown): ResumeData => {
  const parsed = resumeSchema.parse(input);
  return withIds(parsed);
};

export const toJsonResume = (resume: ResumeData) => ({
  basics: resume.basics,
  summary: resume.summary,
  work: resume.work.map(({ id: _id, ...item }) => item),
  education: resume.education.map(({ id: _id, ...item }) => item),
  skills: resume.skills.map(({ id: _id, ...item }) => item),
});

export { scoreResume, type ResumeScore, type ResumeScoreCheck } from "./ats";
