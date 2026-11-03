import { addMinutes, durationMinutes, examPhase, examWindow, formatClock, formatDuration, parseHM, progress } from "./time";

const at = (h: number, m: number, s = 0) => new Date(2026, 10, 3, h, m, s);

describe("parseHM", () => {
  it("accepts valid times and rejects others", () => {
    expect(parseHM("09:05")).toEqual({ hours: 9, minutes: 5 });
    expect(parseHM("24:00")).toBeNull();
    expect(parseHM("9am")).toBeNull();
  });
});

describe("examWindow", () => {
  it("uses today's date", () => {
    const w = examWindow("09:00", "11:00", at(8, 0));
    expect(w.start).toEqual(at(9, 0));
    expect(w.end).toEqual(at(11, 0));
  });
  it("handles exams that run past midnight", () => {
    const w = examWindow("23:00", "01:00", at(23, 30));
    expect(w.end.getTime() - w.start.getTime()).toBe(2 * 3600_000);
    const afterMidnight = examWindow("23:00", "01:00", new Date(2026, 10, 4, 0, 15));
    expect(examPhase(afterMidnight, new Date(2026, 10, 4, 0, 15))).toBe("running");
  });
});

describe("examPhase", () => {
  const w = examWindow("09:00", "11:00", at(9, 0));
  it.each([
    [at(8, 59), "before"],
    [at(9, 0), "running"],
    [at(10, 30), "warn30"],
    [at(10, 50), "warn10"],
    [at(10, 55), "warn5"],
    [at(11, 0), "ended"],
  ] as const)("at %s is %s", (now, phase) => {
    expect(examPhase(w, now)).toBe(phase);
  });
  it("reports progress", () => {
    expect(progress(w, at(10, 0))).toBeCloseTo(0.5);
    expect(progress(w, at(12, 0))).toBe(1);
  });
});

describe("formatting", () => {
  it("formats durations", () => {
    expect(formatDuration(3_725_000)).toBe("1:02:05");
    expect(formatDuration(65_000)).toBe("01:05");
    expect(formatDuration(-1)).toBe("00:00");
    expect(formatDuration(400)).toBe("00:01");
  });
  it("formats clock times", () => {
    expect(formatClock(at(15, 4, 9), false, true)).toEqual({ time: "3:04:09", period: "PM" });
    expect(formatClock(at(0, 4), false, false)).toEqual({ time: "12:04", period: "AM" });
    expect(formatClock(at(15, 4), true, false)).toEqual({ time: "15:04", period: "" });
  });
  it("adds minutes and measures length", () => {
    expect(addMinutes("23:30", 90)).toBe("01:00");
    expect(durationMinutes("23:00", "01:00")).toBe(120);
  });
});
