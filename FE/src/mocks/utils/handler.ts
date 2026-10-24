import { fingerprint } from "@/lib/crypto/fingerprint";
import type { User } from "@/mocks/db/database";
import { ApiError } from "@/types/api/error";
import { delay, HttpResponse, type HttpResponseResolver } from "msw";
import type { z } from "zod";
import { authorizeReplay } from "../db/access.db";
import { sessionUser } from "../db/auth.db";
import { withMockTransaction } from "../db/transaction";
import { meta, toMockErrorResponse } from "./http-response";
type Receipt = {
  fingerprint: string;
  data: unknown;
  status: number;
  headers: Headers;
};
const receipts = new Map<string, Receipt>();
const responseData = new WeakMap<Response, unknown>();
export function resetReceipts() {
  receipts.clear();
}
export function authenticatedUser(request: Request) {
  return sessionUser(
    request.headers.get("Authorization")?.replace(/^Bearer /, ""),
  );
}
export function parseQuery<S extends z.ZodType>(
  request: Request,
  schema: S,
): z.output<S> {
  const query: Record<string, unknown> = Object.fromEntries(
    new URL(request.url).searchParams,
  );
  for (const name of ["page", "pageSize"])
    if (typeof query[name] === "string" && /^\d+$/.test(query[name]))
      query[name] = Number(query[name]);
  if (query.overdue === "true") query.overdue = true;
  else if (query.overdue === "false") query.overdue = false;
  return schema.parse(query);
}
export function mockHandler(
  resolve: HttpResponseResolver,
): HttpResponseResolver {
  return async (context) => {
    try {
      const scenario = context.request.headers.get("X-Mock-Scenario");
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
      return await resolve(context);
    } catch (error) {
      return toMockErrorResponse(error);
    }
  };
}
export function mockJson<S extends z.ZodType>(
  request: Request,
  data: unknown,
  schema: S,
  status = 200,
  headers?: HeadersInit,
) {
  const parsed = schema.safeParse(data);
  if (!parsed.success)
    throw new Error(`Invalid mock response: ${parsed.error.message}`);
  let result: unknown = parsed.data;
  const scenario = request.headers.get("X-Mock-Scenario");
  if (scenario === "invalid-response") result = { invalid: true };
  else if (
    scenario === "empty" &&
    typeof result === "object" &&
    result !== null &&
    "pagination" in result
  )
    result = {
      ...result,
      items: [],
      pagination: { page: 1, pageSize: 20, total: 0 },
    };
  const response = HttpResponse.json(
    { data: result, meta: meta() },
    { status, headers },
  );
  responseData.set(response, parsed.data);
  return response;
}
type MockCommand = {
  operation: string;
  feature: string;
  viewer: User;
  permission: string | null;
  params: Record<string, string>;
  payload: Record<string, unknown>;
};
export async function mockCommand(
  request: Request,
  command: MockCommand,
  execute: () => Response | Promise<Response>,
) {
  return withMockTransaction(
    async (commit) => {
      const key = request.headers.get("Idempotency-Key");
      if (!key)
        throw new ApiError(
          422,
          "IDEMPOTENCY_REQUIRED",
          "Thiếu Idempotency-Key.",
        );
      const signature = await fingerprint([
        command.operation,
        command.params,
        command.payload,
      ]);
      const receiptKey = `${command.viewer.id}|${command.operation}|${key}`;
      const previous = receipts.get(receiptKey);
      if (previous) {
        authorizeReplay(
          command.operation,
          command.permission,
          command.viewer,
          command.params,
          command.payload,
        );
        if (previous.fingerprint !== signature)
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
      const response = await execute();
      const data = responseData.get(response);
      receipts.set(receiptKey, {
        fingerprint: signature,
        data: JSON.parse(JSON.stringify(data)),
        status: response.status,
        headers: new Headers(response.headers),
      });
      commit();
      return response;
    },
    {
      feature: command.feature,
      scenario: request.headers.get("X-Mock-Scenario"),
    },
  );
}
