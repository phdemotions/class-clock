import { z } from "zod";
import { FONT_OPTIONS, UOFG_FONTS } from "./fonts";
import { toHM } from "./time";

/**
 * Everything the instructor sets up. Stored in this browser's localStorage under
 * a versioned key; bump SETTINGS_VERSION and add a step to `migrate` when the
 * shape changes, so saved setups keep working after updates.
 */
export const SETTINGS_VERSION = 1;
export const STORAGE_KEY = "class-clock:settings";

const hm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM");
const fontId = z.enum(FONT_OPTIONS.map((f) => f.id) as [string, ...string[]]);

export const settingsSchema = z.object({
  version: z.literal(SETTINGS_VERSION),
  isExample: z.boolean(),
  session: z.object({
    courseNumber: z.string().max(40),
    courseTitle: z.string().max(120),
    instructor: z.string().max(80),
    dateText: z.string().max(60),
    title: z.string().max(80),
    start: hm,
    end: hm,
    use24h: z.boolean(),
  }),
  booklet: z.object({
    bookNumberText: z.string().max(60),
    bookNumberStyle: z.enum(["instruction", "copy"]),
  }),
  instructionsHtml: z.string().max(50_000),
  appearance: z.object({
    theme: z.enum(["dark", "light", "system"]),
    headingFont: fontId,
    bodyFont: fontId,
    clockFont: fontId,
  }),
});

export type Settings = z.infer<typeof settingsSchema>;
export type ThemeChoice = Settings["appearance"]["theme"];

export const EXAMPLE_INSTRUCTIONS =
  "<h3>Before you start</h3>" +
  "<p><strong>Fill in the front of your booklet now</strong>, as shown on the booklet cover.</p>" +
  "<ul><li><p>Write in pen and print clearly.</p></li><li><p>Phones off and in your bag, under your seat.</p></li>" +
  "<li><p>Only the materials listed on the question sheet are allowed.</p></li></ul>" +
  "<h3>While you write</h3>" +
  "<p>Need another booklet? Raise your hand.</p>" +
  "<p>Answer in the booklet, <u>not</u> on the question sheet.</p>" +
  "<h3>When time is up</h3>" +
  '<p><span style="color: var(--erc-ink-yellow)">Stop writing</span> and stay seated until booklets are collected.</p>';

export function defaultSettings(now = new Date()): Settings {
  const start = new Date(now);
  start.setMinutes(0, 0, 0);
  const end = new Date(start.getTime() + 2 * 3600_000);
  return {
    version: SETTINGS_VERSION,
    isExample: true,
    session: {
      courseNumber: "PSYC*3250",
      courseTitle: "Consumer Psychology",
      instructor: "Dr. A. Lee",
      dateText: now.toLocaleDateString("en-CA", { month: "long", day: "numeric", year: "numeric" }),
      title: "Reflection 3",
      start: toHM(start),
      end: toHM(end),
      use24h: false,
    },
    booklet: { bookNumberText: "1 on your first booklet, 2 on the next…", bookNumberStyle: "instruction" },
    instructionsHtml: EXAMPLE_INSTRUCTIONS,
    appearance: { theme: "dark", headingFont: UOFG_FONTS.heading, bodyFont: UOFG_FONTS.body, clockFont: UOFG_FONTS.clock },
  };
}

/** Upgrades older saved data. Add a case here for each future version. */
function migrate(raw: unknown): unknown {
  return raw;
}

export function loadSettings(storage: Pick<Storage, "getItem"> | undefined = safeStorage()): Settings {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    if (!raw) return defaultSettings();
    const parsed = settingsSchema.safeParse(migrate(JSON.parse(raw)));
    return parsed.success ? parsed.data : defaultSettings();
  } catch {
    return defaultSettings();
  }
}

export function saveSettings(settings: Settings, storage: Pick<Storage, "setItem"> | undefined = safeStorage()): boolean {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(settings));
    return Boolean(storage);
  } catch {
    return false;
  }
}

function safeStorage(): Storage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}
