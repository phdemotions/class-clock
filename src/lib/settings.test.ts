import { defaultSettings, loadSettings, saveSettings, settingsSchema, STORAGE_KEY } from "./settings";

function memoryStorage() {
  const map = new Map<string, string>();
  return { getItem: (k: string) => map.get(k) ?? null, setItem: (k: string, v: string) => void map.set(k, v), map };
}

describe("settings", () => {
  it("defaults are valid and use U of G fonts", () => {
    const s = defaultSettings(new Date(2026, 10, 3, 9, 20));
    expect(settingsSchema.safeParse(s).success).toBe(true);
    expect(s.exam.start).toBe("09:00");
    expect(s.exam.end).toBe("11:00");
    expect(s.appearance.headingFont).toBe("russo-one");
    expect(s.appearance.bodyFont).toBe("dm-sans");
  });
  it("round-trips through storage", () => {
    const store = memoryStorage();
    const s = { ...defaultSettings(), isExample: false };
    s.exam.courseNumber = "MKTG*2000";
    expect(saveSettings(s, store)).toBe(true);
    expect(loadSettings(store).exam.courseNumber).toBe("MKTG*2000");
  });
  it("falls back to defaults on bad data", () => {
    const store = memoryStorage();
    store.map.set(STORAGE_KEY, "{not json");
    expect(loadSettings(store).isExample).toBe(true);
    store.map.set(STORAGE_KEY, JSON.stringify({ version: 99 }));
    expect(loadSettings(store).isExample).toBe(true);
  });
});
