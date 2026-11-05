import { ContractError } from "@/types/api/error";
import axios, {
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import type { z } from "zod";
import { normalizeHttpError } from "./http-error";

declare module "axios" {
  interface AxiosRequestConfig {
    schema?: z.ZodType;
    skipAuthRefresh?: boolean;
    scenario?: string;
    key?: string;
    version?: number;
  }
}

export type RequestOptions = Pick<
  AxiosRequestConfig,
  "signal" | "scenario" | "skipAuthRefresh"
>;
export type MutationOptions = RequestOptions & {
  key: string;
  version?: number;
};
export type VersionOptions = MutationOptions & { version: number };
type HttpConfig = InternalAxiosRequestConfig<unknown> & { replay?: boolean };

const TOKEN_STORAGE_KEY = "datn.accessToken";
let accessToken: string | null =
  typeof window === "undefined"
    ? null
    : window.sessionStorage.getItem(TOKEN_STORAGE_KEY);
let refreshHandler: (() => Promise<void>) | null = null;
let refreshPromise: Promise<void> | null = null;
export const token = {
  get: () => accessToken,
  set: (value: string | null) => {
    accessToken = value;
    if (typeof window === "undefined") return;
    if (value) window.sessionStorage.setItem(TOKEN_STORAGE_KEY, value);
    else window.sessionStorage.removeItem(TOKEN_STORAGE_KEY);
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
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api",
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
apiClient.interceptors.response.use(
  (response: AxiosResponse<unknown>) => {
    if (response.config.responseType === "blob") {
      const type = String(response.headers["content-type"] ?? "");
      if (
        !type ||
        /(?:application\/(?:problem\+)?json|text\/html)/i.test(type) ||
        !response.headers["content-disposition"]
      )
        throw new ContractError("Chưa thể tải tệp lúc này. Vui lòng thử lại.");
    } else if (response.config.schema) {
      const result = response.config.schema.safeParse(response.data);
      if (!result.success) throw new ContractError();
      response.data = result.data;
    }
    return response;
  },
  async (error: unknown) => {
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
  },
);
