import { Fragment, type CSSProperties, type ReactNode } from "react";
import type { Settings } from "../lib/settings";
import "./BookletCover.scss";

/**
 * The top of the printed U of G examination booklet cover (the booklet keeps its printed title), redrawn so students
 * can see what goes on each line. Positions are measured from the printed cover
 * in percent of page width, so the drawing scales with its container.
 *
 * Blue "pen" text: copy exactly. Orange notes: the student's own details.
 */
type Ink = { kind: "copy"; text: string } | { kind: "note"; text: string };

interface Line {
  id: string;
  x1: number;
  x2: number;
  y: number;
  label?: string;
  sideLabel?: { text: string; x: number };
  center?: boolean;
  ink: Ink;
}

function lines(s: Settings): Line[] {
  const { session, booklet } = s;
  return [
    { id: "row", x1: 69.2, x2: 81.4, y: 21.4, label: "Row", center: true, ink: { kind: "note", text: "your row" } },
    { id: "seat", x1: 85, x2: 97.3, y: 21.4, label: "Seat", center: true, ink: { kind: "note", text: "your seat" } },
    { id: "surname", x1: 3.6, x2: 40.8, y: 27.9, label: "Surname", center: true, ink: { kind: "note", text: "your last name" } },
    { id: "given", x1: 43.2, x2: 80.6, y: 27.9, label: "Preferred Given Name", center: true, ink: { kind: "note", text: "your first name" } },
    { id: "initials", x1: 83, x2: 97.1, y: 27.9, label: "Initials", center: true, ink: { kind: "note", text: "e.g. A.L." } },
    { id: "date", x1: 56, x2: 97.1, y: 35, label: "Date", ink: { kind: "copy", text: session.dateText } },
    { id: "course-number", x1: 9.6, x2: 53.4, y: 40.9, label: "Course Number", center: true, sideLabel: { text: "Subject", x: 3.6 }, ink: { kind: "copy", text: session.courseNumber } },
    { id: "course-title", x1: 57.6, x2: 96.9, y: 40.9, label: "Course Title", center: true, ink: { kind: "copy", text: session.courseTitle } },
    { id: "instructor", x1: 11.6, x2: 55.5, y: 49.4, sideLabel: { text: "Instructor", x: 3.6 }, ink: { kind: "copy", text: session.instructor } },
    {
      id: "book-number", x1: 14.6, x2: 55.5, y: 54.9, sideLabel: { text: "Book Number", x: 3.6 },
      ink: { kind: booklet.bookNumberStyle === "copy" ? "copy" : "note", text: booklet.bookNumberText },
    },
    { id: "total-books", x1: 26.2, x2: 55.5, y: 60.5, sideLabel: { text: "Total Number of Books Used", x: 3.6 }, ink: { kind: "note", text: "fill in at the end" } },
  ];
}

const pos = (left: number, top: number, width?: number): CSSProperties => ({
  left: `${left}cqw`,
  top: `calc(${top} * var(--u))`,
  ...(width !== undefined ? { width: `${width}cqw` } : {}),
});

function InkText({ ink, width }: { ink: Ink; width: number }): ReactNode {
  // Long text gets a smaller size so it stays on its line.
  const long = ink.text.length > (ink.kind === "copy" ? width * 0.55 : width * 0.75);
  return (
    <span className={`erc-booklet__${ink.kind === "copy" ? "pen" : "note"}${long ? " is-long" : ""}`}>
      {ink.kind === "note" && <span aria-hidden="true">✎ </span>}
      {ink.text || " "}
    </span>
  );
}

export function BookletCover({ settings }: { settings: Settings }) {
  const { session } = settings;
  return (
    <figure className="erc-booklet" aria-labelledby="booklet-caption">
      <figcaption id="booklet-caption" className="cds--visually-hidden">
        How to fill in the front of your booklet
      </figcaption>
      <div className="erc-booklet__page">
        <div className="erc-booklet__paper">
          <div className="erc-booklet__header" style={pos(17.4, 4.4, 34)}>
            <div className="erc-booklet__course">{session.courseNumber}</div>
            <div className="erc-booklet__exam-name">{session.title}</div>
          </div>
          <div className="erc-booklet__title" style={pos(15.8, 17.1)}>Examination Booklet</div>

          {lines(settings).map((l) => (
            <Fragment key={l.id}>
              {l.sideLabel && (
                <span className="erc-booklet__side-label" style={pos(l.sideLabel.x, l.y - 2.2)}>
                  {l.sideLabel.text}
                </span>
              )}
              <div className={`erc-booklet__line${l.center ? " is-center" : ""}`} style={pos(l.x1, l.y - 4.6, l.x2 - l.x1)}>
                <InkText ink={l.ink} width={l.x2 - l.x1} />
                {l.label && <span className="erc-booklet__label">{l.label}</span>}
              </div>
            </Fragment>
          ))}

          <div className="erc-booklet__id-boxes" style={pos(3.6, 32.1, 44)}>
            {Array.from({ length: 9 }, (_, i) => (
              <span key={i} aria-hidden="true" />
            ))}
            <span className="erc-booklet__note erc-booklet__id-note">
              <span className="erc-booklet__id-note-text"><span aria-hidden="true">✎ </span>your student ID</span>
            </span>
          </div>
          <span className="erc-booklet__label erc-booklet__label--free" style={pos(3.6, 35.6)}>I.D. Number</span>

          <div className="erc-booklet__key" style={{ ...pos(3.6, 63.2), right: "3cqw" }}>
            <span>
              <span className="erc-booklet__pen">Blue</span> copy exactly as shown
            </span>
            <span>
              <span className="erc-booklet__note">✎ Orange</span> your own details, printed clearly
            </span>
          </div>
        </div>
      </div>
    </figure>
  );
}
