"use client";

import { Button, buttonClass } from "@/components/ui/button";
import { Spinner } from "@/components/ui/loading";
import { Panel } from "@/components/ui/page";
import { QueryErrorState } from "@/components/ui/query-error-state";
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
      className="grid"
      actions={
        item && (
          <div className="flex flex-wrap items-center gap-2">
            {pdf && (
              <Button
                aria-expanded={open}
                className="h-7 px-2"
                onClick={() => setOpen(!open)}
              >
                {open ? "Thu gọn" : "Xem trước"}
              </Button>
            )}
            {url && (
              <a
                className={`${buttonClass()} h-7 px-2`}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="size-3.5" aria-hidden="true" />
                Mở tab mới
              </a>
            )}
            <Button
              className="h-7 px-2"
              aria-busy={pending}
              disabled={pending || item.status !== "READY"}
              onClick={() => void download(item.id, item.filename)}
            >
              {pending && <Spinner />}
              Tải xuống
            </Button>
          </div>
        )
      }
    >
      <div className="grid gap-2">
        {!attachmentId && (
          <div
            data-slot="pdf-empty"
            className="flex min-h-36 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line bg-sunken/50 p-6 text-center text-sm text-fg-subtle"
          >
            <FileText className="size-7" aria-hidden="true" />
            <p className="m-0">Chưa có báo cáo đính kèm.</p>
          </div>
        )}
        {(picker || item) && (
          <div className="flex min-w-0 items-center gap-2">
            <FileText
              className="size-4 shrink-0 text-danger-fg"
              aria-hidden="true"
            />
            {picker ??
              (item && (
                <span
                  className="block min-w-0 max-w-[30ch] truncate text-sm font-medium"
                  title={item.filename}
                >
                  {item.filename}
                </span>
              ))}
            {item && (
              <span className="shrink-0 text-xs whitespace-nowrap text-fg-subtle">
                {fileSize(item.sizeBytes)}
              </span>
            )}
          </div>
        )}
        {meta.isError && (
          <QueryErrorState error={meta.error} retry={meta.refetch} />
        )}
        {attachmentId && !meta.isError && !item && (
          <p
            role="status"
            className="m-0 inline-flex items-center gap-2 text-sm"
          >
            <Spinner />
            Đang tải thông tin tệp…
          </p>
        )}
        {item && !pdf && (
          <p className="m-0 text-xs text-fg-subtle">
            Tệp này không phải PDF nên không xem trước được; hãy tải xuống.
          </p>
        )}
        {pdf && open && content.isError && (
          <QueryErrorState error={content.error} retry={content.refetch} />
        )}
        {pdf && open && !content.isError && !url && (
          <p
            role="status"
            className="m-0 inline-flex items-center gap-2 text-sm"
          >
            <Spinner />
            Đang tải bản xem trước…
          </p>
        )}
        {pdf && open && url && (
          <iframe
            className="block h-[min(65vh,600px)] min-h-[360px] w-full rounded-md border border-line bg-[#525659]"
            title={`Xem trước ${item.filename}`}
            src={url}
          />
        )}
        {item && error && <QueryErrorState error={error} />}
      </div>
    </Panel>
  );
}
