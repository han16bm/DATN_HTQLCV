import { scheduleAlertRules } from "./alerts.db";
import { db, restoreDatabase } from "./database";
let queue = Promise.resolve();
export async function withMockTransaction<T>(
  execute: (commit: () => void) => Promise<T>,
  context: { feature: string; scenario: string | null },
): Promise<T> {
  const previous = queue;
  let release = () => {};
  queue = new Promise<void>((resolve) => {
    release = resolve;
  });
  await previous;
  const backup = structuredClone(db);
  let committed = false;
  try {
    const result = await execute(() => {
      committed = true;
    });
    if (committed) {
      if (context.scenario === "notification-failed") {
        for (const notice of db.outbox.slice(backup.outbox.length)) {
          notice.status = "FAILED";
          notice.attemptCount = 1;
        }
      }
      if (
        [
          "tasks",
          "time-logs",
          "submissions",
          "reports",
          "projects",
          "project-members",
        ].includes(context.feature)
      )
        scheduleAlertRules();
    }
    return result;
  } catch (error) {
    restoreDatabase(backup);
    throw error;
  } finally {
    release();
  }
}
