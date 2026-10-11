import { http, HttpResponse } from "msw";
import { db } from "./db";

// One handler per API endpoint the frontend calls, answering from the db.
export const handlers = [http.get("/api/todos", () => HttpResponse.json(db.todos()))];
