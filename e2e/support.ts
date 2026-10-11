import type {
  Browser,
  BrowserContextOptions,
  BrowserContext,
  Page,
  Request,
  Route,
} from "@playwright/test";

export const sitePages = [
  "/",
  "/en/",
  "/fixflow-api/",
  "/fixflow-web/",
  "/fixflow-mobile/",
  "/en/fixflow-api/",
  "/en/fixflow-web/",
  "/en/fixflow-mobile/",
  "/404.html",
  "/en/404/",
];

export function localeFor(path: string): string {
  return path.startsWith("/en/") ? "en-US" : "pl-PL";
}

export async function newPageContext(
  browser: Browser,
  path: string,
  options: BrowserContextOptions = {},
): Promise<BrowserContext> {
  const context = await browser.newContext({ locale: localeFor(path), ...options });
  await mockApi(context);
  return context;
}

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
