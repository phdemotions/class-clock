import "@testing-library/jest-dom/vitest";

// jsdom gives Range no layout methods. ProseMirror measures a text Range in a
// 20 ms timer when the editor unmounts, so without these the "opens setup"
// test failed CI whenever that timer fired before the worker exited
// (flaky, 2026-11-22). Empty geometry is enough: nothing here asserts layout.
if (typeof Range !== "undefined") {
  Range.prototype.getClientRects ??= () => Object.assign([], { item: () => null }) as unknown as DOMRectList;
  Range.prototype.getBoundingClientRect ??= () => new DOMRect(0, 0, 0, 0);
}
