"use client";
import { label } from "@/lib/format";
import { ApiError } from "@/types/api/error";
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
    <div className="notice error wide" role="alert">
      <p>{error.message}</p>
      {error instanceof ApiError &&
        error.status === 412 &&
        onConflictReload && (
          <button
            type="button"
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
          </button>
        )}
      {comparison !== undefined && (
        <details open>
          <summary>Bản mới nhất — nội dung bạn nhập được giữ lại</summary>
          <dl>
            {fields.map((config) => {
              if (!(config.name in comparison)) return null;
              const value = comparison[config.name];
              const text = (value: unknown) =>
                config.options?.find((option) => option.value === value)
                  ?.label ?? label(String(value));
              return (
                <div key={config.name}>
                  <dt>{config.label}</dt>
                  <dd>
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
            <button
              type="button"
              onClick={() => {
                onConflictAccept();
                setError(null);
              }}
            >
              Đã đối chiếu, tiếp tục chỉnh sửa
            </button>
          )}
        </details>
      )}
    </div>
  );
}
