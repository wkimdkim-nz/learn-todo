import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { db } from "../mocks/db";
import { renderWithProviders } from "../utils/test-utils";
import { Sidebar } from "./Sidebar";

describe("Sidebar", () => {
  it("lists the Status selection options in the navigation", () => {
    renderWithProviders(<Sidebar />);

    const nav = screen.getByRole("navigation");
    expect(within(nav).getByText("Any status")).toBeInTheDocument();
    expect(within(nav).getByText("Active")).toBeInTheDocument();
    expect(within(nav).getByText("Completed")).toBeInTheDocument();
  });

  it("adds a Tag with +, listing it alphabetically ignoring case", async () => {
    db.seedTags("Work", "home");

    const { user } = renderWithProviders(<Sidebar />);
    const tags = screen.getByRole("region", { name: "Tags" });
    await within(tags).findByText("Work");

    await user.click(within(tags).getByRole("button", { name: "Add a Tag" }));
    await user.type(within(tags).getByRole("textbox", { name: "New Tag" }), "Errands{Enter}");

    // The list refetches after the add, so the new Tag's place comes from the API's answer.
    await within(tags).findByText("Errands");
    const names = within(tags)
      .getAllByRole("listitem")
      .map((item) => item.textContent);
    expect(names).toEqual(["Errands", "home", "Work"]);
    // The input closes once the Tag is saved.
    expect(within(tags).queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("shows the API's message for a name that's taken in any case, until Escape closes the input", async () => {
    db.seedTags("Work");

    const { user } = renderWithProviders(<Sidebar />);
    const tags = screen.getByRole("region", { name: "Tags" });
    await within(tags).findByText("Work");

    await user.click(within(tags).getByRole("button", { name: "Add a Tag" }));
    const input = within(tags).getByRole("textbox", { name: "New Tag" });
    await user.type(input, "work{Enter}");

    expect(await within(tags).findByRole("alert")).toHaveTextContent(
      'A Tag named "Work" already exists.',
    );
    expect(input).toHaveAccessibleDescription('A Tag named "Work" already exists.');
    expect(input).toHaveValue("work");

    await user.keyboard("{Escape}");
    expect(within(tags).queryByRole("textbox")).not.toBeInTheDocument();
    expect(within(tags).queryByRole("alert")).not.toBeInTheDocument();
  });
});
