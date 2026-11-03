import { hasVisibleText, sanitizeInstructions } from "./sanitize";

describe("sanitizeInstructions", () => {
  it("keeps simple formatting", () => {
    const html = "<h2>Rules</h2><p><strong>Pens</strong> <em>only</em> <u>please</u></p><ul><li>One</li></ul>";
    expect(sanitizeInstructions(html)).toBe(html);
  });
  it("removes scripts, handlers, links and images", () => {
    const out = sanitizeInstructions('<p onclick="x()">Hi<script>alert(1)</script><a href="http://x">link</a><img src=x onerror=alert(1)></p>');
    expect(out).toBe("<p>Hi" + "link</p>");
  });
  it("keeps only safe colours, sizes and known fonts", () => {
    const out = sanitizeInstructions(
      '<p><span style="color: #f1c21b; background: url(x); font-size: 1.5em; font-family: Merriweather, serif">a</span><span style="font-family: Comic Sans MS">b</span></p>',
    );
    expect(out).toContain("color: #f1c21b");
    expect(out).toContain("font-size: 1.5em");
    expect(out).toContain("font-family: Merriweather, Georgia, serif");
    expect(out).not.toContain("url(");
    expect(sanitizeInstructions('<span style="color: var(--erc-ink-red)">x</span>')).toContain("var(--erc-ink-red)");
    expect(sanitizeInstructions('<span style="color: var(--evil)">x</span>')).toBe("<span>x</span>");
    expect(out).toContain("<span>b</span>");
  });
  it("detects empty content", () => {
    expect(hasVisibleText("<p><br></p>")).toBe(false);
    expect(hasVisibleText("<p>Go</p>")).toBe(true);
  });
});
