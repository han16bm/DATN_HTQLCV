// Generated from fe-specs contract 0.3.0. Rebuild with npm run contracts.
import { z } from "zod";
import { endpoint } from "@/services/api-contract";
import {
  AttachmentsUploadPolicySchema,
  AttachmentsAttachmentSchema,
} from "../schemas/attachments.schema";

export const getUploadPolicyContract = endpoint({
  ...{
    name: "getUploadPolicy",
    feature: "attachments",
    method: "GET",
    path: "/api/v1/attachments/policy",
    version: false,
    idempotency: false,
    invalidates: [],
    permission: null,
    fields: [],
  },
  params: z.object({}).strict(),
  query: z.object({}).strict(),
  body: z.object({}).strict(),
  response: AttachmentsUploadPolicySchema,
});

export const uploadAttachmentContract = endpoint({
  ...{
    name: "uploadAttachment",
    feature: "attachments",
    method: "POST",
    path: "/api/v1/attachments",
    version: false,
    idempotency: true,
    invalidates: ["attachments"],
    permission: null,
    fields: [
      {
        name: "taskId",
        type: "string",
        required: true,
        rules: "Công việc liên quan; phải đúng dự án và phạm vi.",
      },
      {
        name: "file",
        type: "File (multipart)",
        required: true,
        rules: "File multipart; kiểm tra File, size/MIME bằng policy hiện tại.",
      },
    ],
  },
  params: z.object({}).strict(),
  query: z.object({}).strict(),
  body: z
    .object({ taskId: z.string().min(1), file: z.instanceof(Blob) })
    .strict(),
  response: AttachmentsAttachmentSchema,
});

export const getAttachmentContract = endpoint({
  ...{
    name: "getAttachment",
    feature: "attachments",
    method: "GET",
    path: "/api/v1/attachments/:attachmentId",
    version: false,
    idempotency: false,
    invalidates: [],
    permission: null,
    fields: [],
  },
  params: z
    .object({
      attachmentId: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(100),
    })
    .strict(),
  query: z.object({}).strict(),
  body: z.object({}).strict(),
  response: AttachmentsAttachmentSchema,
});

export const downloadAttachmentContract = endpoint({
  ...{
    name: "downloadAttachment",
    feature: "attachments",
    method: "GET",
    path: "/api/v1/attachments/:attachmentId/content",
    version: false,
    idempotency: false,
    invalidates: [],
    permission: null,
    fields: [],
  },
  params: z
    .object({
      attachmentId: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(100),
    })
    .strict(),
  query: z.object({}).strict(),
  body: z.object({}).strict(),
  response: z.instanceof(Blob),
});
