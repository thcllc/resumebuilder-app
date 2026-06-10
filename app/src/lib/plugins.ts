import type { ResumeData } from "./resume";

export type ResumeTemplatePlugin = {
  id: string;
  name: string;
  description: string;
  render: (resume: ResumeData) => string;
};

const assertId = (id: string) => {
  if (!/^[a-z0-9-]+$/.test(id)) {
    throw new Error("Template plugin id must use lowercase letters, numbers, and dashes.");
  }
};

export const defineTemplate = (plugin: ResumeTemplatePlugin): ResumeTemplatePlugin => {
  assertId(plugin.id);
  if (!plugin.name.trim()) throw new Error("Template plugin name is required.");
  if (!plugin.description.trim()) throw new Error("Template plugin description is required.");
  return plugin;
};

export const renderTemplate = (plugin: ResumeTemplatePlugin, resume: ResumeData) => plugin.render(resume);

export const markdownTemplate = defineTemplate({
  id: "markdown",
  name: "Markdown",
  description: "Portable text template for README and git workflows.",
  render: (resume) => [
    `# ${resume.basics.name || "Untitled Resume"}`,
    resume.basics.label,
    "",
    "## Summary",
    resume.summary,
    "",
    "## Experience",
    ...resume.work.flatMap((work) => [
      `### ${[work.position, work.name].filter(Boolean).join(" - ")}`,
      ...work.highlights.map((highlight) => `- ${highlight}`),
    ]),
    "",
    "## Skills",
    ...resume.skills.map((skill) => `- ${[skill.name, skill.keywords.join(", ")].filter(Boolean).join(": ")}`),
  ]
    .filter(Boolean)
    .join("\n"),
});
