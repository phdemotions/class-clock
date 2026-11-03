import { TimePicker, TimePickerSelect, SelectItem } from "@carbon/react";
import { useState } from "react";

interface Props {
  id: string;
  label: string;
  /** "HH:MM", 24-hour. */
  value: string;
  use24h: boolean;
  invalidText?: string;
  onChange: (hm: string) => void;
}

const to12 = (hm: string) => {
  const [h = 0, m = 0] = hm.split(":").map(Number);
  return { text: `${h % 12 || 12}:${String(m).padStart(2, "0")}`, period: h >= 12 ? "PM" : "AM" };
};

/** Parses "9", "9:5", "09:05", "905" or "1730" into minutes after midnight. */
function parse(text: string, period: string, use24h: boolean): string | null {
  const t = text.trim().replace(/[^\d:]/g, "");
  let h: number, m: number;
  const match = /^(\d{1,2}):(\d{1,2})$/.exec(t);
  if (match) { h = Number(match[1]); m = Number(match[2]); }
  else if (/^\d{1,2}$/.test(t)) { h = Number(t); m = 0; }
  else if (/^\d{3,4}$/.test(t)) { h = Number(t.slice(0, -2)); m = Number(t.slice(-2)); }
  else return null;
  if (m > 59) return null;
  if (use24h) { if (h > 23) return null; }
  else {
    if (h < 1 || h > 12) return null;
    h = (h % 12) + (period === "PM" ? 12 : 0);
  }
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Carbon time picker (text + AM/PM) that stores a 24-hour "HH:MM" value. */
export function TimeField({ id, label, value, use24h, invalidText, onChange }: Props) {
  const shown = use24h ? { text: value, period: "" } : to12(value);
  const [text, setText] = useState(shown.text);
  const [error, setError] = useState(false);
  const [lastValue, setLastValue] = useState(value);
  const [lastFormat, setLastFormat] = useState(use24h);
  // Follow outside changes (quick buttons, 12/24-hour switch) while keeping what the user is typing.
  if (value !== lastValue || use24h !== lastFormat) {
    setLastValue(value);
    setLastFormat(use24h);
    setText(shown.text);
    setError(false);
  }

  const commit = (nextText: string, period: string) => {
    const hm = parse(nextText, period, use24h);
    setError(hm === null);
    if (hm && hm !== value) { setLastValue(hm); onChange(hm); }
  };

  return (
    <TimePicker
      id={id}
      labelText={label}
      value={text}
      placeholder={use24h ? "hh:mm" : "h:mm"}
      invalid={error || Boolean(invalidText)}
      invalidText={error ? "Use a time like 9:30" : invalidText}
      onChange={(e) => setText(e.target.value)}
      onBlur={(e) => commit(e.target.value, shown.period)}
    >
      {!use24h && (
        <TimePickerSelect
          id={`${id}-period`}
          aria-label={`${label} AM or PM`}
          value={shown.period}
          onChange={(e) => commit(text, e.target.value)}
        >
          <SelectItem value="AM" text="AM" />
          <SelectItem value="PM" text="PM" />
        </TimePickerSelect>
      )}
    </TimePicker>
  );
}
