import { apiSlice } from "../../app/apiSlice";
import type { Todo } from "./types";

export const todosApi = apiSlice.injectEndpoints({
  endpoints: (build) => ({
    getTodos: build.query<Todo[], void>({
      query: () => "/todos",
      providesTags: ["Todo"],
    }),
  }),
});

export const { useGetTodosQuery } = todosApi;
