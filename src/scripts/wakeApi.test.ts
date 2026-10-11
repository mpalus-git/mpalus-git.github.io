import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiReadyUrl } from "@/config";
import {
  createApiWaker,
  startApiWake,
  wakeIntervalMs,
  wakeStorageKey,
  type WakeDependencies,
  type WakeEnvironment,
} from "@/scripts/wakeApi";

const url = "https://api.example.com/api/v1/system/ready";

function createStorage(store: Map<string, string> | "blocked") {
  return () => {
    if (store === "blocked") {
      throw new Error("SecurityError");
    }
    return {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
    };
  };
}

function createDependencies(overrides: Partial<WakeDependencies> = {}) {
  let time = 1_000_000;
  const fetch = vi.fn<WakeDependencies["fetch"]>(() => Promise.resolve(undefined));
  const dependencies: WakeDependencies = {
    url,
    fetch,
    now: () => time,
    storage: createStorage(new Map()),
    isOnline: () => true,
    ...overrides,
  };
  const advance = (milliseconds: number) => {
    time += milliseconds;
  };
  return { dependencies, fetch, advance };
}

describe("createApiWaker", () => {
  it("calls the ready endpoint once with an opaque, cookie-less, uncached request", () => {
    const { dependencies, fetch } = createDependencies();

    createApiWaker(dependencies)();

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(url, {
      mode: "no-cors",
      credentials: "omit",
      cache: "no-store",
      keepalive: true,
    });
  });

  it("targets the ready endpoint of the API by default", () => {
    expect(apiReadyUrl).toBe("https://fixflow-api-us2p.onrender.com/api/v1/system/ready");
  });

  it("calls again only after more than five minutes", () => {
    const { dependencies, fetch, advance } = createDependencies();
    const wake = createApiWaker(dependencies);

    wake();
    advance(wakeIntervalMs);
    wake();
    expect(fetch).toHaveBeenCalledTimes(1);

    advance(1);
    wake();
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("shares the limit between pages of the same tab through sessionStorage", () => {
    const store = new Map<string, string>();
    const first = createDependencies({ storage: createStorage(store) });
    createApiWaker(first.dependencies)();
    const second = createDependencies({ storage: createStorage(store) });

    createApiWaker(second.dependencies)();

    expect(store.has(wakeStorageKey)).toBe(true);
    expect(first.fetch).toHaveBeenCalledTimes(1);
    expect(second.fetch).not.toHaveBeenCalled();
  });

  it("keeps the limit in memory when sessionStorage is unavailable", () => {
    const { dependencies, fetch, advance } = createDependencies({
      storage: createStorage("blocked"),
    });
    const wake = createApiWaker(dependencies);

    wake();
    advance(60_000);
    wake();

    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("ignores invalid or future timestamps", () => {
    const store = new Map([[wakeStorageKey, "not-a-number"]]);
    const invalid = createDependencies({ storage: createStorage(store) });
    createApiWaker(invalid.dependencies)();
    store.set(wakeStorageKey, String(Number.MAX_SAFE_INTEGER));
    const future = createDependencies({ storage: createStorage(store) });

    createApiWaker(future.dependencies)();

    expect(invalid.fetch).toHaveBeenCalledTimes(1);
    expect(future.fetch).toHaveBeenCalledTimes(1);
  });

  it("does not call while offline and calls once back online", () => {
    let online = false;
    const { dependencies, fetch } = createDependencies({ isOnline: () => online });
    const wake = createApiWaker(dependencies);

    wake();
    expect(fetch).not.toHaveBeenCalled();

    online = true;
    wake();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("swallows rejected requests without a trace", async () => {
    const consoleError = vi.spyOn(console, "error");
    const { dependencies } = createDependencies({
      fetch: () => Promise.reject(new TypeError("Failed to fetch")),
    });

    createApiWaker(dependencies)();
    await Promise.resolve();

    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("swallows errors thrown synchronously", () => {
    const { dependencies } = createDependencies({
      fetch: () => {
        throw new Error("Blocked by CSP");
      },
    });

    expect(() => {
      createApiWaker(dependencies)();
    }).not.toThrow();
  });
});

type Listener = (event: { target: unknown }) => void;

function createEnvironment() {
  const listeners = new Map<string, Listener[]>();
  const fetch = vi.fn<WakeEnvironment["fetch"]>(() => Promise.resolve(undefined));
  const environment: WakeEnvironment = {
    sessionStorage: createStorage(new Map())(),
    fetch,
    navigator: { onLine: true },
    document: {
      visibilityState: "visible",
      addEventListener: (type, listener) => {
        listeners.set(type, [...(listeners.get(type) ?? []), listener]);
      },
    },
  };
  const dispatch = (type: string, target: unknown = null) => {
    for (const listener of listeners.get(type) ?? []) {
      listener({ target });
    }
  };
  const element = (isDemoLink: boolean) => ({
    closest: (selector: string) => (isDemoLink && selector === "[data-demo-link]" ? {} : null),
  });
  return { environment, fetch, dispatch, element };
}

describe("startApiWake", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-11T10:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("wakes the API immediately after the page loads", () => {
    const { environment, fetch } = createEnvironment();

    startApiWake(environment);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0]?.[0]).toBe(apiReadyUrl);
  });

  it("wakes again when the tab becomes visible after more than five minutes", () => {
    const { environment, fetch, dispatch } = createEnvironment();
    startApiWake(environment);

    dispatch("visibilitychange");
    vi.advanceTimersByTime(wakeIntervalMs + 1);
    environment.document.visibilityState = "hidden";
    dispatch("visibilitychange");
    expect(fetch).toHaveBeenCalledTimes(1);

    environment.document.visibilityState = "visible";
    dispatch("visibilitychange");
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it.each(["pointerenter", "focusin"])(
    "wakes again on %s over a demo link after more than five minutes",
    (type) => {
      const { environment, fetch, dispatch, element } = createEnvironment();
      startApiWake(environment);
      vi.advanceTimersByTime(wakeIntervalMs + 1);

      dispatch(type, element(false));
      dispatch(type, null);
      expect(fetch).toHaveBeenCalledTimes(1);

      dispatch(type, element(true));
      expect(fetch).toHaveBeenCalledTimes(2);
    },
  );

  it("does not wake on a demo link within five minutes", () => {
    const { environment, fetch, dispatch, element } = createEnvironment();
    startApiWake(environment);
    vi.advanceTimersByTime(wakeIntervalMs - 1);

    dispatch("pointerenter", element(true));
    dispatch("focusin", element(true));

    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("does not wake while offline", () => {
    const { environment, fetch } = createEnvironment();
    environment.navigator.onLine = false;

    startApiWake(environment);

    expect(fetch).not.toHaveBeenCalled();
  });
});
