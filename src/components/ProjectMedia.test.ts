import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import dispatch from "@/assets/projects/fixflow-web/dispatch.png";
import workOrders from "@/assets/projects/fixflow-mobile/work-orders.png";
import ProjectMedia from "@/components/ProjectMedia.astro";

async function render(props: Record<string, unknown>): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(ProjectMedia, { props });
}

describe("ProjectMedia", () => {
  const project = {
    data: {
      project: "fixflow-mobile",
      screenshots: [
        { image: workOrders, alt: "Work orders", caption: "List", device: "phone" },
        { image: dispatch, alt: "Dispatch board", caption: "Board", device: "desktop" },
      ],
    },
  };

  it("frames every screenshot separately in the brand colour", async () => {
    const html = await render({ project, language: "en" });

    expect(html.match(/<a[^>]*class="[^"]*rounded-xl border-2 border-brand/g)).toHaveLength(2);
  });

  it("does not place the screenshots on a shared background", async () => {
    const html = await render({ project, language: "en" });

    expect(html).not.toContain("bg-brand-tint");
    expect(html).not.toContain("rounded-lg border border-border");
  });
});
