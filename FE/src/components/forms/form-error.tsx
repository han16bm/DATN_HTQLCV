"use client";
import { ApiError } from "@/types/api/error";
import { useState, type Dispatch, type SetStateAction } from "react";
import { z } from "zod";
import type { FormField } from "./form.types";
export function FormError({
  error,
  setError,
  fields,
  onConflictReload,
  onConflictAccept,
}: {
  error: Error;
  setError: Dispatch<SetStateAction<Error | null>>;
  fields: FormField[];
  onConflictReload?: () => Promise<unknown>;
  onConflictAccept?: () => void;
}) {
  const [comparison, setComparison] = useState<unknown>(undefined);
  const values = z.record(z.string(), z.unknown()).safeParse(comparison);
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
              if (!values.success || !(config.name in values.data)) return null;
              const value = values.data[config.name];
              return (
                <div key={config.name}>
                  <dt>{config.label}</dt>
                  <dd>
                    {config.options?.find((o) => o.value === value)?.label ??
                      (value === null ? "Không có" : String(value))}
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
