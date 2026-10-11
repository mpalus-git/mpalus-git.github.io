import type { BrowserContext, Page, Request, Route } from "@playwright/test";

export const apiReadyPattern = "**/api/v1/system/ready";

export async function mockApi(
  context: BrowserContext,
  handler: (route: Route) => Promise<void> = (route) => route.fulfill({ status: 200, body: "" }),
): Promise<Request[]> {
  const requests: Request[] = [];
  await context.route(apiReadyPattern, async (route) => {
    requests.push(route.request());
    await handler(route);
  });
  return requests;
}

export function trackErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") {
      errors.push(message.text());
    }
  });
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}
