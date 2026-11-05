import { cn } from "@/lib/cn";
import { label } from "@/lib/format";
import type { ReactNode } from "react";

export type Tone = "neutral" | "info" | "success" | "warning" | "danger";

const tones: Record<Tone, string> = {
  neutral: "bg-sunken text-fg-subtle",
  info: "bg-info-bg text-info-fg",
  success: "bg-success-bg text-success-fg",
  warning: "bg-warning-bg text-warning-fg",
  danger: "bg-danger-bg text-danger-fg",
};

const statusTones: Record<string, Tone> = {
  in_progress: "info",
  running: "info",
  queued: "info",
  info: "info",
  completed: "success",
  accepted: "success",
  sufficient: "success",
  ready: "success",
  active: "success",
  resolved: "success",
  succeeded: "success",
  confirmed: "success",
  current: "success",
  submitted: "success",
  pending_review: "warning",
  pending: "warning",
  revision_requested: "warning",
  partial: "warning",
  outdated: "warning",
  unavailable: "warning",
  unread: "warning",
  at_risk: "warning",
  medium: "warning",
  overdue: "danger",
  failed: "danger",
  rejected: "danger",
  locked: "danger",
  high: "danger",
  critical: "danger",
  urgent: "danger",
};

export const statusTone = (value: string): Tone =>
  statusTones[value.toLowerCase()] ?? "neutral";

export function Lozenge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs leading-4 font-semibold whitespace-nowrap",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function StatusLozenge({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  return (
    <Lozenge tone={statusTone(value)} className={className}>
      {label(value)}
    </Lozenge>
  );
}
