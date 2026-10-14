import { apiSlice } from "../../app/apiSlice";
import type { Tag } from "./types";

export const tagsApi = apiSlice.injectEndpoints({
  endpoints: (build) => ({
    getTags: build.query<Tag[], void>({
      query: () => "/tags",
      providesTags: ["Tag"],
    }),
    addTag: build.mutation<Tag, { name: string }>({
      query: (body) => ({ url: "/tags", method: "POST", body }),
      // Every Tag change marks the Todos stale too, because each Todo embeds its Tags' names.
      invalidatesTags: ["Tag", "Todo"],
    }),
  }),
});

export const { useGetTagsQuery, useAddTagMutation } = tagsApi;
