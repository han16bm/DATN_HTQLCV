"use client";

import { Spinner } from "@/components/ui/loading";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { Panel } from "@/components/ui/page";
import { fileSize } from "@/lib/format";
import { ExternalLink, FileText } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
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
  attachmentId = "",
  picker,
}: {
  attachmentId?: string;
  picker?: ReactNode;
}) {
  const meta = useGetAttachmentQuery(attachmentId);
  const { pending, error, download } = useDownloadAttachment();
  const [open, setOpen] = useState(true);
  const item = meta.isError ? undefined : meta.data;
  const pdf = item?.status === "READY" && /\.pdf$/i.test(item.filename);
  const content = useGetAttachmentContentQuery(attachmentId, open && pdf);
  const url = useBlobUrl(open && pdf ? content.data : undefined);
  return (
    <Panel
      title="Báo cáo đính kèm"
      className="pdf-preview"
      actions={
        item && (
          <div className="actions pdf-actions">
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
        )
      }
    >
      {!attachmentId && (
        <div className="pdf-empty">
          <FileText size={28} aria-hidden="true" />
          <p>Chưa có báo cáo đính kèm.</p>
        </div>
      )}
      {(picker || item) && (
        <div className="pdf-file">
          <FileText size={16} aria-hidden="true" />
          {picker ??
            (item && (
              <span className="pdf-name" title={item.filename}>
                {item.filename}
              </span>
            ))}
          {item && (
            <span className="small muted">{fileSize(item.sizeBytes)}</span>
          )}
        </div>
      )}
      {meta.isError && (
        <QueryErrorState error={meta.error} retry={meta.refetch} />
      )}
      {attachmentId && !meta.isError && !item && (
        <p role="status" className="loading-inline">
          <Spinner />
          Đang tải thông tin tệp…
        </p>
      )}
      {item && !pdf && (
        <p className="small muted">
          Tệp này không phải PDF nên không xem trước được; hãy tải xuống.
        </p>
      )}
      {pdf && open && content.isError && (
        <QueryErrorState error={content.error} retry={content.refetch} />
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
      {item && error && <QueryErrorState error={error} />}
    </Panel>
  );
}
