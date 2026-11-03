import { ProgressBar } from "@carbon/react";
import { CheckmarkFilled, ErrorFilled, Time, WarningAltFilled, WarningFilled } from "@carbon/icons-react";
import { useLayoutEffect, useRef } from "react";
import type { Settings } from "../lib/settings";
import { examPhase, examWindow, formatClock, formatClockText, formatDuration, progress, type Phase } from "../lib/time";
import "./ClockPanel.scss";

const STATUS: Record<Phase, { text: string; Icon: typeof Time }> = {
  before: { text: "Not started", Icon: Time },
  running: { text: "In progress", Icon: CheckmarkFilled },
  warn30: { text: "30 minutes left", Icon: WarningAltFilled },
  warn10: { text: "10 minutes left", Icon: WarningFilled },
  warn5: { text: "5 minutes left", Icon: ErrorFilled },
  ended: { text: "Time is up", Icon: ErrorFilled },
};

export function ClockPanel({ settings, now }: { settings: Settings; now: Date }) {
  const { start, end, use24h } = settings.exam;
  const win = examWindow(start, end, now);
  const phase = examPhase(win, now);
  const { text, Icon } = STATUS[phase];
  const clock = formatClock(now, use24h, true);
  const startText = formatClockText(win.start, use24h);
  const endText = formatClockText(win.end, use24h);

  const big = phase === "before" ? formatDuration(win.start.getTime() - now.getTime())
    : phase === "ended" ? "Time is up"
    : formatDuration(win.end.getTime() - now.getTime());

  // Shrink the big number if a wide font would push it past the column.
  const bigRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = bigRef.current;
    if (!el) return;
    el.style.fontSize = "";
    for (let i = 0; i < 40 && el.scrollWidth > el.clientWidth + 1; i++) {
      el.style.fontSize = `${parseFloat(getComputedStyle(el).fontSize) * 0.95}px`;
    }
  }, [big.length, settings.appearance.clockFont]);

  return (
    <section className={`erc-clock is-${phase}`} aria-labelledby="clock-label">
      <p className="erc-clock__status">
        <Icon size={20} aria-hidden="true" />
        <span>{text}</span>
      </p>

      <div>
        <h2 id="clock-label" className="erc-clock__label">
          {phase === "before" ? "Exam begins in" : phase === "ended" ? "Exam over" : "Time remaining"}
        </h2>
        <div ref={bigRef} className={`erc-clock__remaining${phase === "ended" ? " is-message" : ""}`}>{big}</div>
        <p className="erc-clock__sub">
          {phase === "before" && <>Starts at <strong>{startText}</strong> · ends at <strong>{endText}</strong></>}
          {phase === "ended" && <><strong>Stop writing.</strong> Close your booklet and stay seated.</>}
          {phase !== "before" && phase !== "ended" && <>Exam ends at <strong>{endText}</strong></>}
        </p>
      </div>

      <ProgressBar
        className="erc-clock__progress"
        label="Exam progress"
        hideLabel
        value={Math.round(progress(win, now) * 100)}
        max={100}
        size="big"
        status={phase === "ended" ? "error" : "active"}
        helperText={`${phase === "before" ? "Starts" : "Started"} ${startText} · Ends ${endText}`}
      />

      <div className="erc-clock__now">
        <h2 className="erc-clock__label">Current time</h2>
        <p>
          <time className="erc-clock__time" dateTime={now.toISOString()}>
            {clock.time}
            {clock.period && <span className="erc-clock__period">{clock.period}</span>}
          </time>
          <span className="erc-clock__date">
            {now.toLocaleDateString("en-CA", { weekday: "long", month: "long", day: "numeric" })}
          </span>
        </p>
      </div>

      {/* Screen readers hear phase changes only, not every second. */}
      <p className="cds--visually-hidden" aria-live="polite">{phase === "running" ? "" : text}</p>
    </section>
  );
}
