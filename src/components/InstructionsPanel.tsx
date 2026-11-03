import { useMemo } from "react";
import { useFitText } from "../hooks/useFitText";
import { useMediaQuery } from "../hooks/useScreen";
import { STAGE_QUERY } from "../lib/layout";
import { hasVisibleText, sanitizeInstructions } from "../lib/sanitize";
import type { Settings } from "../lib/settings";
import "./InstructionsPanel.scss";

export function InstructionsPanel({ settings }: { settings: Settings }) {
  const html = useMemo(() => sanitizeInstructions(settings.instructionsHtml), [settings.instructionsHtml]);
  const empty = !hasVisibleText(html);
  // Fill the panel on large screens; on small screens let the page scroll instead.
  const large = useMediaQuery(STAGE_QUERY);
  const { boxRef, contentRef } = useFitText<HTMLDivElement, HTMLDivElement>({ min: 16, max: 88, enabled: large && !empty }, [html, settings.appearance.bodyFont, settings.appearance.headingFont]);

  const course = [settings.session.courseNumber, settings.session.courseTitle].filter(Boolean).join(" · ");
  const title = settings.session.title.trim() || "Instructions";

  return (
    <section className="erc-panel erc-instructions" aria-labelledby="instructions-title">
      <header className="erc-panel__header">
        <h1 id="instructions-title" className="erc-panel__title">{title}</h1>
        {course && <p className="erc-instructions__course">{course}</p>}
      </header>
      <div ref={boxRef} className="erc-instructions__box">
        {empty ? (
          <p className="erc-instructions__empty">No instructions yet. Open Setup to add them.</p>
        ) : (
          <div ref={contentRef} className="erc-rich" dangerouslySetInnerHTML={{ __html: html }} />
        )}
      </div>
    </section>
  );
}
