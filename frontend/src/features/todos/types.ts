// Mirrors the API's TodoResponse. Status arrives as its name because the API
// serializes enums as strings.
export type Status = "Active" | "Completed";

export type Todo = {
  id: string;
  title: string;
  description: string | null;
  status: Status;
};
