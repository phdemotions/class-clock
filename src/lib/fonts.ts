/**
 * Fonts people can pick. All are bundled with the app (via Fontsource), so the
 * screen works offline and nothing is loaded from a third-party font host.
 */
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/dm-sans/wght-italic.css";
import "@fontsource/russo-one";
import "@fontsource/atkinson-hyperlegible/400.css";
import "@fontsource/atkinson-hyperlegible/700.css";
import "@fontsource/atkinson-hyperlegible/400-italic.css";
import "@fontsource-variable/lexend";
import "@fontsource-variable/roboto";
import "@fontsource-variable/open-sans";
import "@fontsource/merriweather/400.css";
import "@fontsource/merriweather/700.css";
import "@fontsource/merriweather/400-italic.css";
import "@fontsource-variable/source-serif-4";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/500.css";
import "@fontsource/ibm-plex-sans/600.css";
import "@fontsource/ibm-plex-sans/700.css";
import "@fontsource/ibm-plex-sans/400-italic.css";
// Booklet cover only: printed-form sans and a handwriting face.
import "@fontsource/arimo/400.css";
import "@fontsource/arimo/700.css";
import "@fontsource/arimo/400-italic.css";
import "@fontsource/kalam/700.css";

export interface FontOption {
  id: string;
  label: string;
  stack: string;
  note?: string;
}

export const FONT_OPTIONS: readonly FontOption[] = [
  { id: "dm-sans", label: "DM Sans", stack: '"DM Sans Variable", "DM Sans", Arial, sans-serif', note: "U of G text font" },
  { id: "russo-one", label: "Russo One", stack: '"Russo One", "Arial Black", Arial, sans-serif', note: "U of G heading font" },
  { id: "atkinson", label: "Atkinson Hyperlegible", stack: '"Atkinson Hyperlegible", Arial, sans-serif', note: "Designed for low vision" },
  { id: "lexend", label: "Lexend", stack: '"Lexend Variable", Lexend, Arial, sans-serif', note: "Designed for easier reading" },
  { id: "ibm-plex-sans", label: "IBM Plex Sans", stack: '"IBM Plex Sans", Arial, sans-serif', note: "even-width digits" },
  { id: "roboto", label: "Roboto", stack: '"Roboto Variable", Roboto, Arial, sans-serif' },
  { id: "open-sans", label: "Open Sans", stack: '"Open Sans Variable", "Open Sans", Arial, sans-serif' },
  { id: "merriweather", label: "Merriweather", stack: 'Merriweather, Georgia, serif' },
  { id: "source-serif", label: "Source Serif 4", stack: '"Source Serif 4 Variable", "Source Serif 4", Georgia, serif' },
  { id: "arial", label: "Arial", stack: "Arial, Helvetica, sans-serif" },
  { id: "verdana", label: "Verdana", stack: "Verdana, Geneva, sans-serif" },
  { id: "georgia", label: "Georgia", stack: 'Georgia, "Times New Roman", serif' },
];

/**
 * Defaults. Headings and text use the University of Guelph brand fonts. The clock uses
 * IBM Plex Sans because its digits all have the same width (DM Sans and Russo One draw
 * "1" much narrower than "0"), so the countdown stays steady and evenly spaced.
 */
export const UOFG_FONTS = { heading: "russo-one", body: "dm-sans", clock: "ibm-plex-sans" } as const;

export const fontById = (id: string): FontOption =>
  FONT_OPTIONS.find((f) => f.id === id) ?? (FONT_OPTIONS[0] as FontOption);

/** Font names the rich text editor may store, mapped back to an option. */
export const fontByStack = (stack: string): FontOption | undefined => {
  const first = stack.split(",")[0]?.replace(/["']/g, "").trim().toLowerCase();
  return FONT_OPTIONS.find((f) => f.stack.split(",")[0]?.replace(/["']/g, "").trim().toLowerCase() === first);
};
