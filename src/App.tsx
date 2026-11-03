import { Column, Grid, Header, HeaderGlobalAction, HeaderGlobalBar, HeaderName, SkipToContent, Tag } from "@carbon/react";
import { Maximize, Minimize, Settings as SettingsIcon } from "@carbon/icons-react";
import { lazy, Suspense, useCallback, useEffect, useState, type CSSProperties } from "react";
import { BookletCover } from "./components/BookletCover";
import { ClockPanel } from "./components/ClockPanel";
import { InstructionsPanel } from "./components/InstructionsPanel";
import { useNow } from "./hooks/useNow";
import { useFullscreen, useIdle, usePrefersDark, useWakeLock } from "./hooks/useScreen";
import { fontById } from "./lib/fonts";
import { loadSettings, saveSettings, type Settings } from "./lib/settings";
import { sessionPhase, sessionWindow, formatDuration } from "./lib/time";

// The setup dialog (with the text editor) loads only when first opened.
const SetupModal = lazy(() => import("./components/SetupModal").then((m) => ({ default: m.SetupModal })));

export function App() {
  const [settings, setSettings] = useState<Settings>(() => loadSettings());
  const [setupOpen, setSetupOpen] = useState(false);
  const now = useNow();
  const idle = useIdle();
  const prefersDark = usePrefersDark();
  const fullscreen = useFullscreen();
  useWakeLock();

  const theme = settings.appearance.theme === "system" ? (prefersDark ? "g100" : "white") : settings.appearance.theme === "light" ? "white" : "g100";

  // Carbon themes are applied to the whole page through a data attribute on <html>.
  useEffect(() => {
    document.documentElement.dataset.carbonTheme = theme;
    document.documentElement.style.colorScheme = theme === "white" ? "light" : "dark";
  }, [theme]);

  // Tab title doubles as a mini clock when the window isn't in front.
  const win = sessionWindow(settings.session.start, settings.session.end, now);
  const phase = sessionPhase(win, now);
  useEffect(() => {
    document.title = phase === "ended" ? "Time is up · Class Clock"
      : phase === "before" ? "Not started · Class Clock"
      : `${formatDuration(win.end.getTime() - now.getTime())} left · Class Clock`;
  });

  const save = useCallback((next: Settings) => {
    setSettings(next);
    saveSettings(next);
    setSetupOpen(false);
  }, []);

  // Keyboard shortcuts: S opens setup, F toggles full screen.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (setupOpen || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return;
      if (e.key.toLowerCase() === "s") { e.preventDefault(); setSetupOpen(true); }
      if (e.key.toLowerCase() === "f" && fullscreen.supported) void fullscreen.toggle();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setupOpen, fullscreen]);

  const fontVars = {
    "--erc-font-heading": fontById(settings.appearance.headingFont).stack,
    "--erc-font-body": fontById(settings.appearance.bodyFont).stack,
    "--erc-font-clock": fontById(settings.appearance.clockFont).stack,
  } as CSSProperties;

  return (
    <div className={`erc-app${idle && !setupOpen ? " is-idle" : ""}`} style={fontVars}>
      <Header aria-label="Class Clock" className="erc-header">
        <SkipToContent />
        <HeaderName prefix="" href="#main-content" onClick={(e) => e.preventDefault()}>
          Class Clock
        </HeaderName>
        {settings.isExample && (
          <Tag type="red" size="md" className="erc-header__example">Example details</Tag>
        )}
        <HeaderGlobalBar className="erc-header__actions">
          <HeaderGlobalAction aria-label="Setup (S)" tooltipAlignment="end" onClick={() => setSetupOpen(true)}>
            <SettingsIcon size={20} />
          </HeaderGlobalAction>
          {fullscreen.supported && (
            <HeaderGlobalAction
              aria-label={fullscreen.isFullscreen ? "Exit full screen (F)" : "Full screen (F)"}
              tooltipAlignment="end"
              onClick={() => void fullscreen.toggle()}
            >
              {fullscreen.isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
            </HeaderGlobalAction>
          )}
        </HeaderGlobalBar>
      </Header>

      <main id="main-content" className="erc-main">
        <Grid fullWidth className="erc-grid">
          <Column sm={4} md={8} lg={10} className="erc-col erc-col--instructions">
            <InstructionsPanel settings={settings} />
          </Column>
          <Column sm={4} md={8} lg={6} className="erc-col erc-col--side">
            <ClockPanel settings={settings} now={now} />
            <BookletCover settings={settings} />
          </Column>
        </Grid>
      </main>

      {setupOpen && (
        <Suspense fallback={null}>
          <SetupModal open settings={settings} onClose={() => setSetupOpen(false)} onSave={save} />
        </Suspense>
      )}
    </div>
  );
}
