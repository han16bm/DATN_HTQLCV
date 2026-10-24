import { type AuditDto } from "@/types/common";
import seed from "./seed.mock.json";
type SeedEntity = {
  id: string;
  version: number;
  createdAt: string;
  updatedAt: string;
};
type SeedTask = {
  id: string;
  projectId: string;
  title: string;
  createdAt: string;
};
export function createSeedData(
  entity: (id?: string) => SeedEntity,
  now: () => string,
  tasks: SeedTask[],
  projectPermissions: readonly string[],
) {
  const reports = [
    {
      ...entity("r-draft"),
      projectId: "p-main",
      authorId: "u-lan",
      periodType: "DAILY",
      periodStart: "2026-10-23",
      achievements: "Hoàn thiện luồng giao việc và các trạng thái xử lý.",
      blockers: "",
      nextPlan: "Đối chiếu tiêu chí nghiệm thu và nộp kết quả.",
      selectedTaskIds: ["t-3"],
      status: "DRAFT",
      zeroTimeReason: null,
      snapshot: null,
      submittedAt: null,
    },
    {
      ...entity("r-submitted"),
      projectId: "p-main",
      authorId: "u-lan",
      periodType: "DAILY",
      periodStart: "2026-10-22",
      achievements: "Hoàn thành chuẩn hóa biểu mẫu.",
      blockers: "",
      nextPlan: "Tiếp tục thiết kế luồng giao việc.",
      selectedTaskIds: ["t-5"],
      status: "SUBMITTED",
      zeroTimeReason: null,
      submittedAt: "2026-10-22T10:00:00.000Z",
      snapshot: {
        projectId: "p-main",
        periodType: "DAILY",
        periodStart: "2026-10-22",
        periodEndExclusive: "2026-10-22T17:00:00.000Z",
        dataAsOf: "2026-10-22T10:00:00.000Z",
        totalMinutes: 60,
        items: [
          {
            taskId: "t-5",
            title: "Chuẩn hóa biểu mẫu",
            status: "COMPLETED",
            minutes: 60,
          },
        ],
        partialPeriod: false,
      },
    },
  ];
  const attachments = [
    {
      ...entity("a-flow"),
      taskId: "t-4",
      uploadedBy: "u-huy",
      filename: "flow.pdf",
      mimeType: "application/pdf",
      sizeBytes: 590,
      status: "READY",
    },
    {
      ...entity("a-criteria"),
      taskId: "t-3",
      uploadedBy: "u-lan",
      filename: "criteria.pdf",
      mimeType: "application/pdf",
      sizeBytes: 590,
      status: "READY",
    },
  ];
  const plannedOwner = {
    ...entity("m-pm-planned"),
    projectId: "p-planned",
    userId: "u-pm",
    projectRole: "OWNER",
    permissions: [...projectPermissions],
    joinedAt: now(),
    endedAt: null,
  };
  const audits: AuditDto[] = tasks
    .filter((t) => t.projectId === "p-main")
    .map((t) => ({
      id: `audit-${t.id}`,
      entityType: "TASK",
      entityId: t.id,
      actorId: "u-pm",
      action: "Tạo công việc",
      at: t.createdAt,
      before: null,
      after: { title: t.title },
      reason: null,
    }));
  for (const [action, at] of [
    ["Phân công cho Trần Lan", "2026-10-22T01:00:00.000Z"],
    ["Bắt đầu thực hiện", "2026-10-22T02:00:00.000Z"],
    ["Ghi nhận 180 phút", "2026-10-23T09:00:00.000Z"],
  ])
    audits.push({
      id: crypto.randomUUID(),
      entityType: "TASK",
      entityId: "t-3",
      actorId: action.includes("Phân") ? "u-pm" : "u-lan",
      action,
      at,
      before: null,
      after: null,
      reason: null,
    });
  audits.push({
    id: "audit-p-main",
    entityType: "PROJECT",
    entityId: "p-main",
    actorId: "u-pm",
    action: "Triển khai dự án",
    at: "2026-10-01T02:00:00.000Z",
    before: { status: "PLANNED" },
    after: { status: "ACTIVE" },
    reason: null,
  });
  return {
    reports,
    attachments,
    plannedOwner,
    audits,
    defaultPassword: "Mock@12345",
    submissions: seed.submissions.map((s) => ({
      ...s,
      attachmentIds: s.id === "s-pending" ? ["a-flow"] : s.attachmentIds,
    })),
    analysisDetails: seed.analysis.analysisDetails.map((item) => ({
      ...item,
      explanation: {
        ...item.explanation,
        lastSuccess: item.explanation.lastSuccess
          ? {
              ...item.explanation.lastSuccess,
              modelDisplayName: "LLM mô phỏng · MSW",
            }
          : null,
      },
    })),
  };
}
