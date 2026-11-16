"use client";

import { Select } from "@/components/ui/select";
import { useState } from "react";
import { useGetAttachmentsQuery } from "../hooks/use-attachments-queries";
import { PdfPreview } from "./pdf-preview";

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
          <label className="min-w-0 max-w-[280px] flex-1">
            <span className="sr-only">Tệp báo cáo</span>
            <Select
              value={selected}
              onChange={(event) => setPicked(event.target.value)}
            >
              {attachmentIds.map((id, index) => (
                <option key={id} value={id}>
                  {files[index]?.data?.filename ?? `Tệp ${index + 1}`}
                </option>
              ))}
            </Select>
          </label>
        ) : undefined
      }
    />
  );
}
