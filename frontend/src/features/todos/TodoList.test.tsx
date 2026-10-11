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
});
