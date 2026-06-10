import { expect, test } from "playwright/test";
import { defineTemplate, markdownTemplate, renderTemplate } from "../src/lib/plugins";
import { sampleResume } from "../src/lib/resume";

test.describe("template plugin SDK", () => {
  test("defines and renders a custom template", () => {
    const plugin = defineTemplate({
      id: "plain-text",
      name: "Plain Text",
      description: "A test renderer.",
      render: (resume) => `${resume.basics.name} - ${resume.basics.label}`,
    });

    expect(renderTemplate(plugin, sampleResume)).toContain(sampleResume.basics.name);
  });

  test("ships a markdown template for file workflows", () => {
    const rendered = renderTemplate(markdownTemplate, sampleResume);

    expect(rendered).toContain("# Maya Chen");
    expect(rendered).toContain("## Experience");
    expect(rendered).toContain("## Skills");
  });

  test("rejects invalid plugin ids", () => {
    expect(() =>
      defineTemplate({
        id: "Bad Id",
        name: "Bad",
        description: "Invalid id.",
        render: () => "",
      }),
    ).toThrow(/lowercase/);
  });
});
