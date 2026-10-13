import { screen, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { db } from "../../mocks/db";
import { server } from "../../mocks/server";
import { renderWithProviders } from "../../utils/test-utils";
import { QuickAdd } from "./QuickAdd";
import { TodoList } from "./TodoList";

describe("QuickAdd", () => {
  it("adds the typed Title as a Todo at the bottom of the list, and clears the input", async () => {
    db.seedTodos({ title: "Buy milk" });

    const { user } = renderWithProviders(
      <>
        <QuickAdd />
        <TodoList />
      </>,
    );
    await screen.findByRole("checkbox", { name: "Buy milk" });

    const input = screen.getByRole("textbox", { name: "Add a Todo" });
    await user.type(input, "Walk the dog{Enter}");

    // The list refetches after the add, so the new Todo comes from the API's answer.
    await screen.findByRole("checkbox", { name: "Walk the dog" });
    const rows = within(screen.getByRole("list")).getAllByRole("listitem");
    expect(rows.map((row) => row.textContent)).toEqual(["Buy milk", "Walk the dog"]);
    expect(input).toHaveValue("");
  });

  it("keeps a Title typed while the previous add was still saving", async () => {
    // Holds the add until the test answers it, then falls through to the normal handler.
    let answer!: () => void;
    const answered = new Promise<void>((resolve) => (answer = resolve));
    server.use(
      http.post("/api/todos", async () => {
        await answered;
      }),
    );

    const { user } = renderWithProviders(
      <>
        <QuickAdd />
        <TodoList />
      </>,
    );

    const input = screen.getByRole("textbox", { name: "Add a Todo" });
    await user.type(input, "Buy milk{Enter}");
    await user.clear(input);
    await user.type(input, "Walk the dog");

    answer();
    await screen.findByRole("checkbox", { name: "Buy milk" });
    expect(input).toHaveValue("Walk the dog");
  });

  it("shows the API's message for a rejected Title under the input, and keeps what was typed", async () => {
    const { user } = renderWithProviders(<QuickAdd />);

    const input = screen.getByRole("textbox", { name: "Add a Todo" });
    await user.type(input, "   {Enter}");

    expect(await screen.findByRole("alert")).toHaveTextContent("The Title field is required.");
    expect(input).toHaveAccessibleDescription("The Title field is required.");
    expect(input).toHaveValue("   ");
  });

  it("says the add failed when the API errors for another reason", async () => {
    server.use(http.post("/api/todos", () => new HttpResponse(null, { status: 500 })));

    const { user } = renderWithProviders(<QuickAdd />);

    await user.type(screen.getByRole("textbox", { name: "Add a Todo" }), "Buy milk{Enter}");

    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't add that Todo.");
  });
});
