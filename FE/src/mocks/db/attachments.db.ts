import { type UploadAttachmentInput } from "@/features/attachments/types/attachments.types";
import type { User } from "@/mocks/db/database";
import { ApiError } from "@/types/api/error";
import { uploadPolicy as policy } from "../data/upload-policy.mock";
import { db, entity } from "./database";
import { requireAssignee, requireTask } from "./tasks.db";
function attachmentFor(viewer: User, id: string) {
  const item = db.attachments.find((a) => a.id === id);
  if (!item)
    throw new ApiError(404, "NOT_FOUND", "Không tìm thấy tệp minh chứng.");
  requireTask(viewer, item.taskId);
  if (item.status !== "READY")
    throw new ApiError(409, "FILE_NOT_READY", "Tệp chưa sẵn sàng để tải.");
  return item;
}
export const attachmentsDb = {
  getUploadPolicy() {
    return policy;
  },
  async uploadAttachment(viewer: User, body: UploadAttachmentInput) {
    const task = requireTask(viewer, body.taskId);
    requireAssignee(viewer, task, "IN_PROGRESS");
    if (
      !body.file.size ||
      body.file.size > policy.maxBytes ||
      !policy.allowedMimeTypes.includes(body.file.type)
    )
      throw new ApiError(
        422,
        "INVALID_FILE",
        "Tệp phải đúng định dạng cho phép và không vượt 20 MiB.",
      );
    const bytes = new Uint8Array(await body.file.slice(0, 8).arrayBuffer());
    const prefix = new TextDecoder().decode(bytes);
    const valid =
      body.file.type === "application/pdf"
        ? prefix.startsWith("%PDF-")
        : body.file.type === "image/png"
          ? bytes[0] === 137 && prefix.slice(1, 4) === "PNG"
          : body.file.type === "image/jpeg"
            ? bytes[0] === 255 && bytes[1] === 216
            : body.file.type.includes("wordprocessingml")
              ? prefix.startsWith("PK")
              : !bytes.includes(0);
    if (!valid)
      throw new ApiError(
        422,
        "FILE_TYPE_MISMATCH",
        "Nội dung tệp không khớp định dạng đã khai báo.",
      );
    const file = body.file;
    const filename = file instanceof File ? file.name : "evidence";
    const attachment = {
      ...entity(),
      taskId: task.id,
      uploadedBy: viewer.id,
      filename: filename.replace(/[\r\n/\\]/g, "_"),
      mimeType: file.type,
      sizeBytes: file.size,
      status: "READY" as const,
    };
    db.attachments.push(attachment);
    db.files.set(attachment.id, file);
    return attachment;
  },
  getAttachment(viewer: User, attachmentId: string) {
    return attachmentFor(viewer, attachmentId);
  },
  downloadAttachment(viewer: User, attachmentId: string) {
    const item = attachmentFor(viewer, attachmentId);
    const file = db.files.get(item.id);
    if (!file)
      throw new ApiError(
        404,
        "FILE_CONTENT_MISSING",
        "Không tìm thấy nội dung tệp.",
      );
    return { file, attachment: item };
  },
};
