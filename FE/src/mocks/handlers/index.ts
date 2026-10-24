import { alertHandlers } from "./alerts.handlers";
import { analyticsHandlers } from "./analytics.handlers";
import { attachmentHandlers } from "./attachments.handlers";
import { authHandlers } from "./auth.handlers";
import { organizationHandlers } from "./organization.handlers";
import { projectMemberHandlers } from "./project-members.handlers";
import { projectHandlers } from "./projects.handlers";
import { reportHandlers } from "./reports.handlers";
import { submissionHandlers } from "./submissions.handlers";
import { taskHandlers } from "./tasks.handlers";
import { timeLogHandlers } from "./time-logs.handlers";
import { userHandlers } from "./users.handlers";
export const handlers = [
  ...authHandlers,
  ...userHandlers,
  ...organizationHandlers,
  ...projectHandlers,
  ...projectMemberHandlers,
  ...taskHandlers,
  ...timeLogHandlers,
  ...submissionHandlers,
  ...attachmentHandlers,
  ...reportHandlers,
  ...analyticsHandlers,
  ...alertHandlers,
];
