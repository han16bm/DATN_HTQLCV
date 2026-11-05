import { setupWorker } from "msw/browser";
import { resetDatabase } from "./db";
import { handlers } from "./handlers";

resetDatabase(new Date().toISOString());
export const worker = setupWorker(...handlers);
