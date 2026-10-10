import { render, type RenderOptions } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement, ReactNode } from "react";
import { Provider } from "react-redux";
import { makeStore, type RootState } from "../app/store";

type ExtendedRenderOptions = Omit<RenderOptions, "wrapper"> & {
  preloadedState?: Partial<RootState>;
};

// Renders a component inside a fresh Redux store, like main.tsx does for the app.
// Returns the store and a user-event `user` too, alongside the usual queries.
export function renderWithProviders(ui: ReactElement, options: ExtendedRenderOptions = {}) {
  const { preloadedState, ...renderOptions } = options;
  const store = makeStore(preloadedState);

  function Wrapper({ children }: { children: ReactNode }) {
    return <Provider store={store}>{children}</Provider>;
  }

  return {
    store,
    user: userEvent.setup(),
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}
