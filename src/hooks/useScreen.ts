import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

/** Keeps the screen awake while the page is visible (where the browser allows it). */
export function useWakeLock() {
  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    const request = async () => {
      try {
        if ("wakeLock" in navigator && document.visibilityState === "visible") {
          lock = await navigator.wakeLock.request("screen");
        }
      } catch {
        // Not allowed here (e.g. battery saver). The clock still works.
      }
    };
    void request();
    document.addEventListener("visibilitychange", request);
    return () => {
      document.removeEventListener("visibilitychange", request);
      void lock?.release().catch(() => undefined);
    };
  }, []);
}

export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(() => Boolean(document.fullscreenElement));
  const supported = typeof document.documentElement.requestFullscreen === "function";
  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);
  const toggle = useCallback(async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      // Refused by the browser; nothing else to do.
    }
  }, []);
  return { isFullscreen, supported, toggle };
}

/** True after the pointer and keyboard have been still for `ms`. Used to fade out controls. */
export function useIdle(ms = 4000): boolean {
  const [idle, setIdle] = useState(false);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const wake = () => {
      setIdle(false);
      clearTimeout(timer);
      timer = setTimeout(() => setIdle(true), ms);
    };
    const events = ["pointermove", "pointerdown", "keydown", "focusin", "touchstart"] as const;
    events.forEach((e) => window.addEventListener(e, wake, { passive: true }));
    wake();
    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, wake));
    };
  }, [ms]);
  return idle;
}

/** Live result of a CSS media query. */
export function useMediaQuery(query: string, fallback = false): boolean {
  const subscribe = useCallback(
    (notify: () => void) => {
      const mql = window.matchMedia?.(query);
      mql?.addEventListener("change", notify);
      return () => mql?.removeEventListener("change", notify);
    },
    [query],
  );
  return useSyncExternalStore(subscribe, () => window.matchMedia?.(query).matches ?? fallback, () => fallback);
}

/** Whether the operating system is set to dark mode. */
export const usePrefersDark = () => useMediaQuery("(prefers-color-scheme: dark)", true);
