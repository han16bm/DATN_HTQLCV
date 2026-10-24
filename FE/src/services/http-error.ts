import {
  ApiError,
  ContractError,
  errorEnvelopeSchema,
} from "@/types/api/error";

export async function parseHttpError(response: Response) {
  const parsed = errorEnvelopeSchema.safeParse(
    await response.json().catch(() => null),
  );
  if (!parsed.success)
    return new ContractError("API trả lỗi không đúng định dạng.");
  const { error } = parsed.data;
  return new ApiError(
    response.status,
    error.code,
    error.message,
    error.fieldErrors,
    error.details,
  );
}
export function normalizeNetworkError(error: unknown): Error {
  if (error instanceof Error && error.name === "AbortError") return error;
  return new ApiError(
    0,
    "NETWORK_ERROR",
    "Không kết nối được máy chủ. Dữ liệu nhập vẫn được giữ.",
  );
}
export function shouldRetryQuery(count: number, error: unknown) {
  return (
    count < 1 &&
    error instanceof ApiError &&
    [0, 502, 503, 504].includes(error.status)
  );
}
