// Generated from fe-specs contract 0.3.0. Rebuild with npm run contracts.
import { z } from "zod";
import { endpoint } from "@/services/api-contract";
import {
  AlertsAlertStatusSchema,
  AlertsAlertSchema,
} from "../schemas/alerts.schema";

import { page } from "@/types/common";
export const listAlertsContract = endpoint({
  ...{
    name: "listAlerts",
    feature: "alerts",
    method: "GET",
    path: "/api/v1/alerts",
    version: false,
    idempotency: false,
    invalidates: [],
    permission: "ANALYTICS_VIEW",
    fields: [],
  },
  params: z.object({}).strict(),
  query: z
    .object({
      page: z.number().int().safe().min(1).optional().default(1),
      pageSize: z.number().int().safe().min(1).max(100).optional().default(20),
      q: z.string().trim().max(255).optional(),
      projectId: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(100)
        .optional(),
      status: AlertsAlertStatusSchema.optional(),
      severity: z
        .enum(["INFO", "LOW", "MEDIUM", "HIGH", "CRITICAL"])
        .optional(),
    })
    .strict(),
  body: z.object({}).strict(),
  response: page(AlertsAlertSchema),
});

export const getAlertContract = endpoint({
  ...{
    name: "getAlert",
    feature: "alerts",
    method: "GET",
    path: "/api/v1/alerts/:alertId",
    version: false,
    idempotency: false,
    invalidates: [],
    permission: "ANALYTICS_VIEW",
    fields: [],
  },
  params: z
    .object({
      alertId: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(100),
    })
    .strict(),
  query: z.object({}).strict(),
  body: z.object({}).strict(),
  response: AlertsAlertSchema,
});

export const updateAlertContract = endpoint({
  ...{
    name: "updateAlert",
    feature: "alerts",
    method: "PATCH",
    path: "/api/v1/alerts/:alertId",
    version: true,
    idempotency: true,
    invalidates: ["alerts", "analytics"],
    permission: "ALERTS_MANAGE",
    fields: [
      {
        name: "status",
        type: "enum(READ, IN_PROGRESS, RESOLVED, DISMISSED)",
        required: true,
        rules:
          "Trạng thái theo enum của đúng model; không dùng chung enum cho mọi phân hệ.",
      },
      {
        name: "resolutionNote",
        type: "string",
        required: false,
        rules:
          "độ dài ≥ 1; độ dài ≤ 2000; Hướng xử lý/lý do; bắt buộc với trạng thái xử lý khác READ.",
      },
    ],
  },
  params: z
    .object({
      alertId: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(100),
    })
    .strict(),
  query: z.object({}).strict(),
  body: z
    .object({
      status: z.enum(["READ", "IN_PROGRESS", "RESOLVED", "DISMISSED"]),
      resolutionNote: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(2000)
        .optional(),
    })
    .strict(),
  response: AlertsAlertSchema,
});
