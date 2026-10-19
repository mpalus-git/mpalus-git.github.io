import { expect, test } from "@playwright/test";
import { newPageContext, sitePages } from "./support";

for (const path of sitePages) {
  test(`binds single-letter words to the next word on ${path}`, async ({ browser }) => {
    const context = await newPageContext(browser, path);
    const page = await context.newPage();
    await page.goto(path);

    const unbound = await page.evaluate(() => {
      const found: string[] = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const text = node.textContent ?? "";
        if (node.parentElement?.closest("script, style") === null) {
          for (const match of text.matchAll(/(?<=^|[\s(„"])[aiouwz][ \t\r\n]+(?=\S)/giu)) {
            found.push(text.slice(Math.max(0, match.index - 20), match.index + 20));
          }
        }
      }
      return found;
    });

    expect(unbound).toEqual([]);
    await context.close();
  });
}
