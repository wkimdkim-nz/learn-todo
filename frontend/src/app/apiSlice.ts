import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// The one RTK Query API for the app. It starts with no endpoints: each feature
// adds its own with injectEndpoints, in its own file.
export const apiSlice = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: ["Todo", "Tag"],
  refetchOnFocus: true,
  endpoints: () => ({}),
});
