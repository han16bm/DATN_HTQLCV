import {
  createIpWhitelistEntrySchema,
  ipWhitelistEntrySchema,
  ipWhitelistSchema,
  updateIpWhitelistEntrySchema,
} from "@/features/ip-whitelist/schemas/ip-whitelist.schema";
import {
  createSettingSchema,
  settingQuerySchema,
  settingSchema,
  updateSettingSchema,
} from "@/features/settings/schemas/setting.schema";
import { emptySchema, idSchema } from "@/lib/validation/request.schema";
import { http } from "msw";
import { z } from "zod";
import { ipWhitelistDb, settingsDb } from "../db";
import {
  authenticatedUser,
  mockCommand,
  mockHandler,
  mockJson,
  parseQuery,
} from "./http";

// Cấu hình tập trung và IP whitelist cùng quyền SETTINGS_MANAGE.
const command = { feature: "settings", action: "SETTINGS_MANAGE" as const };
export const settingHandlers = [
  http.get(
    "*/api/settings",
    mockHandler(({ request }) => {
      const viewer = authenticatedUser(request);
      const query = parseQuery(request, settingQuerySchema);
      return mockJson(
        request,
        settingsDb.listSettings(viewer, query),
        z.array(settingSchema),
      );
    }),
  ),
  http.post(
    "*/api/settings",
    mockHandler(async ({ request }) => {
      const viewer = authenticatedUser(request);
      const payload = createSettingSchema.parse(await request.json());
      return mockCommand(
        request,
        { ...command, operation: "createSetting", viewer, params: {}, payload },
        () =>
          mockJson(
            request,
            settingsDb.createSetting(viewer, payload),
            settingSchema,
            201,
          ),
      );
    }),
  ),
  http.patch(
    "*/api/settings/:settingId",
    mockHandler(async ({ request, params }) => {
      const viewer = authenticatedUser(request);
      const settingId = idSchema.parse(params.settingId);
      const payload = updateSettingSchema.parse(await request.json());
      return mockCommand(
        request,
        {
          ...command,
          operation: "updateSetting",
          viewer,
          params: { settingId },
          payload,
        },
        () =>
          mockJson(
            request,
            settingsDb.updateSetting(
              viewer,
              settingId,
              payload,
              request.headers.get("If-Match"),
            ),
            settingSchema,
          ),
      );
    }),
  ),
  http.get(
    "*/api/ip-whitelist",
    mockHandler(({ request }) => {
      const viewer = authenticatedUser(request);
      parseQuery(request, emptySchema);
      return mockJson(
        request,
        ipWhitelistDb.getIpWhitelist(viewer),
        ipWhitelistSchema,
      );
    }),
  ),
  http.post(
    "*/api/ip-whitelist",
    mockHandler(async ({ request }) => {
      const viewer = authenticatedUser(request);
      const payload = createIpWhitelistEntrySchema.parse(await request.json());
      return mockCommand(
        request,
        {
          ...command,
          operation: "createIpWhitelistEntry",
          viewer,
          params: {},
          payload,
        },
        () =>
          mockJson(
            request,
            ipWhitelistDb.createIpWhitelistEntry(viewer, payload),
            ipWhitelistEntrySchema,
            201,
          ),
      );
    }),
  ),
  http.patch(
    "*/api/ip-whitelist/:entryId",
    mockHandler(async ({ request, params }) => {
      const viewer = authenticatedUser(request);
      const entryId = idSchema.parse(params.entryId);
      const payload = updateIpWhitelistEntrySchema.parse(await request.json());
      return mockCommand(
        request,
        {
          ...command,
          operation: "updateIpWhitelistEntry",
          viewer,
          params: { entryId },
          payload,
        },
        () =>
          mockJson(
            request,
            ipWhitelistDb.updateIpWhitelistEntry(
              viewer,
              entryId,
              payload,
              request.headers.get("If-Match"),
            ),
            ipWhitelistEntrySchema,
          ),
      );
    }),
  ),
  http.delete(
    "*/api/ip-whitelist/:entryId",
    mockHandler(async ({ request, params }) => {
      const viewer = authenticatedUser(request);
      const entryId = idSchema.parse(params.entryId);
      return mockCommand(
        request,
        {
          ...command,
          operation: "deleteIpWhitelistEntry",
          viewer,
          params: { entryId },
          payload: {},
        },
        () =>
          mockJson(
            request,
            ipWhitelistDb.deleteIpWhitelistEntry(
              viewer,
              entryId,
              request.headers.get("If-Match"),
            ),
            z.object({ ok: z.literal(true) }),
          ),
      );
    }),
  ),
];
