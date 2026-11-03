import { useEffect, useState } from "react";

/**
 * Width (in em) of a digit cell for the given font: the widest of 2–9.
 * Most fonts draw these at one width even without tabular figures; "1" and "0"
 * are centred in the cell. This keeps clocks steady without loose spacing.
 */
export function useDigitWidth(fontStack: string): number {
  const [width, setWidth] = useState(0.6);
  useEffect(() => {
    let cancelled = false;
    const measure = () => {
      const ctx = document.createElement("canvas").getContext("2d");
      if (!ctx || cancelled) return;
      ctx.font = `700 100px ${fontStack}`;
      const widths = [..."23456789"].map((d) => ctx.measureText(d).width);
      const max = Math.max(...widths);
      if (Number.isFinite(max) && max > 0) setWidth(Math.round(max) / 100);
    };
    measure();
    void document.fonts?.ready.then(measure);
    return () => { cancelled = true; };
  }, [fontStack]);
  return width;
}
