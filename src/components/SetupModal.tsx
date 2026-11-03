import {
  Button, ContentSwitcher, FormGroup, InlineNotification, Modal, RadioButton, RadioButtonGroup, Select, SelectItem,
  Stack, Switch, Tab, TabList, TabPanel, TabPanels, Tabs, TextInput,
} from "@carbon/react";
import { useState } from "react";
import { FONT_OPTIONS, UOFG_FONTS } from "../lib/fonts";
import { defaultSettings, type Settings, type ThemeChoice } from "../lib/settings";
import { addMinutes, durationMinutes, parseHM, toHM } from "../lib/time";
import { RichTextEditor } from "./RichTextEditor";
import { TimeField } from "./TimeField";
import "./SetupModal.scss";

interface Props {
  open: boolean;
  settings: Settings;
  onClose: () => void;
  onSave: (next: Settings) => void;
}

const THEMES: { id: ThemeChoice; text: string }[] = [
  { id: "dark", text: "Dark" },
  { id: "light", text: "Light" },
  { id: "system", text: "Match device" },
];

const LENGTHS = [15, 20, 30, 45, 50, 60, 75, 80, 90, 110, 120, 150, 180];
const lengthText = (m: number) => {
  const h = Math.floor(m / 60);
  const r = m % 60;
  return h ? `${h} h${r ? ` ${r} min` : ""}` : `${m} min`;
};

/** Rendered only while open, so each opening starts from the saved settings. */
export function SetupModal(props: Props) {
  if (!props.open) return null;
  return <SetupForm {...props} />;
}

type Section = "session" | "booklet" | "appearance";

