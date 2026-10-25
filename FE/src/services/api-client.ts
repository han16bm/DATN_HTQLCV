import { metaSchema } from "@/lib/validation/common.schema";
import { ContractError } from "@/types/api/error";
import axios, {
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import { z } from "zod";
import { normalizeHttpError } from "./http-error";

export type RequestOptions = Pick<AxiosRequestConfig, "signal"> & {
  scenario?: string;
  skipAuthRefresh?: boolean;
};
export type MutationOptions = RequestOptions & {
  key: string;
  version?: number;
};
export type VersionOptions = MutationOptions & { version: number };
type HttpConfig = InternalAxiosRequestConfig<unknown> &
  Partial<MutationOptions> & {
    replay?: boolean;
  };
export const skipAuthRefreshConfig: RequestOptions = { skipAuthRefresh: true };

let accessToken: string | null = null;
let refreshHandler: (() => Promise<void>) | null = null;
let refreshPromise: Promise<void> | null = null;
export const token = {
  get: () => accessToken,
  set: (value: string | null) => {
    accessToken = value;
  },
};
export function registerRefresh(handler: (() => Promise<void>) | null) {
  refreshHandler = handler;
}
export function refreshAuth() {
  if (!refreshPromise) {
    if (!refreshHandler)
      return Promise.reject(new Error("Chưa thiết lập phiên."));
    refreshPromise = refreshHandler().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export const apiClient = axios.create({
  baseURL: `${(process.env.NEXT_PUBLIC_API_ORIGIN ?? "").replace(/\/$/, "")}/api`,
  adapter: "fetch",
  withCredentials: true,
  timeout: 15000,
  headers: { Accept: "application/json" },
  fetchOptions: { cache: "no-store" },
});
apiClient.interceptors.request.use((config: HttpConfig) => {
  config.headers.set(
    "Authorization",
    accessToken ? `Bearer ${accessToken}` : undefined,
  );
  // Let the runtime generate the multipart boundary in both browser and Node.
  if (config.data instanceof FormData) config.headers.setContentType(false);
  if (config.version !== undefined)
    config.headers.set("If-Match", `"${config.version}"`);
  if (config.key) config.headers.set("Idempotency-Key", config.key);
  if (config.scenario && process.env.NODE_ENV !== "production")
    config.headers.set("X-Mock-Scenario", config.scenario);
  return config;
});
apiClient.interceptors.response.use(undefined, async (error: unknown) => {
  if (!axios.isAxiosError<unknown, unknown>(error)) throw error;
  const config: HttpConfig | undefined = error.config;
  if (
    error.response?.status === 401 &&
    config &&
    !config.replay &&
    !config.skipAuthRefresh &&
    refreshHandler
  ) {
    config.replay = true;
    await refreshAuth();
    return apiClient.request<unknown>(config);
  }
  throw await normalizeHttpError(error);
});

export function parseResponse<T>(schema: z.ZodType<T>) {
  const envelope = z.object({ data: schema, meta: metaSchema });
  return (response: AxiosResponse<unknown>): T => {
    const result = envelope.safeParse(response.data);
    if (!result.success) throw new ContractError();
    return result.data.data;
  };
}
export function parseFile(response: AxiosResponse<Blob>): Blob {
  const type = String(response.headers["content-type"] ?? "");
  if (
    !type ||
    /(?:application\/(?:problem\+)?json|text\/html)/i.test(type) ||
    !response.headers["content-disposition"]
  )
    throw new ContractError("Chưa thể tải tệp lúc này. Vui lòng thử lại.");
  return response.data;
}
