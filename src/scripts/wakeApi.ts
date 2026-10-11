import { apiReadyUrl } from "@/config";

type StorageLike = Pick<Storage, "getItem" | "setItem">;

type ClosestTarget = {
  closest(selector: string): unknown;
};

export type WakeDependencies = {
  url: string;
  fetch: (url: string, init: RequestInit) => Promise<unknown>;
  now: () => number;
  storage: () => StorageLike;
  isOnline: () => boolean;
};

type WakeEvent = { target: unknown };

export type WakeEnvironment = {
  readonly sessionStorage: StorageLike;
  fetch: (url: string, init: RequestInit) => Promise<unknown>;
  navigator: { onLine: boolean };
  document: {
    visibilityState: string;
    addEventListener(
      type: "visibilitychange" | "pointerenter" | "focusin",
      listener: (event: WakeEvent) => void,
      options?: { capture: boolean },
    ): void;
  };
};

export const wakeIntervalMs = 5 * 60 * 1000;

export const wakeStorageKey = "portfolio-api-wake";

export const demoLinkSelector = "[data-demo-link]";

export function createApiWaker(dependencies: WakeDependencies): () => void {
  let lastWakeInMemory: number | null = null;

  const readLastWake = (): number | null => {
    try {
      const value = Number(dependencies.storage().getItem(wakeStorageKey));
      return value > 0 ? value : null;
    } catch {
      return null;
    }
  };

  const saveLastWake = (time: number): void => {
    try {
      dependencies.storage().setItem(wakeStorageKey, String(time));
    } catch {
      return;
    }
  };

  return () => {
    try {
      if (!dependencies.isOnline()) {
        return;
      }
      const now = dependencies.now();
      const lastWake = Math.max(readLastWake() ?? 0, lastWakeInMemory ?? 0);
      if (lastWake > 0 && lastWake <= now && now - lastWake <= wakeIntervalMs) {
        return;
      }
      lastWakeInMemory = now;
      saveLastWake(now);
      dependencies
        .fetch(dependencies.url, {
          mode: "no-cors",
          credentials: "omit",
          cache: "no-store",
          keepalive: true,
        })
        .catch(() => undefined);
    } catch {
      return;
    }
  };
}

const isClosestTarget = (value: unknown): value is ClosestTarget =>
  typeof value === "object" &&
  value !== null &&
  "closest" in value &&
  typeof value.closest === "function";

export function startApiWake(environment: WakeEnvironment, url: string = apiReadyUrl): void {
  try {
    const wake = createApiWaker({
      url,
      fetch: (target, init) => environment.fetch(target, init),
      now: () => Date.now(),
      storage: () => environment.sessionStorage,
      isOnline: () => environment.navigator.onLine,
    });
    const wakeFromDemoLink = (event: WakeEvent): void => {
      if (isClosestTarget(event.target) && event.target.closest(demoLinkSelector)) {
        wake();
      }
    };
    const { document } = environment;

    wake();
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        wake();
      }
    });
    document.addEventListener("pointerenter", wakeFromDemoLink, { capture: true });
    document.addEventListener("focusin", wakeFromDemoLink, { capture: true });
  } catch {
    return;
  }
}
