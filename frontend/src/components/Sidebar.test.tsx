import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../utils/test-utils";
import { Sidebar } from "./Sidebar";

describe("Sidebar", () => {
  it("lists the Status filters in the navigation", () => {
    renderWithProviders(<Sidebar />);

    const nav = screen.getByRole("navigation");
    expect(within(nav).getByText("Any status")).toBeInTheDocument();
    expect(within(nav).getByText("Active")).toBeInTheDocument();
    expect(within(nav).getByText("Completed")).toBeInTheDocument();
  });
});
