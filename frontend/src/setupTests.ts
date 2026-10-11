import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Testing Library only unmounts after each test by itself when Vitest's globals
// are on, and they're off here.
afterEach(() => {
  cleanup();
});
