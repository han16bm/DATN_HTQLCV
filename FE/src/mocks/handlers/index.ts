import { authHandlers } from "./auth.handlers";
import { taskHandlers } from "./tasks.handlers";
import { timeLogHandlers } from "./time-logs.handlers";
import { submissionHandlers } from "./submissions.handlers";
export const handlers = [
  ...authHandlers,
  ...taskHandlers,
  ...timeLogHandlers,
  ...submissionHandlers,
];
