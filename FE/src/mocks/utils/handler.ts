import { http, HttpResponse, delay } from "msw";
import { z } from "zod";
import type { ContractRequest, Endpoint } from "@/services/api-contract";
import { ApiError } from "@/types/api/error";
import { db, restoreDatabase, type User } from "../db/database";
import { MockReply, meta, toMockErrorResponse } from "./http-response";

const receipts = new Map<
  string,
  { fingerprint: string; data: unknown; status: number; headers?: HeadersInit }
>();
export function resetReceipts() {
  receipts.clear();
}
export function authenticatedUser(request: Request): User {
  const value = request.headers.get("Authorization")?.replace(/^Bearer /, "");
  const user = db.users.find((u) => value === `mock-${u.id}`);
  if (!user || db.revoked.has(value ?? ""))
    throw new ApiError(401, "UNAUTHORIZED", "Phiên đăng nhập đã hết hạn.");
  if (user.status === "LOCKED")
    throw new ApiError(403, "ACCOUNT_LOCKED", "Tài khoản đang bị khóa.");
  return user;
}
export function requireVersion(request: Request, entity: { version: number }) {
  const header = request.headers.get("If-Match");
  if (!header)
    throw new ApiError(428, "VERSION_REQUIRED", "Thiếu phiên bản dữ liệu.");
  if (header !== `"${entity.version}"`)
    throw new ApiError(
      412,
      "VERSION_CONFLICT",
      "Dữ liệu đã được thay đổi. Giữ bản đang nhập và tải bản mới để đối chiếu.",
    );
}
type HandlerInput<C extends Endpoint> = {
  params: z.output<C["params"]>;
  query: z.output<C["query"]>;
  body: z.output<C["body"]>;
  request: Request;
  cookies: Record<string, string>;
};
export function createHandler<C extends Endpoint>(
  contract: C,
  resolve: (input: HandlerInput<C>) => unknown | Promise<unknown>,
) {
  const method = {
    GET: http.get,
    POST: http.post,
    PATCH: http.patch,
    PUT: http.put,
  }[contract.method];
  if (!method) throw new Error(`Unsupported HTTP method ${contract.method}`);
  return method(`*${contract.path}`, async ({ request, params, cookies }) => {
    let backup: typeof db | undefined;
    try {
      const scenario = request.headers.get("X-Mock-Scenario");
      if (scenario === "slow") await delay(1500);
      if (scenario === "server-error")
        throw new ApiError(
          503,
          "SERVICE_UNAVAILABLE",
          "Máy chủ tạm thời chưa sẵn sàng.",
        );
      if (scenario === "rate-limit")
        throw new ApiError(
          429,
          "RATE_LIMITED",
          "Vui lòng chờ trước khi thử lại.",
        );
      // MSW exposes the leading origin wildcard as params['0']; it is not a Gateway path field.
      const pathParams = Object.fromEntries(
        [...contract.path.matchAll(/:([A-Za-z]\w*)/g)].map((match) => [
          match[1],
          params[match[1]],
        ]),
      );
      const parsedParams = contract.params.parse(pathParams);
      const rawQuery: Record<string, unknown> = Object.fromEntries(
        new URL(request.url).searchParams,
      );
      for (const key of ["page", "pageSize"])
        if (typeof rawQuery[key] === "string" && /^\d+$/.test(rawQuery[key]))
          rawQuery[key] = Number(rawQuery[key]);
      if (rawQuery.overdue === "true") rawQuery.overdue = true;
      else if (rawQuery.overdue === "false") rawQuery.overdue = false;
      const parsedQuery = contract.query.parse(rawQuery);
      let rawBody: unknown = {};
      if (contract.method !== "GET") {
        if (contract.name === "uploadAttachment") {
          const form = await request.formData();
          rawBody = { taskId: form.get("taskId"), file: form.get("file") };
        } else rawBody = await request.json().catch(() => ({}));
      }
      const parsedBody = contract.body.parse(rawBody);
      const key = request.headers.get("Idempotency-Key");
      let receiptKey: string | undefined;
      const fingerprint = JSON.stringify([
        parsedParams,
        parsedQuery,
        parsedBody,
      ]);
      if (contract.idempotency) {
        if (!key)
          throw new ApiError(
            422,
            "IDEMPOTENCY_REQUIRED",
            "Thiếu Idempotency-Key.",
          );
        const user = authenticatedUser(request);
        receiptKey = `${user.id}|${contract.name}|${key}`;
        const previous = receipts.get(receiptKey);
        if (previous) {
          if (previous.fingerprint !== fingerprint)
            throw new ApiError(
              409,
              "IDEMPOTENCY_CONFLICT",
              "Khóa gửi lặp đã dùng cho nội dung khác.",
            );
          return HttpResponse.json(
            { data: previous.data, meta: meta() },
            { status: previous.status, headers: previous.headers },
          );
        }
      }
      if (contract.method !== "GET") backup = structuredClone(db);
      const result = await resolve({
        params: parsedParams,
        query: parsedQuery,
        body: parsedBody,
        request,
        cookies,
      } as HandlerInput<C>);
      const reply =
        result instanceof MockReply
          ? result
          : new MockReply(
              result,
              contract.name.startsWith("create") ||
                contract.name === "addProjectMember" ||
                contract.name === "uploadAttachment"
                ? 201
                : 200,
            );
      const parsed = contract.response.safeParse(reply.data);
      if (!parsed.success)
        throw new Error(
          `Mock response contract ${contract.name}: ${parsed.error.message}`,
        );
      if (receiptKey)
        receipts.set(receiptKey, {
          fingerprint,
          data: parsed.data,
          status: reply.status,
          headers: reply.headers,
        });
      if (scenario === "invalid-response")
        return HttpResponse.json({ data: { invalid: true }, meta: meta() });
      const data =
        scenario === "empty" &&
        typeof parsed.data === "object" &&
        parsed.data !== null &&
        "pagination" in parsed.data
          ? {
              ...parsed.data,
              items: [],
              pagination: { page: 1, pageSize: 20, total: 0 },
            }
          : parsed.data;
      return HttpResponse.json(
        { data, meta: meta() },
        { status: reply.status, headers: reply.headers },
      );
    } catch (error) {
      if (backup) restoreDatabase(backup);
      return toMockErrorResponse(error);
    }
  });
}
export type MockRequest<C extends Endpoint> = ContractRequest<C>;
