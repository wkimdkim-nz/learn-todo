import { screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { db } from "../../mocks/db";
import { server } from "../../mocks/server";
import { renderWithProviders } from "../../utils/test-utils";
import { TodoList } from "./TodoList";

describe("TodoList", () => {
  it("shows the Todos from the API", async () => {
    db.seedTodos({ title: "Buy milk" }, { title: "Walk the dog", status: "Completed" });

    renderWithProviders(<TodoList />);

    expect(await screen.findByRole("checkbox", { name: "Buy milk" })).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Walk the dog" })).toBeChecked();
  });

  it("says so when there are no Todos", async () => {
    renderWithProviders(<TodoList />);

    expect(await screen.findByText("No Todos yet.")).toBeInTheDocument();
  });

  it("shows an error when the Todos can't load, and Retry loads them", async () => {
    db.seedTodos({ title: "Buy milk" });
    // Fails the first request only; the Retry falls through to the normal handler.
    server.use(
      http.get("/api/todos", () => new HttpResponse(null, { status: 500 }), { once: true }),
    );

    const { user } = renderWithProviders(<TodoList />);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Couldn't load your Todos.");

    await user.click(screen.getByRole("button", { name: "Retry" }));

    expect(await screen.findByRole("checkbox", { name: "Buy milk" })).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("ticking marks a Todo Completed, and unticking makes it Active again", async () => {
    db.seedTodos({ title: "Buy milk" });

    const { user } = renderWithProviders(<TodoList />);

    await user.click(await screen.findByRole("checkbox", { name: "Buy milk" }));
    // The list refetches after the change, so the tick comes from the API's answer.
    expect(await screen.findByRole("checkbox", { name: "Buy milk", checked: true })).toBeEnabled();

    await user.click(screen.getByRole("checkbox", { name: "Buy milk" }));
    expect(await screen.findByRole("checkbox", { name: "Buy milk", checked: false })).toBeEnabled();
  });

  it("disables a Todo's checkbox while its change is pending", async () => {
    db.seedTodos({ title: "Buy milk" }, { title: "Walk the dog" });
    // Holds the change until the test answers it, then falls through to the
    // normal handler, because a resolver that returns nothing passes the request on.
    let answer!: () => void;
    const answered = new Promise<void>((resolve) => (answer = resolve));
    server.use(
      http.put("/api/todos/:id/status", async () => {
        await answered;
      }),
    );

    const { user } = renderWithProviders(<TodoList />);

    await user.click(await screen.findByRole("checkbox", { name: "Buy milk" }));
    expect(screen.getByRole("checkbox", { name: "Buy milk" })).toBeDisabled();
    expect(screen.getByRole("checkbox", { name: "Walk the dog" })).toBeEnabled();

    answer();
    expect(await screen.findByRole("checkbox", { name: "Buy milk", checked: true })).toBeEnabled();
  });

  it("shows an error when a Status change fails, and the Todo keeps its Status", async () => {
    db.seedTodos({ title: "Buy milk" });
    server.use(http.put("/api/todos/:id/status", () => new HttpResponse(null, { status: 500 })));

    const { user } = renderWithProviders(<TodoList />);

    await user.click(await screen.findByRole("checkbox", { name: "Buy milk" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Couldn't change that Todo's Status.",
    );
    expect(screen.getByRole("checkbox", { name: "Buy milk" })).not.toBeChecked();
  });
});
