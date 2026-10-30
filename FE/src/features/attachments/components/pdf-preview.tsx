"use client";

import { Spinner } from "@/components/ui/loading";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { fileSize } from "@/lib/format";
import { ExternalLink, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import {
  useGetAttachmentContentQuery,
  useGetAttachmentQuery,
} from "../hooks/use-attachments-queries";
import { useDownloadAttachment } from "../hooks/use-download-attachment";

// Địa chỉ tạm của tệp đã tải qua API (có xác thực); thu hồi khi đổi hoặc đóng.
function useBlobUrl(blob: Blob | undefined) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!blob) return;
    const next = URL.createObjectURL(
      new Blob([blob], { type: "application/pdf" }),
    );
    setUrl(next);
    return () => {
      URL.revokeObjectURL(next);
      setUrl(null);
    };
  }, [blob]);
  return url;
}

// Khung xem trước một tệp PDF đính kèm; tệp khác PDF chỉ cho tải xuống.
export function PdfPreview({
  attachmentId,
  defaultOpen = false,
}: {
  attachmentId: string;
  defaultOpen?: boolean;
}) {
  const meta = useGetAttachmentQuery(attachmentId);
  const { pending, error, download } = useDownloadAttachment();
  const [open, setOpen] = useState(defaultOpen);
  const item = meta.data;
  const pdf = Boolean(
    item && item.status === "READY" && /\.pdf$/i.test(item.filename),
  );
  const content = useGetAttachmentContentQuery(attachmentId, open && pdf);
  const url = useBlobUrl(open ? content.data : undefined);
  if (meta.isError) return <QueryErrorState error={meta.error} />;
  if (!item)
    return (
      <p role="status" className="loading-inline">
        <Spinner />
        Đang tải thông tin tệp…
      </p>
    );
  return (
    <div className="pdf-preview">
      <div className="pdf-toolbar">
        <FileText size={18} aria-hidden="true" />
        <div className="pdf-name">
          <strong>{item.filename}</strong>
          <span className="small muted">{fileSize(item.sizeBytes)}</span>
        </div>
        <div className="actions">
          {pdf && (
            <button
              type="button"
              aria-expanded={open}
              onClick={() => setOpen(!open)}
            >
              {open ? "Thu gọn" : "Xem trước"}
            </button>
          )}
          {url && (
            <a
              className="button"
              href={url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink size={14} aria-hidden="true" />
              Mở tab mới
            </a>
          )}
          <button
            type="button"
            className="pending-button"
            aria-busy={pending}
            disabled={pending || item.status !== "READY"}
            onClick={() => void download(item.id, item.filename)}
          >
            {pending && <Spinner />}
            Tải xuống
          </button>
        </div>
      </div>
      {!pdf && (
        <p className="small muted">
          Tệp này không phải PDF nên không xem trước được; hãy tải xuống.
        </p>
      )}
      {pdf && open && content.isError && (
        <QueryErrorState
          error={content.error}
          retry={() => void content.refetch()}
        />
      )}
      {pdf && open && !content.isError && !url && (
        <p role="status" className="loading-inline">
          <Spinner />
          Đang tải bản xem trước…
        </p>
      )}
      {pdf && open && url && (
        <iframe
          className="pdf-frame"
          title={`Xem trước ${item.filename}`}
          src={url}
        />
      )}
      {error && <QueryErrorState error={error} />}
    </div>
  );
}
