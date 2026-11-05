import { setupServer } from "msw/node";
import { resetDatabase } from "./db";
import { handlers } from "./handlers";
import { resetReceipts } from "./handlers/http";
export const server = setupServer(...handlers);

export function resetMockState() {
  resetDatabase();
  resetReceipts();
}
