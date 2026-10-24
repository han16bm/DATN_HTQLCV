import {
  attachmentSchema,
  uploadPolicySchema,
  uploadSchema,
} from "@/features/attachments/schemas/attachments.schema";
import { idSchema } from "@/lib/validation/request.schema";
import { http, HttpResponse } from "msw";
import { attachmentsDb } from "../db/attachments.db";
import {
  authenticatedUser,
  mockCommand,
  mockHandler,
  mockJson,
} from "../utils/handler";
export const attachmentHandlers = [
  http.get(
    "*/api/v1/attachments/policy",
    mockHandler(async ({ request }) => {
      authenticatedUser(request);
      return mockJson(
        request,
        attachmentsDb.getUploadPolicy(),
        uploadPolicySchema,
        200,
      );
    }),
  ),
  http.post(
    "*/api/v1/attachments",
    mockHandler(async ({ request }) => {
      const viewer = authenticatedUser(request);
      const form = await request.formData();
      const payload = uploadSchema.parse({
        taskId: form.get("taskId"),
        file: form.get("file"),
      });
      return mockCommand(
        request,
        {
          operation: "uploadAttachment",
          feature: "attachments",
          viewer,
          permission: null,
          params: {},
          payload,
        },
        async () => {
          return mockJson(
            request,
            await attachmentsDb.uploadAttachment(viewer, payload),
            attachmentSchema,
            201,
          );
        },
      );
    }),
  ),
  http.get(
    "*/api/v1/attachments/:attachmentId",
    mockHandler(async ({ request, params }) => {
      const viewer = authenticatedUser(request);
      const attachmentId = idSchema.parse(params.attachmentId);
      return mockJson(
        request,
        attachmentsDb.getAttachment(viewer, attachmentId),
        attachmentSchema,
        200,
      );
    }),
  ),
  http.get(
    "*/api/v1/attachments/:attachmentId/content",
    mockHandler(async ({ request, params }) => {
      const viewer = authenticatedUser(request);
      const attachmentId = idSchema.parse(params.attachmentId);
      const { file, attachment } = attachmentsDb.downloadAttachment(
        viewer,
        attachmentId,
      );
      return new HttpResponse(file, {
        headers: {
          "Content-Type": attachment.mimeType,
          "Content-Disposition": `attachment; filename="evidence"; filename*=UTF-8''${encodeURIComponent(attachment.filename)}`,
          "Content-Length": String(file.size),
        },
      });
    }),
  ),
];
