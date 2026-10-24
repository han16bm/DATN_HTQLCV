"use client";
import { useState } from "react";
import { attachmentsService } from "../api/attachments.service";

export function useDownloadAttachment() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  async function download(id: string, filename: string) {
    setPending(true);
    setError(null);
    try {
      const blob = await attachmentsService.downloadAttachment(id);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause : new Error("Không tải được tệp."),
      );
    } finally {
      setPending(false);
    }
  }
  return { pending, error, download };
}
