import { describe, expect, it, vi } from "vitest";
import { checkLink, findExternalLinks } from "./check-external-links.mjs";

const origin = "https://mpalus-git.github.io";

describe("findExternalLinks", () => {
  it("returns unique links to other sites with decoded ampersands", () => {
    const html = [
      '<a href="https://github.com/mpalus-git" target="_blank">',
      '<a class="x" href="https://example.com/?a=1&amp;b=2">',
      '<a href="https://github.com/mpalus-git">',
      '<a href="https://mpalus-git.github.io/en/">',
      '<a href="/fixflow-api/">',
      '<link rel="preconnect" href="https://fixflow-api-us2p.onrender.com">',
    ].join("");

    expect([...findExternalLinks(html, origin)]).toEqual([
      "https://github.com/mpalus-git",
      "https://example.com/?a=1&b=2",
    ]);
  });
});

describe("checkLink", () => {
  it("accepts a successful response after redirects", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response("", { status: 200 }));

    expect(await checkLink("https://example.com/", fetchImpl)).toBeNull();
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl.mock.calls[0][1]).toMatchObject({ redirect: "follow" });
  });

  it("retries once, for example while a sleeping server starts", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(new Response("", { status: 503 }))
      .mockResolvedValueOnce(new Response("", { status: 200 }));

    expect(await checkLink("https://example.com/", fetchImpl)).toBeNull();
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("reports the status of a link that keeps failing", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response("", { status: 404 }));

    expect(await checkLink("https://example.com/", fetchImpl)).toBe("HTTP 404");
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("reports network errors instead of throwing", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new TypeError("fetch failed"));

    expect(await checkLink("https://example.com/", fetchImpl)).toBe("fetch failed");
  });
});
