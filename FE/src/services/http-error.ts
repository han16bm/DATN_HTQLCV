import {
  ApiError,
  ContractError,
  errorResponseSchema,
} from "@/types/api/error";
import axios, { type AxiosError } from "axios";

export async function normalizeHttpError(
  error: AxiosError<unknown>,
): Promise<Error> {
  if (axios.isCancel(error)) return new axios.CanceledError(error.message);
  if (!error.response)
    return new ApiError(
      0,
      "NETWORK_ERROR",
      "Không kết nối được máy chủ. Dữ liệu nhập vẫn được giữ.",
    );
  let data = error.response.data;
  if (data instanceof Blob) data = await data.text();
  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch {
      data = null;
    }
  }
  const parsed = errorResponseSchema.safeParse(data);
  if (!parsed.success) return new ContractError();
  const body = parsed.data;
  return new ApiError(
    error.response.status,
    body.code,
    body.message,
    body.fieldErrors,
    body.details,
  );
}
export function shouldRetryQuery(count: number, error: unknown) {
  return (
    count < 1 &&
    error instanceof ApiError &&
    [0, 502, 503, 504].includes(error.status)
  );
}
