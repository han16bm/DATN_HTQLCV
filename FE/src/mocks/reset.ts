import { resetDatabase } from "./db/database";
import { resetReceipts } from "./utils/handler";
export function resetMockState() {
  resetDatabase();
  resetReceipts();
}
