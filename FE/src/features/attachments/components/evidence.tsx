"use client";

import { Spinner } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { fileSize } from "@/lib/format";
import { useUI } from "@/stores/ui-store";
import { useEffect, useId, useState } from "react";
import { useUploadAttachmentMutation } from "../hooks/use-attachments-mutations";
import { useGetUploadPolicyQuery } from "../hooks/use-attachments-queries";
import { type AttachmentDto } from "../types/attachments.types";
const formats: Record<string, string> = {
  "application/pdf": "PDF",
  "image/png": "PNG",
  "image/jpeg": "JPEG",
  "text/plain": "TXT",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "DOCX",
};

export function EvidenceUploader({
  taskId,
  onChange,
  onBusyChange,
}: {
  taskId: string;
  onChange: (ids: string[]) => void;
  onBusyChange: (busy: boolean) => void;
}) {
  const policy = useGetUploadPolicyQuery();
  const upload = useUploadAttachmentMutation();
  const [items, setItems] = useState<AttachmentDto[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const id = useId();
  const markDirty = useUI((s) => s.markDirty);
  useEffect(() => {
    markDirty(id, items.length > 0);
    return () => markDirty(id, false);
  }, [id, items.length, markDirty]);
  return (
    <div className="col-span-full mt-4">
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-fg">
        Tệp minh chứng
      </label>
      {policy.data && (
        <p className="text-xs text-fg-subtle">
          Tối đa {policy.data.maxAttachments} tệp, mỗi tệp{" "}
          {fileSize(policy.data.maxBytes)}.{" "}
          {policy.data.allowedMimeTypes
            .map((type) => formats[type] ?? type)
            .join(", ")}
          .
        </p>
      )}
      <Input
        size="form"
        id={id}
        type="file"
        disabled={
          !policy.data ||
          upload.isPending ||
          items.length >= policy.data.maxAttachments
        }
        accept={policy.data?.allowedMimeTypes.join(",")}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file || !policy.data) return;
          setError(null);
          if (
            !file.size ||
            file.size > policy.data.maxBytes ||
            !policy.data.allowedMimeTypes.includes(file.type)
          ) {
            setError(new Error("Định dạng hoặc dung lượng tệp không hợp lệ."));
            return;
          }
          onBusyChange(true);
          try {
            const result = await upload.mutateAsync({ taskId, file });
            const next = [...items, result];
            setItems(next);
            onChange(next.map((i) => i.id));
          } catch (cause) {
            setError(
              cause instanceof Error ? cause : new Error("Tải tệp thất bại."),
            );
          } finally {
            onBusyChange(false);
          }
        }}
      />
      {upload.isPending && (
        <p role="status" className="inline-flex items-center gap-2">
          <Spinner />
          Đang tải tệp, vui lòng chờ trước khi nộp…
        </p>
      )}
      {items.map((item) => (
        <div
          className="mt-2 flex items-center justify-between gap-4 rounded-md border border-line bg-sunken/50 px-3 py-1.5 text-sm max-sm:flex-wrap"
          key={item.id}
        >
          <span>{item.filename} · Sẵn sàng</span>
          <Button
            type="button"
            onClick={() => {
              const next = items.filter((i) => i.id !== item.id);
              setItems(next);
              onChange(next.map((i) => i.id));
            }}
          >
            Bỏ chọn
          </Button>
        </div>
      ))}
      {(error || policy.error) && (
        <QueryErrorState
          error={error ?? policy.error!}
          retry={policy.refetch}
        />
      )}
    </div>
  );
}
