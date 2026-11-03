import { useMemo } from "react";
import { useFitText } from "../hooks/useFitText";
import { useMediaQuery } from "../hooks/useScreen";
import { hasVisibleText, sanitizeInstructions } from "../lib/sanitize";
import type { Settings } from "../lib/settings";
import "./InstructionsPanel.scss";

export function InstructionsPanel({ settings }: { settings: Settings }) {
  const html = useMemo(() => sanitizeInstructions(settings.instructionsHtml), [settings.instructionsHtml]);
  const empty = !hasVisibleText(html);
  // Fill the panel on large screens; on small screens let the page scroll instead.
  const large = useMediaQuery("(min-width: 66rem)");
  const { boxRef, contentRef } = useFitText<HTMLDivElement, HTMLDivElement>({ min: 16, max: 88, enabled: large && !empty }, [html, settings.appearance.bodyFont, settings.appearance.headingFont]);

  const course = [settings.exam.courseNumber, settings.exam.examName].filter(Boolean).join(" · ");

  return (
    <section className="erc-instructions" aria-labelledby="instructions-title">
      <header className="erc-instructions__header">
        <h1 id="instructions-title">Exam instructions</h1>
        {course && <p>{course}</p>}
      </header>
      <div ref={boxRef} className="erc-instructions__box">
        {empty ? (
          <p className="erc-instructions__empty">No instructions yet. Open “Set up exam” to add them.</p>
        ) : (
          <div ref={contentRef} className="erc-rich" dangerouslySetInnerHTML={{ __html: html }} />
        )}
      </div>
    </section>
  );
}
