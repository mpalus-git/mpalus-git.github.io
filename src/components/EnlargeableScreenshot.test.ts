import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import dispatch from "@/assets/projects/fixflow-web/dispatch.png";
import dispatchThumb from "@/assets/projects/fixflow-web/dispatch-thumb.png";
import workOrders from "@/assets/projects/fixflow-mobile/work-orders.png";
import EnlargeableScreenshot from "@/components/EnlargeableScreenshot.astro";

async function render(props: Record<string, unknown>): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(EnlargeableScreenshot, { props });
}

describe("EnlargeableScreenshot", () => {
  const props = {
    image: dispatch,
    alt: "Dispatch board",
    device: "desktop",
    sizes: "532px",
    language: "en",
    class: "frame",
  };

  it("links to the full-size WebP image in the same tab", async () => {
    const html = await render(props);
    const [link] = /<a[^>]*>/.exec(html) ?? [];

    expect(link).toBeDefined();
    expect(link).toMatch(/href="[^"]*f=webp[^"]*"/);
    expect(link).toMatch(/href="[^"]*w=1440[^"]*"/);
    expect(link).not.toContain("target=");
    expect(link).toContain("frame");
  });

  it("shows the thumbnail and links to the full-size image", async () => {
    const html = await render({ ...props, thumbnail: dispatchThumb });
    const [link] = /<a[^>]*>/.exec(html) ?? [];
    const [img] = /<img[^>]*>/.exec(html) ?? [];

    expect(link).toMatch(/href="[^"]*w=1440[^"]*"/);
    expect(img).toContain('width="800"');
    expect(img).toContain('height="500"');
    expect(img).toContain('alt="Dispatch board"');
  });

  it.each([
    ["en", 'aria-label="Enlarge: Dispatch board"'],
    ["pl", 'aria-label="Powiększ: Dispatch board"'],
  ] as const)("names the link with the screenshot description in %s", async (language, label) => {
    const html = await render({ ...props, language });

    expect(html).toContain(label);
    expect(html).toContain('alt="Dispatch board"');
  });

  it("hides the enlarge icon from assistive technology", async () => {
    const html = await render(props);

    expect(html).toMatch(/<svg[^>]*aria-hidden="true"/);
  });

  it("uses a smaller icon on phone screenshots", async () => {
    const desktop = await render(props);
    const phone = await render({ ...props, image: workOrders, device: "phone" });

    expect(desktop).toContain("size-9");
    expect(phone).toContain("size-7");
    expect(phone).not.toContain("size-9");
  });
});
