import DOMPurify from "dompurify";
import { fontByStack } from "./fonts";

/**
 * Instructions are stored and shown as HTML. Only simple formatting survives:
 * no scripts, links, images, classes or arbitrary styles.
 */
const ALLOWED_TAGS = ["p", "br", "strong", "b", "em", "i", "u", "s", "h2", "h3", "ul", "ol", "li", "span", "mark"];
const COLOR = /^(#[0-9a-f]{3,8}|rgba?\(\s*[\d.\s,%]+\)|var\(--erc-ink-(yellow|red|green|blue|purple)\))$/i;
const SIZE = /^(0?\.\d+|[1-3](\.\d+)?)(em|rem)$/;

function cleanStyle(style: string): string {
  const kept: string[] = [];
  for (const rule of style.split(";")) {
    const [rawProp, ...rest] = rule.split(":");
    const prop = rawProp?.trim().toLowerCase();
    const value = rest.join(":").trim();
    if (!prop || !value) continue;
    if (prop === "color" && COLOR.test(value)) kept.push(`color: ${value}`);
    if (prop === "font-size" && SIZE.test(value)) kept.push(`font-size: ${value}`);
    if (prop === "font-family") {
      const font = fontByStack(value);
      if (font) kept.push(`font-family: ${font.stack}`);
    }
  }
  return kept.join("; ");
}

let hooked = false;
function ensureHook() {
  if (hooked) return;
  DOMPurify.addHook("uponSanitizeAttribute", (_node, data) => {
    if (data.attrName === "style") {
      data.attrValue = cleanStyle(data.attrValue);
      if (!data.attrValue) data.keepAttr = false;
    }
  });
  hooked = true;
}

export function sanitizeInstructions(html: string): string {
  ensureHook();
  return DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR: ["style"] });
}

export function hasVisibleText(html: string): boolean {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return (doc.body.textContent ?? "").trim().length > 0;
}
