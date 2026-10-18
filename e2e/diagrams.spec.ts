import { expect, test } from "@playwright/test";
import { newPageContext } from "./support";

const diagramPages = [
  { path: "/", diagrams: 2 },
  { path: "/en/", diagrams: 2 },
  { path: "/fixflow-api/", diagrams: 1 },
  { path: "/en/fixflow-api/", diagrams: 1 },
];
const minimumTextSize = 12;
const metricFont = 'Arial, "Liberation Sans"';

for (const { path, diagrams } of diagramPages) {
  for (const width of ["360", "640", "1440"]) {
    test(`keeps diagram text readable on ${path} at ${width} px`, async ({ browser }) => {
      const context = await newPageContext(browser, path, {
        viewport: { width: Number(width), height: 900 },
      });
      const page = await context.newPage();
      await page.goto(path);

      const report = await page.evaluate((font) => {
        const visible = [...document.querySelectorAll<SVGSVGElement>("svg[role='img']")].filter(
          (svg) => svg.getBoundingClientRect().width > 0,
        );
        for (const svg of visible) {
          svg.setAttribute("font-family", font);
        }
        return {
          overflow: document.documentElement.scrollWidth > window.innerWidth,
          diagrams: visible.map((svg) => {
            const scale = svg.getBoundingClientRect().width / svg.viewBox.baseVal.width;
            const texts = [...svg.querySelectorAll("text")];
            const outside = [...svg.querySelectorAll("g")].flatMap((group) => {
              const rect = group.querySelector("rect");
              if (!rect) {
                return [];
              }
              const box = rect.getBBox();
              return [...group.querySelectorAll("text")]
                .filter((text) => {
                  const bounds = text.getBBox();
                  return (
                    bounds.x < box.x + 4 ||
                    bounds.x + bounds.width > box.x + box.width - 4 ||
                    bounds.y < box.y ||
                    bounds.y + bounds.height > box.y + box.height
                  );
                })
                .map((text) => text.textContent.trim());
            });
            return {
              smallest: Math.min(
                ...texts.map((text) => parseFloat(getComputedStyle(text).fontSize) * scale),
              ),
              outside,
            };
          }),
        };
      }, metricFont);

      expect(report.overflow).toBe(false);
      expect(report.diagrams).toHaveLength(diagrams);
      for (const diagram of report.diagrams) {
        expect(diagram.smallest).toBeGreaterThanOrEqual(minimumTextSize);
        expect(diagram.outside).toEqual([]);
      }
      await context.close();
    });
  }
}

for (const path of ["/", "/en/"]) {
  test(`keeps arrow labels apart from arrows and aligns the FixFlow heading on ${path}`, async ({
    browser,
  }) => {
    const context = await newPageContext(browser, path, {
      viewport: { width: 1440, height: 900 },
    });
    const page = await context.newPage();
    await page.goto(path);

    const report = await page.evaluate((font) => {
      const svg = document.querySelector<SVGSVGElement>("#fixflow svg[role='img']");
      const heading = document.querySelector("#fixflow-heading");
      if (!svg || !heading) {
        return null;
      }
      svg.setAttribute("font-family", font);
      const arrows = [...svg.querySelectorAll("line")].map((line) => ({
        x: line.x1.baseVal.value,
        top: line.y1.baseVal.value,
        bottom: line.y2.baseVal.value,
      }));
      const labels = [...svg.querySelectorAll<SVGTextElement>("g:not(:has(rect)) > text")];
      const gaps = labels.flatMap((text) => {
        const bounds = text.getBBox();
        return arrows
          .filter((arrow) => bounds.y < arrow.bottom && bounds.y + bounds.height > arrow.top)
          .map((arrow) => Math.max(bounds.x - arrow.x, arrow.x - (bounds.x + bounds.width)));
      });
      return {
        labels: labels.length,
        smallestGap: Math.min(...gaps),
        headingOffset: Math.abs(
          heading.getBoundingClientRect().top - svg.getBoundingClientRect().top,
        ),
      };
    }, metricFont);

    expect(report?.labels).toBeGreaterThan(0);
    expect(report?.smallestGap).toBeGreaterThanOrEqual(12);
    expect(report?.headingOffset).toBeLessThan(24);
    await context.close();
  });
}
