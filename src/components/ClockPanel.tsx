import { CheckmarkFilled, ErrorFilled, Hourglass, Time, WarningAltFilled, WarningFilled } from "@carbon/icons-react";
import { useLayoutEffect, useRef, type CSSProperties } from "react";
import { useDigitWidth } from "../hooks/useDigitWidth";
import { fontById } from "../lib/fonts";
import type { Settings } from "../lib/settings";
import { formatClock, formatClockText, formatDuration, progress, sessionPhase, sessionWindow, type Phase } from "../lib/time";
import { Digits } from "./Digits";
import "./ClockPanel.scss";

const STATUS: Record<Phase, { text: string; Icon: typeof Time }> = {
  before: { text: "Not started", Icon: Time },
  running: { text: "In progress", Icon: CheckmarkFilled },
  warn30: { text: "30 min left", Icon: WarningAltFilled },
  warn10: { text: "10 min left", Icon: WarningFilled },
  warn5: { text: "5 min left", Icon: Hourglass },
  ended: { text: "Ended", Icon: ErrorFilled },
};

export function ClockPanel({ settings, now }: { settings: Settings; now: Date }) {
  const { start, end, use24h } = settings.session;
  const win = sessionWindow(start, end, now);
  const phase = sessionPhase(win, now);
  const { text, Icon } = STATUS[phase];
  const clock = formatClock(now, use24h, true);
  const startText = formatClockText(win.start, use24h);
  const endText = formatClockText(win.end, use24h);
  const pct = Math.round(progress(win, now) * 100);

  const big = phase === "before" ? formatDuration(win.start.getTime() - now.getTime())
    : phase === "ended" ? "Time is up"
    : formatDuration(win.end.getTime() - now.getTime());

  const digitWidth = useDigitWidth(fontById(settings.appearance.clockFont).stack);

  // Shrink the big number if it would run past the panel (wide fonts, narrow screens).
  const bigRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = bigRef.current;
    if (!el) return;
    const fit = () => {
      el.style.removeProperty("font-size");
      for (let i = 0; i < 40 && el.scrollWidth > el.clientWidth + 1; i++) {
        el.style.fontSize = `${parseFloat(getComputedStyle(el).fontSize) * 0.95}px`;
      }
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(el);
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
        <p className="erc-clock__status">
          <Icon size={32} aria-hidden="true" />
          <span>{text}</span>
        </p>
      </header>

      <div className="erc-clock__body">
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

      <div className="erc-clock__now">
        <h2 className="cds--visually-hidden">Current time</h2>
        <time className="erc-clock__time" dateTime={now.toISOString()}>
          <Digits text={clock.time} />
          {clock.period && <span className="erc-clock__period">{clock.period}</span>}
        </time>
        <span className="erc-clock__date">
          {now.toLocaleDateString("en-CA", { weekday: "long", month: "long", day: "numeric" })}
        </span>
      </div>

      {/* Screen readers hear phase changes only, not every second. */}
      <p className="cds--visually-hidden" aria-live="polite">{phase === "running" ? "" : phase === "ended" ? "Time is up" : text}</p>
    </section>
  );
}
