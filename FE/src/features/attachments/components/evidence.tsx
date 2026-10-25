"use client";
import { Spinner } from "@/components/ui/loading";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { type AttachmentDto } from "@/features/attachments/types/attachments.types";
import { fileSize } from "@/lib/format";
import { useUI } from "@/stores/ui-store";
import { useEffect, useId, useState } from "react";
import { useUploadAttachmentMutation } from "../hooks/use-attachments-mutations";
import {
  useGetAttachmentQuery,
  useGetUploadPolicyQuery,
} from "../hooks/use-attachments-queries";
import { useDownloadAttachment } from "../hooks/use-download-attachment";
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
    <div className="wide section-gap">
      <label htmlFor={id}>Tệp minh chứng</label>
      {policy.data && (
        <p className="small muted">
          Tối đa {policy.data.maxAttachments} tệp, mỗi tệp{" "}
          {fileSize(policy.data.maxBytes)}.{" "}
          {policy.data.allowedMimeTypes
            .map((type) => formats[type] ?? type)
            .join(", ")}
          .
        </p>
      )}
      <input
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
        <p role="status" className="loading-inline">
          <Spinner />
          Đang tải tệp, vui lòng chờ trước khi nộp…
        </p>
      )}
      {items.map((item) => (
        <div className="list-row" key={item.id}>
          <span>{item.filename} · Sẵn sàng</span>
          <button
            type="button"
            onClick={() => {
              const next = items.filter((i) => i.id !== item.id);
              setItems(next);
              onChange(next.map((i) => i.id));
            }}
          >
            Bỏ chọn
          </button>
        </div>
      ))}
      {(error || policy.error) && (
        <QueryErrorState
          error={error ?? policy.error!}
          retry={() => void policy.refetch()}
        />
      )}
    </div>
  );
}
export function EvidenceFile({ attachmentId }: { attachmentId: string }) {
  const query = useGetAttachmentQuery(attachmentId);
  const { pending, error, download } = useDownloadAttachment();
  if (query.isError) return <QueryErrorState error={query.error} />;
  if (!query.data)
    return (
      <p role="status" className="loading-inline">
        <Spinner />
        Đang tải thông tin tệp…
      </p>
    );
  const item = query.data;
  return (
    <div className="section-gap">
      <button
        type="button"
        className="pending-button"
        aria-busy={pending}
        disabled={pending || item.status !== "READY"}
        onClick={() => void download(item.id, item.filename)}
      >
        {pending && <Spinner />}
        {pending ? "Đang tải…" : `Tải ${item.filename}`} (
        {fileSize(item.sizeBytes)})
      </button>
      {error && <QueryErrorState error={error} />}
    </div>
  );
}
