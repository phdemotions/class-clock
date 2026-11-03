# Exam Room Clock

A projector screen for exam rooms. It shows:

- **Exam instructions**, written in a rich text editor. They take up most of the screen and resize to fit.
- **Time remaining** and the **current time**. The countdown turns yellow at 30 minutes left, orange at 10 and red at 5, then shows "Time is up".
- **The booklet cover**: the top of the University of Guelph examination booklet, showing what students copy exactly (blue) and what they fill in themselves (orange). The Book Number line can hold a custom instruction or an attendance word.

Press **S** to set up an exam and **F** for full screen. Settings are saved in the browser on the computer you set up.

## Built with

- [React](https://react.dev) 19 + TypeScript, built with [Vite](https://vite.dev)
- [IBM Carbon Design System](https://carbondesignsystem.com) (`@carbon/react`): 16-column grid, UI shell header, modal, tabs, form controls, Gray 100 and White themes
- [Tiptap](https://tiptap.dev) for the instructions editor, [DOMPurify](https://github.com/cure53/DOMPurify) to keep only safe formatting
- [Zod](https://zod.dev) to validate saved settings
- Fonts bundled with [Fontsource](https://fontsource.org) (no third-party font requests). Defaults are the U of G brand fonts: Russo One (headings) and DM Sans (text).

## Develop

Requires Node 20 or newer (see `.nvmrc`).

```sh
npm install
npm run dev        # local server at http://localhost:5173
npm run check      # typecheck, lint, tests and production build
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm test` | Run unit and component tests (Vitest) |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript |

Carbon packages send anonymous install telemetry to IBM. Set `IBM_TELEMETRY_DISABLED=true` to turn it off (CI already does).

## Deploy

`dist/` is a static site, so any static host works. On Vercel, import the repository; it detects Vite automatically (build `npm run build`, output `dist`).

## Project layout

```
src/
  App.tsx                    Page layout (Carbon Grid) and header actions
  components/
    InstructionsPanel.tsx    Instructions, auto-sized to fill the panel
    ClockPanel.tsx           Countdown, status, progress, current time
    BookletCover.tsx         Booklet cover guide (positions match the printed form)
    SetupModal.tsx           Setup dialog, loaded only when opened
    RichTextEditor.tsx       Tiptap editor with Carbon toolbar
  hooks/                     Clock tick, text fitting, wake lock, full screen, idle
  lib/
    time.ts                  Exam window and countdown maths (tested)
    settings.ts              Settings schema, defaults, versioned storage (tested)
    sanitize.ts              Allowed formatting for instructions (tested)
    fonts.ts                 Font choices
  styles/index.scss          Carbon styles (per component) and themes
```

### Changing saved settings

Settings are stored under `exam-room-clock:settings` with a `version` number. If you change their shape, bump `SETTINGS_VERSION` in `src/lib/settings.ts` and add a step to `migrate()` so existing setups keep working.

## Notes

The university name and logo are deliberately left out. The cover header shows the course number and exam name instead.
