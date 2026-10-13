import { http, HttpResponse } from "msw";
import type { Status } from "../features/todos/types";
import { db } from "./db";

// One handler per API endpoint the frontend calls, answering from the db.
export const handlers = [
  http.get("/api/todos", () => HttpResponse.json(db.allTodos())),

  http.post<never, { title: string }>("/api/todos", async ({ request }) => {
    const { title } = await request.json();
    // The API's 400 for a blank Title, so tests see the same body the app does.
    if (!title.trim()) {
      return HttpResponse.json(
        {
          title: "One or more validation errors occurred.",
          status: 400,
          errors: { title: ["The Title field is required."] },
        },
        { status: 400 },
      );
    }
    return HttpResponse.json(db.addTodo(title), { status: 201 });
  }),

  http.put<{ id: string }, { status: Status }>(
    "/api/todos/:id/status",
    async ({ params, request }) => {
      const { status } = await request.json();
      const todo = db.setStatus(params.id, status);
      return todo ? HttpResponse.json(todo) : new HttpResponse(null, { status: 404 });
    },
  ),
];
