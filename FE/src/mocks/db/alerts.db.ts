import {
  type AlertQuery,
  type UpdateAlertInput,
} from "@/features/alerts/types/alerts.types";
import { alertDTO } from "@/mocks/db/analytics/alert-projection";
import type { User } from "@/mocks/db/database";
import { ApiError } from "@/types/api/error";
import { paginate } from "../utils/pagination";
import {
  audit,
  can,
  db,
  entity,
  notify,
  now,
  schedule,
  touch,
} from "./database";
import { requireVersion } from "./version";
export function evaluateAlertRules() {
  for (const task of db.tasks) {
    const open = !["COMPLETED", "CANCELLED"].includes(task.status);
    const rules = [
      {
        type: "OVERDUE" as const,
        active: open && now() > task.dueAt,
        evidence: ["Công việc còn mở sau hạn hoàn thành."],
      },
      {
        type: "BOTTLENECK" as const,
        active:
          task.status === "PENDING_REVIEW" &&
          Date.parse(now()) - Date.parse(task.statusChangedAt) >= 24 * 3600000,
        evidence: [
          "Kết quả chờ nghiệm thu từ 24 giờ liên tục; thời gian này không cộng giờ công.",
        ],
      },
    ];
    for (const rule of rules) {
      const previous = db.alerts.find(
        (a) => a.taskId === task.id && a.type === rule.type,
      );
      if (previous) {
        if (previous.conditionActive !== rule.active) {
          previous.conditionActive = rule.active;
          previous.dataAsOf = now();
          touch(previous);
        }
        continue;
      }
      if (!rule.active) continue;
      db.alerts.push({
        ...entity(),
        projectId: task.projectId,
        taskId: task.id,
        type: rule.type,
        severity: "HIGH",
        status: "UNREAD",
        conditionActive: true,
        evidence: rule.evidence,
        dataAsOf: now(),
        methodVersion: "trial-rules-v1",
        resolutionNote: null,
        handledBy: null,
        handledAt: null,
      });
      db.revision++;
      const owner = db.projects.find((p) => p.id === task.projectId)?.ownerId;
      if (owner) notify(owner);
    }
  }
}
export function scheduleAlertRules() {
  schedule(evaluateAlertRules, 50);
}
function requireAlert(actor: User, id: string, edit = false) {
  const item = db.alerts.find((a) => a.id === id);
  if (!item) throw new ApiError(404, "NOT_FOUND", "Không tìm thấy cảnh báo.");
  if (
    !can(actor, "ANALYTICS_VIEW", item.projectId) ||
    (edit && !can(actor, "ALERTS_MANAGE", item.projectId))
  )
    throw new ApiError(
      403,
      "FORBIDDEN",
      "Không có quyền xem hoặc xử lý cảnh báo trong dự án.",
    );
  return item;
}
export const alertsDb = {
  listAlerts(viewer: User, query: AlertQuery) {
    return paginate(
      db.alerts
        .filter(
          (a) =>
            can(viewer, "ANALYTICS_VIEW", a.projectId) &&
            (!query.projectId || a.projectId === query.projectId) &&
            (!query.status || a.status === query.status) &&
            (!query.severity || a.severity === query.severity) &&
            (!query.q ||
              `${a.type} ${db.tasks.find((t) => t.id === a.taskId)?.title ?? ""}`
                .toLowerCase()
                .includes(query.q.toLowerCase())),
        )
        .map((a) => alertDTO(a, viewer)),
      query,
    );
  },
  getAlert(viewer: User, alertId: string) {
    return alertDTO(requireAlert(viewer, alertId), viewer);
  },
  updateAlert(
    viewer: User,
    alertId: string,
    body: UpdateAlertInput,
    expectedVersion: string | null,
  ) {
    const item = requireAlert(viewer, alertId, true);
    requireVersion(expectedVersion, item);
    if (body.status !== "READ" && !body.resolutionNote?.trim())
      throw new ApiError(
        422,
        "RESOLUTION_NOTE_REQUIRED",
        "Cần ghi hướng xử lý hoặc lý do.",
        [
          {
            path: ["resolutionNote"],
            message: "Trạng thái này cần hướng xử lý hoặc lý do.",
          },
        ],
      );
    const before = { status: item.status, resolutionNote: item.resolutionNote };
    item.status = body.status;
    item.resolutionNote = body.resolutionNote ?? null;
    item.handledBy = viewer.id;
    item.handledAt = now();
    touch(item);
    audit(viewer.id, "ALERT", item.id, "Xử lý cảnh báo", before, {
      status: item.status,
      resolutionNote: item.resolutionNote,
    });
    return alertDTO(item, viewer);
  },
};
