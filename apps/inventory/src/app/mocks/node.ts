import { setupServer } from "msw/node";
import { handlers } from "./handlers";

// Use this in Jest / Vitest tests
export const server = setupServer(...handlers);
