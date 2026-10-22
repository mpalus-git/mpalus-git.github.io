import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import Icon from "@/components/Icon.astro";
import { icons, type IconName } from "@/components/icons";

async function renderIcon(props: Record<string, unknown>): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(Icon, { props });
}

const names: IconName[] = [
  "arrow-left",
  "arrow-right",
  "arrow-up-right",
  "book-open",
  "code",
  "download",
  "maximize-2",
];

describe("Icon", () => {
  it.each(names)("renders every path of %s hidden from assistive technology", async (name) => {
    const html = await renderIcon({ name, size: 18 });

    expect(html).toMatch(/^<svg[^>]*aria-hidden="true"/);
    expect(html).toContain('width="18" height="18" viewBox="0 0 24 24"');
    expect(html).toContain('stroke="currentColor"');
    expect(html.match(/<path /g)).toHaveLength(icons[name].length);
    for (const path of icons[name]) {
      expect(html).toContain(`<path d="${path}"></path>`);
    }
  });

  it("adds the caller's classes only when given", async () => {
    expect(await renderIcon({ name: "code", size: 20, class: "text-brand" })).toContain(
      'class="text-brand"',
    );
    expect(await renderIcon({ name: "code", size: 20 })).not.toContain("class=");
  });

  it("covers every icon in the set", () => {
    expect(Object.keys(icons).sort()).toEqual(names);
  });
});
