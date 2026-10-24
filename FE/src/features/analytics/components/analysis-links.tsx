"use client";
import { number } from "@/lib/format";
import { type AnalysisRefDto, type DomainActionDto } from "@/types/common";
import Link from "next/link";

export const metricUnit = (unit: string) =>
  ({
    TASK: "việc",
    COUNT: "lần",
    PERCENT: "%",
    MINUTE: "phút",
    HOUR: "giờ",
    REPORT: "báo cáo",
  })[unit] ?? unit;
export const metricValue = (value: number | null, unit: string) =>
  number(value, metricUnit(unit));
export function AnalysisLink({
  value,
  label = "Xem chi tiết",
}: {
  value: AnalysisRefDto;
  label?: string;
}) {
  return (
    <Link
      className="text-link"
      href={`/analytics/details/${encodeURIComponent(value.analysisId)}`}
    >
      {label}
    </Link>
  );
}
export function actionHref(action: DomainActionDto) {
  const id = encodeURIComponent(action.taskId ?? "");
  switch (action.target) {
    case "TASK_DETAIL":
      return `/tasks/${id}`;
    case "TASK_PLAN":
      return `/tasks/${id}/edit`;
    case "TASK_ASSIGNMENT":
      return `/tasks/${id}#assignment`;
    case "SUBMISSION_REVIEW":
      return `/tasks/${id}/submissions/${encodeURIComponent(action.submissionId ?? "")}`;
    case "REVIEW_QUEUE":
      return "/reviews";
    case "REPORT_DETAIL":
      return `/reports/${encodeURIComponent(action.reportId ?? "")}`;
  }
}
export function DomainActionLink({
  value,
  label = "Mở nguồn",
}: {
  value: DomainActionDto | null;
  label?: string;
}) {
  return value ? (
    <Link className="text-link" href={actionHref(value)}>
      {label}
    </Link>
  ) : null;
}