function SetupForm({ settings, onClose, onSave }: Props) {
  const [draft, setDraft] = useState<Settings>(() => structuredClone(settings));
  const [submitted, setSubmitted] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const set = <K extends Section>(key: K, patch: Partial<Settings[K]>) =>
    setDraft((d) => ({ ...d, [key]: { ...d[key], ...patch } }));

  const { start, end, use24h } = draft.session;
  const timesOk = parseHM(start) !== null && parseHM(end) !== null && start !== end;
  const length = timesOk ? durationMinutes(start, end) : 0;

  const save = () => {
    setSubmitted(true);
    if (!timesOk) return;
    onSave({ ...draft, isExample: false });
  };

  const fontSelect = (id: string, label: string, value: string, onChange: (v: string) => void) => (
    <Select id={id} labelText={label} value={value} onChange={(e) => onChange(e.target.value)}>
      {FONT_OPTIONS.map((f) => <SelectItem key={f.id} value={f.id} text={f.note ? `${f.label} (${f.note})` : f.label} />)}
    </Select>
  );

  return (
    <Modal
      open
      size="md"
      modalHeading="Setup"
      modalLabel="Class Clock"
      primaryButtonText="Save and show"
      secondaryButtonText="Cancel"
      onRequestClose={onClose}
      onRequestSubmit={save}
      preventCloseOnClickOutside
      className="erc-setup"
    >
      <p className="erc-setup__intro">Saved in this browser only, so set up on the computer connected to the projector.</p>
      <Tabs>
        <TabList aria-label="Setup sections">
          <Tab>Instructions</Tab>
          <Tab>Booklet cover</Tab>
          <Tab>Time</Tab>
          <Tab>Appearance</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <Stack gap={3}>
              <p id="erc-instr-label" className="cds--label">Instructions shown to students</p>
              <RichTextEditor labelId="erc-instr-label" value={draft.instructionsHtml} onChange={(html) => setDraft((d) => ({ ...d, instructionsHtml: html }))} />
              <p className="cds--form__helper-text">Shown exactly as formatted. On the projector the text resizes to fill the panel.</p>
            </Stack>
          </TabPanel>

          <TabPanel>
            <Stack gap={7}>
              <TextInput id="erc-title" labelText="Title" maxLength={80}
                helperText="Shown above the instructions and on the cover, e.g. Final Examination, Quiz 2 or Reflection 3"
                value={draft.session.title} onChange={(e) => set("session", { title: e.target.value })} />
              <FormGroup legendText="Copied by students exactly (blue on the cover)">
                <div className="erc-setup__grid">
                  <TextInput id="erc-course" labelText="Course number" placeholder="PSYC*3250" maxLength={40}
                    value={draft.session.courseNumber} onChange={(e) => set("session", { courseNumber: e.target.value })} />
                  <TextInput id="erc-course-title" labelText="Course title" placeholder="Consumer Psychology" maxLength={120}
                    value={draft.session.courseTitle} onChange={(e) => set("session", { courseTitle: e.target.value })} />
                  <TextInput id="erc-instructor" labelText="Instructor" placeholder="Dr. A. Lee" maxLength={80}
                    value={draft.session.instructor} onChange={(e) => set("session", { instructor: e.target.value })} />
                  <TextInput id="erc-date" labelText="Date" placeholder="November 3, 2026" maxLength={60}
                    value={draft.session.dateText} onChange={(e) => set("session", { dateText: e.target.value })} />
                </div>
              </FormGroup>
              <FormGroup legendText="Book Number line">
                <Stack gap={5}>
                  <TextInput id="erc-book" labelText="Text on the line" maxLength={60}
                    helperText="An instruction, or a word such as MAPLE to check attendance"
                    value={draft.booklet.bookNumberText} onChange={(e) => set("booklet", { bookNumberText: e.target.value })} />
                  <RadioButtonGroup legendText="Show it as" name="erc-book-style" orientation="horizontal"
                    valueSelected={draft.booklet.bookNumberStyle}
                    onChange={(v) => set("booklet", { bookNumberStyle: v as Settings["booklet"]["bookNumberStyle"] })}>
                    <RadioButton id="erc-book-note" value="instruction" labelText="Instruction (orange)" />
                    <RadioButton id="erc-book-copy" value="copy" labelText="Copy exactly (blue)" />
                  </RadioButtonGroup>
                </Stack>
              </FormGroup>
            </Stack>
          </TabPanel>

          <TabPanel>
            <Stack gap={7}>
              <div className="erc-setup__grid erc-setup__grid--time">
                <TimeField id="erc-start" label="Start time" value={start} use24h={use24h}
                  onChange={(hm) => set("session", { start: hm, end: length ? addMinutes(hm, length) : end })} />
                <Select id="erc-length" labelText="Length" value={LENGTHS.includes(length) ? String(length) : "custom"}
                  onChange={(e) => e.target.value !== "custom" && set("session", { end: addMinutes(start, Number(e.target.value)) })}>
                  {!LENGTHS.includes(length) && <SelectItem value="custom" text={length ? lengthText(length) : "Choose"} />}
                  {LENGTHS.map((m) => <SelectItem key={m} value={String(m)} text={lengthText(m)} />)}
                </Select>
                <TimeField id="erc-end" label="End time" value={end} use24h={use24h}
                  invalidText={submitted && !timesOk ? "End time must differ from the start time." : undefined}
                  onChange={(hm) => set("session", { end: hm })} />
              </div>
              <div className="erc-setup__row">
                <Button kind="tertiary" size="md" onClick={() => {
                  const now = toHM(new Date());
                  set("session", { start: now, end: addMinutes(now, length || 60) });
                }}>
                  Start now
                </Button>
                <p className="cds--form__helper-text">Starts from this minute and keeps the length. Times are for today; an end time before the start runs past midnight.</p>
              </div>
              <RadioButtonGroup legendText="Clock format" name="erc-format" orientation="horizontal"
                valueSelected={use24h ? "24" : "12"} onChange={(v) => set("session", { use24h: v === "24" })}>
                <RadioButton id="erc-12h" value="12" labelText="12-hour (4:30 PM)" />
                <RadioButton id="erc-24h" value="24" labelText="24-hour (16:30)" />
              </RadioButtonGroup>
            </Stack>
          </TabPanel>

          <TabPanel>
            <Stack gap={7}>
              <div className="erc-setup__narrow">
                <p className="cds--label" id="erc-theme-label">Theme</p>
                <ContentSwitcher
                  size="md"
                  aria-labelledby="erc-theme-label"
                  selectedIndex={THEMES.findIndex((t) => t.id === draft.appearance.theme)}
                  onChange={({ index }) => set("appearance", { theme: THEMES[index ?? 0]?.id ?? "dark" })}
                >
                  {THEMES.map((t) => <Switch key={t.id} name={t.id} text={t.text} />)}
                </ContentSwitcher>
                <p className="cds--form__helper-text">Dark reduces projector glare. Light suits very bright rooms.</p>
              </div>
              <FormGroup legendText="Fonts">
                <Stack gap={5}>
                  <div className="erc-setup__grid erc-setup__grid--3">
                    {fontSelect("erc-font-heading", "Headings", draft.appearance.headingFont, (v) => set("appearance", { headingFont: v }))}
                    {fontSelect("erc-font-body", "Instructions", draft.appearance.bodyFont, (v) => set("appearance", { bodyFont: v }))}
                    {fontSelect("erc-font-clock", "Clock", draft.appearance.clockFont, (v) => set("appearance", { clockFont: v }))}
                  </div>
                  <div className="erc-setup__row">
                    <Button kind="tertiary" size="md" onClick={() => set("appearance", { headingFont: UOFG_FONTS.heading, bodyFont: UOFG_FONTS.body, clockFont: UOFG_FONTS.clock })}>
                      Use default fonts
                    </Button>
                    <p className="cds--form__helper-text">U of G fonts for headings (Russo One) and text (DM Sans), with IBM Plex Sans for the clock because its digits are all the same width.</p>
                  </div>
                </Stack>
              </FormGroup>
              <div className="erc-setup__danger">
                {confirmReset ? (
                  <Stack gap={4}>
                    <InlineNotification kind="warning" lowContrast hideCloseButton
                      title="Replace everything with the example?"
                      subtitle="Your instructions and details are replaced when you save." />
                    <div className="erc-setup__row">
                      <Button kind="danger" size="md" onClick={() => { setDraft(defaultSettings()); setConfirmReset(false); }}>Replace with example</Button>
                      <Button kind="secondary" size="md" onClick={() => setConfirmReset(false)}>Keep mine</Button>
                    </div>
                  </Stack>
                ) : (
                  <Button kind="danger--ghost" size="md" onClick={() => setConfirmReset(true)}>Reset to example…</Button>
                )}
              </div>
            </Stack>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Modal>
  );
}
