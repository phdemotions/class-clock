import { useLayoutEffect, useRef, type CSSProperties } from "react";
import { useDigitWidth } from "../hooks/useDigitWidth";
import { fontById } from "../lib/fonts";
import type { Settings } from "../lib/settings";
import { formatClockText, formatDuration, progress, sessionPhase, sessionWindow, type Phase } from "../lib/time";
import { Digits } from "./Digits";
import "./ClockPanel.scss";

// Read out to screen readers when the phase changes. On screen, the countdown's
// colour carries the warnings (yellow at 30 minutes, orange at 10, red at 5).
const ANNOUNCE: Record<Phase, string> = {
  before: "Not started",
  running: "",
  warn30: "Under 30 minutes left",
  warn10: "Under 10 minutes left",
  warn5: "Under 5 minutes left",
  ended: "Time is up",
};

export function ClockPanel({ settings, now }: { settings: Settings; now: Date }) {
  const { start, end, use24h } = settings.session;
  const win = sessionWindow(start, end, now);
  const phase = sessionPhase(win, now);
  const startText = formatClockText(win.start, use24h);
  const endText = formatClockText(win.end, use24h);
  const pct = Math.round(progress(win, now) * 100);

  const big = phase === "before" ? formatDuration(win.start.getTime() - now.getTime())
    : phase === "ended" ? "Time is up"
    : formatDuration(win.end.getTime() - now.getTime());

  const digitWidth = useDigitWidth(fontById(settings.appearance.clockFont).stack);

  // Start from the CSS size, then shrink the big number until it fits the panel's
  // width and height (wide fonts, short or narrow screens).
  const bodyRef = useRef<HTMLDivElement>(null);
  const bigRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = bigRef.current;
    const body = bodyRef.current;
    if (!el || !body) return;
    const fit = () => {
      el.style.removeProperty("font-size");
      // On one-screen layouts the body has a fixed height; elsewhere it grows and never overflows.
      const tooBig = () => el.scrollWidth > el.clientWidth + 1 || body.scrollHeight > body.clientHeight + 1;
      for (let i = 0; i < 40 && tooBig(); i++) {
        el.style.fontSize = `${parseFloat(getComputedStyle(el).fontSize) * 0.95}px`;
      }
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(body);
    return () => observer.disconnect();
  }, [big.length, digitWidth, settings.appearance.clockFont]);

  return (
    <section
      className={`erc-panel erc-clock is-${phase}`}
      aria-labelledby="clock-title"
      style={{ "--erc-digit-w": `${digitWidth}em` } as CSSProperties}
    >
      <header className="erc-panel__header">
        <h2 id="clock-title" className="erc-panel__title">{phase === "before" ? "Starts in" : phase === "ended" ? "Time" : "Time left"}</h2>
      </header>

      <div ref={bodyRef} className="erc-clock__body">
        <div ref={bigRef} className={`erc-clock__remaining${phase === "ended" ? " is-message" : ""}`}>
          {phase === "ended" ? <span>{big}</span> : <Digits text={big} />}
        </div>
        <div className="erc-clock__timeline">
          <div
            className="erc-clock__bar"
            role="progressbar"
            aria-label="Time used"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pct}
            aria-valuetext={`${pct}% of the time used`}
          >
            <span style={{ inlineSize: `${pct}%` }} />
          </div>
          {/* The closing message takes this row's place, so the panel keeps its height. */}
          {phase === "ended" ? (
            <p className="erc-clock__ends erc-clock__message"><span><strong>Stop writing.</strong> Close your booklet and stay seated.</span></p>
          ) : (
            <div className="erc-clock__ends">
              <span>{phase === "before" ? "Starts" : "Started"} {startText}</span>
              <span className="erc-clock__end">Ends <strong>{endText}</strong></span>
            </div>
          )}
        </div>
      </div>


      {/* Screen readers hear phase changes only, not every second. */}
      <p className="cds--visually-hidden" aria-live="polite">{ANNOUNCE[phase]}</p>
    </section>
  );
}
