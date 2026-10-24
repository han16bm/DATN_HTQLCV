"use client";
import { useGetTaskQuery } from "@/features/tasks/hooks/use-tasks-queries";
import Link from "next/link";
export function ReviewTaskLink({
  taskId,
  submissionId,
  sequence,
}: {
  taskId: string;
  submissionId: string;
  sequence: number;
}) {
  const q = useGetTaskQuery(taskId);
  return (
    <Link
      className="text-link"
      href={`/tasks/${taskId}/submissions/${submissionId}`}
    >
      {q.data?.title ?? taskId} · Lần {sequence}
    </Link>
  );
}
