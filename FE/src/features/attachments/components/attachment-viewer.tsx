"use client";

import { useState } from "react";
import { useGetAttachmentsQuery } from "../hooks/use-attachments-queries";
import { PdfPreview } from "./pdf-preview";

// Một khung xem cho cả nhóm tệp: nhiều tệp thì chọn bằng dropdown thay vì xếp
// chồng nhiều khung, để không phải cuộn xuống cuối.
export function AttachmentViewer({
  attachmentIds,
}: {
  attachmentIds: string[];
}) {
  const [picked, setPicked] = useState<string>();
  const files = useGetAttachmentsQuery(attachmentIds);
  const selected =
    picked && attachmentIds.includes(picked) ? picked : attachmentIds[0];
  return (
    <PdfPreview
      key={selected}
      attachmentId={selected}
      picker={
        attachmentIds.length > 1 ? (
          <label className="viewer-select">
            <span className="sr-only">Tệp báo cáo</span>
            <select
              value={selected}
              onChange={(event) => setPicked(event.target.value)}
            >
              {attachmentIds.map((id, index) => (
                <option key={id} value={id}>
                  {files[index]?.data?.filename ?? `Tệp ${index + 1}`}
                </option>
              ))}
            </select>
          </label>
        ) : undefined
      }
    />
  );
}
