import { ApiError } from "@/types/api/error";
export function requireVersion(
  expectedVersion: string | null,
  entity: { version: number },
) {
  if (!expectedVersion)
    throw new ApiError(428, "VERSION_REQUIRED", "Thiếu phiên bản dữ liệu.");
  if (expectedVersion !== `"${entity.version}"`)
    throw new ApiError(
      412,
      "VERSION_CONFLICT",
      "Dữ liệu đã được thay đổi. Giữ bản đang nhập và tải bản mới để đối chiếu.",
    );
}
