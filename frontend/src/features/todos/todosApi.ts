import { apiSlice } from "../../app/apiSlice";
import type { Status, Todo } from "./types";

export const todosApi = apiSlice.injectEndpoints({
  endpoints: (build) => ({
    getTodos: build.query<Todo[], void>({
      query: () => "/todos",
      providesTags: ["Todo"],
    }),
    setStatus: build.mutation<Todo, { id: string; status: Status }>({
      query: ({ id, status }) => ({ url: `/todos/${id}/status`, method: "PUT", body: { status } }),
      // Marks every cached Todo list stale, so each one refetches.
      invalidatesTags: ["Todo"],
    }),
  }),
});

export const { useGetTodosQuery, useSetStatusMutation } = todosApi;
