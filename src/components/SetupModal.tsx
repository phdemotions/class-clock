import {
  Button, ContentSwitcher, Modal, RadioButton, RadioButtonGroup, Select, SelectItem, Stack,
  Switch, Tab, TabList, TabPanel, TabPanels, Tabs, TextInput, Toggle,
} from "@carbon/react";
import { useState } from "react";
import { FONT_OPTIONS, UOFG_FONTS } from "../lib/fonts";
import { defaultSettings, type Settings, type ThemeChoice } from "../lib/settings";
import { addMinutes, durationMinutes, parseHM, toHM } from "../lib/time";
import { RichTextEditor } from "./RichTextEditor";
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

/** Rendered only while open, so each opening starts from the saved settings. */
export function SetupModal(props: Props) {
  if (!props.open) return null;
  return <SetupForm {...props} />;
}

function SetupForm({ settings, onClose, onSave }: Props) {
  const [draft, setDraft] = useState<Settings>(() => structuredClone(settings));
  const [submitted, setSubmitted] = useState(false);

  type Section = "session" | "booklet" | "appearance";
  const set = <K extends Section>(key: K, patch: Partial<Settings[K]>) =>
    setDraft((d) => ({ ...d, [key]: { ...d[key], ...patch } }));

  const startOk = parseHM(draft.session.start) !== null;
  const endOk = parseHM(draft.session.end) !== null;
  const sameTime = startOk && endOk && draft.session.start === draft.session.end;
  const valid = startOk && endOk && !sameTime;

  const save = () => {
    setSubmitted(true);
    if (!valid) return;
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
      size="lg"
      modalHeading="Set up"
      modalLabel="Class Clock"
      primaryButtonText="Save and show"
      secondaryButtonText="Cancel"
      onRequestClose={onClose}
      onRequestSubmit={save}
      preventCloseOnClickOutside
      hasScrollingContent
      className="erc-setup"
    >
      <p className="erc-setup__intro">Settings are saved in this browser only. Set up on the computer connected to the projector.</p>
      <Tabs>
        <TabList aria-label="Setup sections" contained>
          <Tab>Instructions</Tab>
          <Tab>Booklet cover</Tab>
          <Tab>Time</Tab>
          <Tab>Appearance</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <Stack gap={4}>
              <p id="erc-instr-label" className="cds--label">Instructions</p>
              <RichTextEditor labelId="erc-instr-label" value={draft.instructionsHtml} onChange={(html) => setDraft((d) => ({ ...d, instructionsHtml: html }))} />
              <p className="erc-setup__help">Shown exactly as formatted. On large screens the text resizes to fill the instructions panel.</p>
            </Stack>
          </TabPanel>

          <TabPanel>
            <Stack gap={6}>
              <p className="erc-setup__help">These appear on the cover in blue, exactly as students should copy them.</p>
              <div className="erc-setup__grid">
                <TextInput id="erc-course" labelText="Course number" placeholder="e.g. PSYC*3250" maxLength={40}
                  value={draft.session.courseNumber} onChange={(e) => set("session", { courseNumber: e.target.value })} />
                <TextInput id="erc-title" labelText="Course title" placeholder="e.g. Consumer Psychology" maxLength={120}
                  value={draft.session.courseTitle} onChange={(e) => set("session", { courseTitle: e.target.value })} />
                <TextInput id="erc-instructor" labelText="Instructor" placeholder="e.g. Dr. A. Lee" maxLength={80}
                  value={draft.session.instructor} onChange={(e) => set("session", { instructor: e.target.value })} />
                <TextInput id="erc-date" labelText="Date" helperText="As students should write it" maxLength={60}
                  value={draft.session.dateText} onChange={(e) => set("session", { dateText: e.target.value })} />
                <TextInput id="erc-session-name" labelText="Title" helperText="Shown at the top of the cover and the instructions, e.g. Final Examination, Quiz 2 or Reflection 3" placeholder="e.g. Reflection 3" maxLength={80}
                  className="erc-setup__full" value={draft.session.title} onChange={(e) => set("session", { title: e.target.value })} />
              </div>
              <div className="erc-setup__grid">
                <TextInput id="erc-book" labelText="Book Number line" maxLength={60}
                  helperText="e.g. “1 on your first booklet, 2 on the next…”, or a word like MAPLE to check attendance"
                  value={draft.booklet.bookNumberText} onChange={(e) => set("booklet", { bookNumberText: e.target.value })} />
                <RadioButtonGroup legendText="Show it as" name="erc-book-style" orientation="vertical"
                  valueSelected={draft.booklet.bookNumberStyle}
                  onChange={(v) => set("booklet", { bookNumberStyle: v as Settings["booklet"]["bookNumberStyle"] })}>
                  <RadioButton id="erc-book-note" value="instruction" labelText="Orange: an instruction for students" />
                  <RadioButton id="erc-book-copy" value="copy" labelText="Blue: students copy it exactly" />
                </RadioButtonGroup>
              </div>
            </Stack>
          </TabPanel>

          <TabPanel>
            <Stack gap={6}>
              <p className="erc-setup__help">Times are for today. An end time earlier than the start means it runs past midnight.</p>
              <div className="erc-setup__grid">
                <TextInput id="erc-start" type="time" labelText="Start time" value={draft.session.start}
                  invalid={submitted && (!startOk || sameTime)} invalidText={!startOk ? "Enter a start time." : "Start and end can’t be the same."}
                  onChange={(e) => set("session", { start: e.target.value })} />
                <TextInput id="erc-end" type="time" labelText="End time" value={draft.session.end}
                  invalid={submitted && !endOk} invalidText="Enter an end time."
                  onChange={(e) => set("session", { end: e.target.value })} />
              </div>
              <div className="erc-setup__quick" role="group" aria-label="Set length">
                <span className="cds--label">Length from start</span>
                {[60, 90, 120, 150, 180].map((m) => (
                  <Button key={m} kind="tertiary" size="sm" disabled={!startOk}
                    onClick={() => set("session", { end: addMinutes(draft.session.start, m) })}>
                    {`${m / 60} h`}
                  </Button>
                ))}
                <Button kind="primary" size="sm" onClick={() => {
                  const len = startOk && endOk && !sameTime ? durationMinutes(draft.session.start, draft.session.end) : 120;
                  const start = toHM(new Date());
                  set("session", { start, end: addMinutes(start, len) });
                }}>
                  Start now
                </Button>
              </div>
              <Toggle id="erc-24h" labelText="Clock format" labelA="12-hour" labelB="24-hour"
                toggled={draft.session.use24h} onToggle={(v) => set("session", { use24h: v })} />
            </Stack>
          </TabPanel>

          <TabPanel>
            <Stack gap={6}>
              <div>
                <p className="cds--label" id="erc-theme-label">Theme</p>
                <ContentSwitcher
                  aria-labelledby="erc-theme-label"
                  selectedIndex={THEMES.findIndex((t) => t.id === draft.appearance.theme)}
                  onChange={({ index }) => set("appearance", { theme: THEMES[index ?? 0]?.id ?? "dark" })}
                >
                  {THEMES.map((t) => <Switch key={t.id} name={t.id} text={t.text} />)}
                </ContentSwitcher>
                <p className="erc-setup__help">Dark reduces projector glare. Light suits very bright rooms.</p>
              </div>
              <div className="erc-setup__grid erc-setup__grid--3">
                {fontSelect("erc-font-heading", "Headings", draft.appearance.headingFont, (v) => set("appearance", { headingFont: v }))}
                {fontSelect("erc-font-body", "Instructions text", draft.appearance.bodyFont, (v) => set("appearance", { bodyFont: v }))}
                {fontSelect("erc-font-clock", "Clock numbers", draft.appearance.clockFont, (v) => set("appearance", { clockFont: v }))}
              </div>
              <div className="erc-setup__quick">
                <Button kind="tertiary" size="sm" onClick={() => set("appearance", { headingFont: UOFG_FONTS.heading, bodyFont: UOFG_FONTS.body, clockFont: UOFG_FONTS.clock })}>
                  Use U of G fonts
                </Button>
                <Button kind="ghost" size="sm" onClick={() => setDraft(defaultSettings())}>
                  Reset everything to the example
                </Button>
              </div>
              <p className="erc-setup__help">Defaults are the University of Guelph brand fonts: Russo One for headings and DM Sans for text. The clock uses DM Sans because Russo One’s digits crowd together at large sizes. The booklet cover keeps its printed look.</p>
            </Stack>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Modal>
  );
}
