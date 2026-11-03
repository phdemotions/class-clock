/**
 * Renders a time string with every digit in a fixed-width box (1ch, the width of "0"),
 * so the clock never shifts sideways as digits change, whatever font is chosen.
 * Screen readers get the plain text.
 */
export function Digits({ text }: { text: string }) {
  return (
    <>
      <span className="cds--visually-hidden">{text}</span>
      <span aria-hidden="true">
        {[...text].map((ch, i) =>
          /\d/.test(ch) ? <span key={i} className="erc-digit">{ch}</span> : <span key={i} className="erc-sep">{ch}</span>,
        )}
      </span>
    </>
  );
}
