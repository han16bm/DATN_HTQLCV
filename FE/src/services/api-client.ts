import { z } from "zod";
import { ApiError, ContractError } from "@/types/api/error";
import { normalizeNetworkError, parseHttpError } from "./http-error";
import { token, canRefresh, refreshSingleFlight } from "./auth-session";
import type {
  ContractRequest,
  ContractResponse,
  Endpoint,
} from "./api-contract";

async function request<C extends Endpoint>(
  op: C,
  args: ContractRequest<C>,
  replay = false,
): Promise<ContractResponse<C>> {
  const params = z
    .record(z.string(), z.string())
    .parse(op.params.parse(args.params ?? {}));
  const query = z
    .record(z.string(), z.unknown())
    .parse(op.query.parse(args.query ?? {}));
  const body = op.method !== "GET" ? op.body.parse(args.body ?? {}) : undefined;
  let route = op.path;
  for (const [key, value] of Object.entries(params))
    route = route.replace(`:${key}`, encodeURIComponent(value));
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query))
    if (value !== undefined) search.set(key, String(value));
  const origin = process.env.NEXT_PUBLIC_API_ORIGIN ?? "";
  const url = `${origin.replace(/\/$/, "")}${route}${search.size ? `?${search}` : ""}`;
  const headers = new Headers({
    Accept: op.name === "downloadAttachment" ? "*/*" : "application/json",
  });
  if (token.get()) headers.set("Authorization", `Bearer ${token.get()}`);
  if (op.version) {
    if (!args.version)
      throw new ApiError(
        428,
        "VERSION_REQUIRED",
        "Cần tải phiên bản mới trước khi lưu.",
      );
    headers.set("If-Match", `"${args.version}"`);
  }
  if (op.idempotency) {
    if (!args.key) throw new Error("Thiếu khóa gửi lặp cho mutation");
    headers.set("Idempotency-Key", args.key);
  }
  if (args.scenario && process.env.NODE_ENV !== "production")
    headers.set("X-Mock-Scenario", args.scenario);
  let payload: BodyInit | undefined;
  if (op.name === "uploadAttachment") {
    const file = z
      .object({ taskId: z.string(), file: z.instanceof(Blob) })
      .parse(body);
    const form = new FormData();
    form.set("taskId", file.taskId);
    form.set("file", file.file);
    payload = form;
  } else if (body !== undefined) {
    headers.set("Content-Type", "application/json");
    payload = JSON.stringify(body);
  }
  let response: Response;
  try {
    response = await fetch(url, {
      method: op.method,
      headers,
      body: payload,
      credentials: "include",
      signal: args.signal,
      cache: "no-store",
    });
  } catch (error) {
    throw normalizeNetworkError(error);
  }
  if (
    response.status === 401 &&
    !replay &&
    canRefresh() &&
    !op.path.startsWith("/api/v1/auth/")
  ) {
    await refreshSingleFlight();
    return request(op, args, true);
  }
  if (!response.ok) throw await parseHttpError(response);
  if (op.name === "downloadAttachment") {
    if (
      !response.headers.get("Content-Type") ||
      !response.headers.get("Content-Disposition")
    )
      throw new ContractError("Tệp tải về thiếu metadata.");
    // C retains the concrete schema; validation occurs before this adapter-only assertion.
    return op.response.parse(await response.blob()) as ContractResponse<C>;
  }
  const envelope = z.object({
    data: op.response,
    meta: z.object({
      requestId: z.string().min(1),
      serverTime: z.iso.datetime(),
    }),
  });
  const parsed = envelope.safeParse(await response.json().catch(() => null));
  if (!parsed.success) throw new ContractError();
  // The same concrete C.response validated the JSON; no unchecked DTO cast occurs.
  return parsed.data.data as ContractResponse<C>;
}
export const apiClient = { request };
