import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: { chunkSizeWarningLimit: 600 },
  css: {
    preprocessorOptions: {
      // Carbon's Sass still triggers deprecation notices in newer Sass releases.
      scss: { quietDeps: true, silenceDeprecations: ["import", "global-builtin", "if-function"] },
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test-setup.ts"],
    css: false,
  },
});
