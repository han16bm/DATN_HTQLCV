"use client";
import { Button } from "@/components/ui/button";
import { label } from "@/lib/format";
import { ApiError } from "@/types/api/error";
import { CircleAlert } from "lucide-react";
import { useState, type Dispatch, type SetStateAction } from "react";
import type { CompareField } from "./form.types";

export function FormError({
  error,
  setError,
  fields,
  onConflictReload,
  onConflictAccept,
}: {
  error: Error;
  setError: Dispatch<SetStateAction<Error | null>>;
  fields: CompareField[];
  onConflictReload?: () => Promise<Record<string, unknown>>;
  onConflictAccept?: () => void;
}) {
  const [comparison, setComparison] = useState<Record<string, unknown>>();
  return (
    <div
      role="alert"
      className="col-span-12 grid gap-3 rounded-lg border border-danger-bold/40 bg-danger-bg p-4 text-sm"
    >
      <p className="m-0 flex items-start gap-2 font-medium text-danger-fg">
        <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        {error.message}
      </p>
      {error instanceof ApiError &&
        error.status === 412 &&
        onConflictReload && (
          <div>
            <Button
              onClick={async () => {
                try {
                  setComparison(await onConflictReload());
                } catch (cause) {
                  setError(
                    cause instanceof Error
                      ? cause
                      : new Error("Không tải được phiên bản mới."),
                  );
                }
              }}
            >
              Tải bản mới để đối chiếu
            </Button>
          </div>
        )}
      {comparison !== undefined && (
        <details open className="grid gap-2 text-fg">
          <summary className="cursor-pointer font-medium">
            Bản mới nhất — nội dung bạn nhập được giữ lại
          </summary>
          <dl className="m-0 grid gap-2 rounded-md bg-surface p-3">
            {fields.map((config) => {
              if (!(config.name in comparison)) return null;
              const value = comparison[config.name];
              const text = (value: unknown) =>
                config.options?.find((option) => option.value === value)
                  ?.label ?? label(String(value));
              return (
                <div
                  key={config.name}
                  className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-3"
                >
                  <dt className="text-fg-subtle">{config.label}</dt>
                  <dd className="m-0 text-left break-words">
                    {value === null || value === undefined
                      ? "Không có"
                      : Array.isArray(value)
                        ? value.map(text).join(", ") || "Không có"
                        : text(value)}
                  </dd>
                </div>
              );
            })}
          </dl>
          {onConflictAccept && (
            <div>
              <Button
                onClick={() => {
                  onConflictAccept();
                  setError(null);
                }}
              >
                Đã đối chiếu, tiếp tục chỉnh sửa
              </Button>
            </div>
          )}
        </details>
      )}
    </div>
  );
}
