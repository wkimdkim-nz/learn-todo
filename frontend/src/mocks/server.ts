import { setupServer } from "msw/node";
import { handlers } from "./handlers";

// Intercepts the requests tests make, in Node, and answers them with the handlers.
export const server = setupServer(...handlers);
