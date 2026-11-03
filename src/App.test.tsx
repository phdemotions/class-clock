import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "./App";

beforeAll(() => {
  // jsdom lacks these browser APIs.
  globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
  window.matchMedia ??= ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
});

describe("App", () => {
  it("shows the clock, instructions and booklet cover", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: "Exam instructions" })).toBeInTheDocument();
    expect(screen.getByText("Current time")).toBeInTheDocument();
    expect(screen.getByRole("figure", { name: /fill in the front of your examination booklet/i })).toBeInTheDocument();
    expect(screen.getByText("Example details")).toBeInTheDocument();
  });

  it("opens setup with the S key", async () => {
    render(<App />);
    await userEvent.keyboard("s");
    expect(await screen.findByRole("tab", { name: "Booklet cover" })).toBeInTheDocument();
  });
});
