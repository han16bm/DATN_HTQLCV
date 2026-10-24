import type { HttpOptions, RequestOptions } from "@/services/api.types";
import { ContractError } from "@/types/api/error";
import { z } from "zod";
import { canRefresh, refreshSingleFlight, token } from "./auth-session";
import { normalizeNetworkError, parseHttpError } from "./http-error";
const metadataSchema = z.object({
  requestId: z.string().min(1),
  serverTime: z.iso.datetime(),
});
async function fetchResponse(
  method: string,
  path: string,
  payload: unknown,
  options: HttpOptions,
  replay = false,
): Promise<Response> {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(options.query ?? {}))
    if (value !== undefined && value !== null) search.set(key, String(value));
  const origin = (process.env.NEXT_PUBLIC_API_ORIGIN ?? "").replace(/\/$/, "");
  const url = `${origin}/api/v1${path}${search.size ? `?${search}` : ""}`;
  const headers = new Headers({ Accept: "application/json" });
  if (token.get()) headers.set("Authorization", `Bearer ${token.get()}`);
  if (options.version !== undefined)
    headers.set("If-Match", `"${options.version}"`);
  if (options.key) headers.set("Idempotency-Key", options.key);
  if (options.scenario && process.env.NODE_ENV !== "production")
    headers.set("X-Mock-Scenario", options.scenario);
  let body: BodyInit | undefined;
  if (payload instanceof FormData) body = payload;
  else if (method !== "GET") {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(payload ?? {});
  }
  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body,
      credentials: "include",
      signal: options.signal,
      cache: "no-store",
    });
  } catch (error) {
    throw normalizeNetworkError(error);
  }
  if (
    response.status === 401 &&
    !replay &&
    !options.skipAuthRefresh &&
    canRefresh()
  ) {
    await refreshSingleFlight();
    return fetchResponse(method, path, payload, options, true);
  }
  if (!response.ok) throw await parseHttpError(response);
  return response;
}
async function json<S extends z.ZodType>(
  method: string,
  path: string,
  payload: unknown,
  schema: S,
  options: HttpOptions = {},
): Promise<z.output<S>> {
  const response = await fetchResponse(method, path, payload, options);
  const envelope = z
    .object({ data: z.unknown(), meta: metadataSchema })
    .safeParse(await response.json().catch(() => null));
  if (!envelope.success || !Object.hasOwn(envelope.data, "data"))
    throw new ContractError();
  const parsed = schema.safeParse(envelope.data.data);
  if (!parsed.success) throw new ContractError();
  return parsed.data;
}
export const apiClient = {
  get<S extends z.ZodType>(path: string, schema: S, options: HttpOptions = {}) {
    return json("GET", path, undefined, schema, options);
  },
  post<S extends z.ZodType>(
    path: string,
    payload: unknown,
    schema: S,
    options: HttpOptions = {},
  ) {
    return json("POST", path, payload, schema, options);
  },
  patch<S extends z.ZodType>(
    path: string,
    payload: unknown,
    schema: S,
    options: HttpOptions = {},
  ) {
    return json("PATCH", path, payload, schema, options);
  },
  put<S extends z.ZodType>(
    path: string,
    payload: unknown,
    schema: S,
    options: HttpOptions = {},
  ) {
    return json("PUT", path, payload, schema, options);
  },
  async download(path: string, options: RequestOptions = {}): Promise<Blob> {
    const response = await fetchResponse("GET", path, undefined, options);
    const type = response.headers.get("Content-Type");
    if (
      !type ||
      /(?:application\/(?:problem\+)?json|text\/html)/i.test(type) ||
      !response.headers.get("Content-Disposition")
    )
      throw new ContractError("Tệp tải về thiếu metadata.");
    return response.blob();
  },
};
