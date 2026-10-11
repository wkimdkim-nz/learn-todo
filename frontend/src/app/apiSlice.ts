import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// The one RTK Query API for the app. It starts with no endpoints: each feature
// adds its own with injectEndpoints, in its own file.
export const apiSlice = createApi({
  // Absolute, because tests run in Node, whose fetch can't resolve "/api" alone.
  // In the browser this is still the page's own origin, so Vite's proxy applies.
  baseQuery: fetchBaseQuery({ baseUrl: new URL("/api", location.origin).href }),
  tagTypes: ["Todo", "Tag"],
  refetchOnFocus: true,
  endpoints: () => ({}),
});
