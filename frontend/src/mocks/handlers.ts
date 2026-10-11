import { http, HttpResponse } from "msw";
import type { Status } from "../features/todos/types";
import { db } from "./db";

// One handler per API endpoint the frontend calls, answering from the db.
export const handlers = [
  http.get("/api/todos", () => HttpResponse.json(db.allTodos())),

  http.put<{ id: string }, { status: Status }>(
    "/api/todos/:id/status",
    async ({ params, request }) => {
      const { status } = await request.json();
      const todo = db.setStatus(params.id, status);
      return todo ? HttpResponse.json(todo) : new HttpResponse(null, { status: 404 });
    },
  ),
];
