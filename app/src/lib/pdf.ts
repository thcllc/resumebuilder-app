import type { ResumeData } from "./resume";

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 54;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const BODY_SIZE = 10;
const TITLE_SIZE = 18;
const SECTION_SIZE = 12;
const LINE_HEIGHT = 14;

type PdfLine = {
  text: string;
  size: number;
  gapBefore?: number;
};

const textEncoder = new TextEncoder();

const byteLength = (value: string) => textEncoder.encode(value).length;

const escapePdfText = (value: string) =>
  value
    .replace(/[\\()]/g, "\\$&")
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const wrapText = (value: string, maxCharacters: number) => {
  const words = value.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxCharacters && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  });

  if (current) lines.push(current);
  return lines.length ? lines : [""];
};

const addWrapped = (
  lines: PdfLine[],
  text: string,
  size = BODY_SIZE,
  gapBefore = 0,
  maxCharacters = Math.floor(CONTENT_WIDTH / (size * 0.54)),
) => {
  wrapText(text, maxCharacters).forEach((line, index) => {
    lines.push({ text: line, size, gapBefore: index === 0 ? gapBefore : 0 });
  });
};

export const resumeToPdfLines = (resume: ResumeData): PdfLine[] => {
  const lines: PdfLine[] = [];
  const contact = [
    resume.basics.email,
    resume.basics.phone,
    [resume.basics.location.city, resume.basics.location.region].filter(Boolean).join(", "),
    resume.basics.url,
  ]
    .filter(Boolean)
    .join(" | ");

  addWrapped(lines, resume.basics.name || "Untitled Resume", TITLE_SIZE, 0, 46);
  addWrapped(lines, resume.basics.label, BODY_SIZE, 2);
  addWrapped(lines, contact, BODY_SIZE, 0);

  if (resume.summary.trim()) {
    addWrapped(lines, "SUMMARY", SECTION_SIZE, 14);
    addWrapped(lines, resume.summary);
  }

  if (resume.work.length) {
    addWrapped(lines, "EXPERIENCE", SECTION_SIZE, 14);
    resume.work.forEach((work) => {
      const roleLine = [work.position, work.name].filter(Boolean).join(" - ");
      const dateLine = [work.startDate, work.endDate].filter(Boolean).join(" - ");
      addWrapped(lines, [roleLine, dateLine].filter(Boolean).join(" | "), BODY_SIZE, 8);
      work.highlights.filter(Boolean).forEach((highlight) => {
        addWrapped(lines, `- ${highlight}`, BODY_SIZE, 0);
      });
    });
  }

  if (resume.education.length) {
    addWrapped(lines, "EDUCATION", SECTION_SIZE, 14);
    resume.education.forEach((education) => {
      addWrapped(
        lines,
        [
          education.studyType,
          education.area,
          education.institution,
          [education.startDate, education.endDate].filter(Boolean).join(" - "),
        ]
          .filter(Boolean)
          .join(" | "),
      );
    });
  }

  if (resume.skills.length) {
    addWrapped(lines, "SKILLS", SECTION_SIZE, 14);
    resume.skills.forEach((skill) => {
      addWrapped(lines, [skill.name, skill.keywords.join(", ")].filter(Boolean).join(": "));
    });
  }

  return lines;
};

const paginate = (lines: PdfLine[]) => {
  const pages: PdfLine[][] = [[]];
  let y = PAGE_HEIGHT - MARGIN;

  lines.forEach((line) => {
    const lineHeight = Math.max(LINE_HEIGHT, line.size + 4);
    const nextY = y - (line.gapBefore ?? 0) - lineHeight;
    if (nextY < MARGIN && pages.at(-1)?.length) {
      pages.push([]);
      y = PAGE_HEIGHT - MARGIN;
    }

    pages[pages.length - 1].push(line);
    y -= (line.gapBefore ?? 0) + lineHeight;
  });

  return pages;
};

const pageStream = (lines: PdfLine[]) => {
  let y = PAGE_HEIGHT - MARGIN;
  return lines
    .map((line) => {
      const lineHeight = Math.max(LINE_HEIGHT, line.size + 4);
      y -= line.gapBefore ?? 0;
      const command = `BT /F1 ${line.size} Tf ${MARGIN} ${y} Td (${escapePdfText(line.text)}) Tj ET`;
      y -= lineHeight;
      return command;
    })
    .join("\n");
};

export const createResumePdfBlob = (resume: ResumeData): Blob => {
  const pages = paginate(resumeToPdfLines(resume));
  const pageObjectStart = 4;
  const objects: string[] = [];
  const pageObjects = pages.map((_, index) => pageObjectStart + index * 2);

  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[2] = `<< /Type /Pages /Kids [${pageObjects.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>`;
  objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";

  pages.forEach((page, index) => {
    const pageId = pageObjectStart + index * 2;
    const contentId = pageId + 1;
    const stream = pageStream(page);
    objects[pageId] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`;
    objects[contentId] = `<< /Length ${byteLength(stream)} >>\nstream\n${stream}\nendstream`;
  });

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  for (let index = 1; index < objects.length; index += 1) {
    offsets[index] = byteLength(pdf);
    pdf += `${index} 0 obj\n${objects[index]}\nendobj\n`;
  }

  const xrefOffset = byteLength(pdf);
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let index = 1; index < objects.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new Blob([pdf], { type: "application/pdf" });
};
