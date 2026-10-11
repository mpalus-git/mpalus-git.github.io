import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import dashboard from "@/assets/projects/fixflow-web/dashboard.png";
import poster from "@/assets/projects/fixflow-web/dispatch-drag-poster.png";
import workOrders from "@/assets/projects/fixflow-mobile/work-orders.png";
import Screenshot from "@/components/Screenshot.astro";
import Video from "@/components/Video.astro";

async function renderVideo(props: Record<string, unknown>): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(Video, { props });
}

async function renderScreenshot(props: Record<string, unknown>): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(Screenshot, { props });
}

describe("Video", () => {
  const props = {
    project: "fixflow-web",
    file: "dispatch-drag",
    poster,
    alt: "Dragging a work order",
    device: "desktop",
  };

  it("plays a muted loop with WebM and MP4 sources and a poster", async () => {
    const html = await renderVideo(props);
    const [autoplaying] = /<video[^>]*autoplay[^>]*>/.exec(html) ?? [];

    expect(autoplaying).toBeDefined();
    for (const attribute of ["muted", "loop", "playsinline", 'preload="metadata"']) {
      expect(autoplaying).toContain(attribute);
    }
    expect(autoplaying).toMatch(/poster="[^"]*webp[^"]*"/);
    expect(autoplaying).toContain(`width="${String(poster.width)}"`);
    expect(autoplaying).toContain(`height="${String(poster.height)}"`);
    expect(autoplaying).toContain('aria-label="Dragging a work order"');
    expect(autoplaying).toContain("motion-reduce:hidden");
    expect(
      html.match(/<source src="[^"]+dispatch-drag[^"]*\.webm[^"]*" type="video\/webm"/g),
    ).toHaveLength(2);
    expect(
      html.match(/<source src="[^"]+dispatch-drag[^"]*\.mp4[^"]*" type="video\/mp4"/g),
    ).toHaveLength(2);
  });

  it("offers a manually played version without autoplay for reduced motion", async () => {
    const html = await renderVideo(props);
    const [manual] = /<video[^>]*controls[^>]*>/.exec(html) ?? [];

    expect(manual).toBeDefined();
    expect(manual).not.toContain("autoplay");
    expect(manual).toContain("hidden motion-reduce:block");
  });
});

describe("Screenshot", () => {
  it("renders responsive AVIF and WebP sources with known dimensions", async () => {
    const html = await renderScreenshot({
      image: dashboard,
      alt: "Panel dashboard",
      device: "desktop",
    });

    expect(html).toContain('type="image/avif"');
    expect(html).toContain('type="image/webp"');
    expect(html).toMatch(/<img[^>]*alt="Panel dashboard"/);
    expect(html).toMatch(/<img[^>]*loading="lazy"/);
    expect(html).toMatch(
      /<img[^>]*width="1440"[^>]*height="900"|<img[^>]*height="900"[^>]*width="1440"/,
    );
  });

  it("keeps phone screenshots in a narrower column", async () => {
    const html = await renderScreenshot({
      image: workOrders,
      alt: "Work order list",
      device: "phone",
    });

    expect(html).toContain("max-w-[280px]");
    expect(html).toContain('sizes="280px"');
  });
});
