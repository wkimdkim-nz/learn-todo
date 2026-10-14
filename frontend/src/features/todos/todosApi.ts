import { apiSlice } from "../../app/apiSlice";
import type { Status, Todo } from "./types";

export const todosApi = apiSlice.injectEndpoints({
  endpoints: (build) => ({
    getTodos: build.query<Todo[], void>({
      query: () => "/todos",
      providesTags: ["Todo"],
    }),
    addTodo: build.mutation<Todo, { title: string; tagIds: string[] }>({
      query: (body) => ({ url: "/todos", method: "POST", body }),
      invalidatesTags: ["Todo"],
    }),
    setStatus: build.mutation<Todo, { id: string; status: Status }>({
      query: ({ id, status }) => ({ url: `/todos/${id}/status`, method: "PUT", body: { status } }),
      // Marks every cached Todo list stale, so each one refetches.
      invalidatesTags: ["Todo"],
    }),
  }),
});

export const { useGetTodosQuery, useAddTodoMutation, useSetStatusMutation } = todosApi;
