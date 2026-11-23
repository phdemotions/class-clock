import { useLayoutEffect, useRef } from "react";

/**
 * Picks the largest font size (in px) at which the content fits inside the box.
 * Re-runs when the box resizes, when fonts finish loading, or when `deps` change.
 * Attach `boxRef` to the fixed-size container and `contentRef` to the text inside it.
 * Space left over after the last whole font step is shared out between blocks
 * (as --erc-extra, at most half a line each), so the text reaches the bottom evenly.
 * If the text is still too tall at `min`, the box is marked `data-overflow` so it
 * can scroll: hidden instructions are worse than small ones.
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
      el.style.removeProperty("--erc-extra");
      delete boxEl.dataset.overflow;
      return;
    }
    const fit = () => {
      el.style.setProperty("--erc-extra", "0px");
      let lo = min;
      let hi = max;
      while (hi - lo > 0.5) {
        const mid = (lo + hi) / 2;
        el.style.fontSize = `${mid}px`;
        const fits = el.scrollHeight <= boxEl.clientHeight && el.scrollWidth <= boxEl.clientWidth;
        if (fits) lo = mid;
        else hi = mid;
      }
      const size = Math.floor(lo);
      el.style.fontSize = `${size}px`;
      const gaps = Math.max(1, el.children.length - 1);
      const spare = boxEl.clientHeight - el.scrollHeight;
      // Padding can stop margins collapsing (an empty paragraph, for one), so the
      // spacing can add more than it was given: measure, then take back the excess.
      let extra = Math.max(0, Math.min(spare / gaps, size * 0.5));
      el.style.setProperty("--erc-extra", `${extra}px`);
      for (let i = 0; i < 4 && extra > 0; i++) {
        const over = el.scrollHeight - boxEl.clientHeight;
        if (over <= 0) break;
        extra = Math.max(0, extra - over / gaps);
        el.style.setProperty("--erc-extra", `${extra}px`);
      }
      if (el.scrollHeight > boxEl.clientHeight) boxEl.dataset.overflow = "true";
      else delete boxEl.dataset.overflow;
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
