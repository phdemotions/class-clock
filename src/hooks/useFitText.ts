import { useLayoutEffect, useRef } from "react";

/**
 * Picks the largest font size (in px) at which the content fits inside the box.
 * Re-runs when the box resizes, when fonts finish loading, or when `deps` change.
 * Attach `boxRef` to the fixed-size container and `contentRef` to the text inside it.
 */
export function useFitText<B extends HTMLElement, C extends HTMLElement>(
  { min = 14, max = 96, enabled = true }: { min?: number; max?: number; enabled?: boolean },
  deps: unknown[],
) {
  const boxRef = useRef<B>(null);
  const contentRef = useRef<C>(null);

  useLayoutEffect(() => {
    const boxEl = boxRef.current;
    const el = contentRef.current;
    if (!boxEl || !el) return;
    if (!enabled) {
      el.style.removeProperty("font-size");
      return;
    }
    const fit = () => {
      let lo = min;
      let hi = max;
      while (hi - lo > 0.5) {
        const mid = (lo + hi) / 2;
        el.style.fontSize = `${mid}px`;
        const fits = el.scrollHeight <= boxEl.clientHeight && el.scrollWidth <= boxEl.clientWidth;
        if (fits) lo = mid;
        else hi = mid;
      }
      el.style.fontSize = `${Math.floor(lo)}px`;
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(boxEl);
    let cancelled = false;
    void document.fonts?.ready.then(() => !cancelled && fit());
    return () => {
      cancelled = true;
      observer.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, min, max, ...deps]);

  return { boxRef, contentRef };
}
