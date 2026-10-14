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

  http.get("/api/tags", () => HttpResponse.json(db.allTags())),

  http.post<never, { name: string }>("/api/tags", async ({ request }) => {
    const { name } = await request.json();
    // The API's 400 for a blank name.
    if (!name.trim()) {
      return HttpResponse.json(
        {
          title: "One or more validation errors occurred.",
          status: 400,
          errors: { name: ["The Name field is required."] },
        },
        { status: 400 },
      );
    }
    // The API's 409 for a name taken in any case, naming the Tag that has it.
    const existing = db.findTag(name);
    if (existing) {
      return HttpResponse.json(
        {
          title: "Conflict",
          status: 409,
          detail: `A Tag named "${existing.name}" already exists.`,
        },
        { status: 409 },
      );
    }
    return HttpResponse.json(db.addTag(name), { status: 201 });
  }),
];
