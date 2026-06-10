import { sampleResume, type ResumeData } from "../../src/lib/resume";

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const strongDesigner = clone(sampleResume);

const thinResume: ResumeData = {
  basics: {
    name: "Alex Rivera",
    label: "Designer",
    email: "alex",
    phone: "",
    location: { city: "Austin", region: "TX" },
    profiles: [],
  },
  summary: "Designer looking for a good role.",
  work: [
    {
      id: "work-one",
      name: "Studio",
      position: "",
      startDate: "",
      highlights: ["Worked on things."],
    },
  ],
  education: [],
  skills: [{ id: "skill-one", name: "Core", keywords: ["Design"] }],
};

const midResume = clone(sampleResume);
midResume.basics.phone = "";
midResume.basics.url = "";
midResume.basics.profiles = [];
midResume.work = midResume.work.slice(0, 2).map((work) => ({
  ...work,
  highlights: work.highlights.map((line) => line.replace(/\d[\d,+.%mk]*/gi, "many")),
}));

const linklessButStrong = clone(sampleResume);
linklessButStrong.basics.url = "";
linklessButStrong.basics.profiles = [];

export const atsCorpus = [
  {
    name: "strong complete resume",
    resume: strongDesigner,
    minScore: 95,
    maxScore: 100,
    passing: ["Contact", "Headline", "Summary", "Experience", "Bullets", "Impact", "Skills", "Links"],
    failing: [],
  },
  {
    name: "thin incomplete resume",
    resume: thinResume,
    minScore: 0,
    maxScore: 20,
    passing: [],
    failing: ["Contact", "Headline", "Summary", "Experience", "Bullets", "Impact", "Skills", "Links"],
  },
  {
    name: "solid resume missing contact/link signals",
    resume: midResume,
    minScore: 55,
    maxScore: 80,
    passing: ["Headline", "Summary", "Experience", "Bullets", "Skills"],
    failing: ["Contact", "Impact", "Links"],
  },
  {
    name: "strong resume without public link",
    resume: linklessButStrong,
    minScore: 85,
    maxScore: 95,
    passing: ["Contact", "Headline", "Summary", "Experience", "Bullets", "Impact", "Skills"],
    failing: ["Links"],
  },
] as const;
