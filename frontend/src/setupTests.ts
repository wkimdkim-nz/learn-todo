import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll } from "vitest";
import { db } from "./mocks/db";
import { server } from "./mocks/server";

// A request with no handler fails the test, instead of trying the network.
beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
});

afterEach(() => {
  // Testing Library only unmounts after each test by itself when Vitest's
  // globals are on, and they're off here.
  cleanup();
  // Drops any server.use overrides and the seeded Todos, so each test starts clean.
  server.resetHandlers();
  db.reset();
});

afterAll(() => {
  server.close();
});
