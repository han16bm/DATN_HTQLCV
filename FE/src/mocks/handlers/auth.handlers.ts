import {
  loginContract,
  logoutContract,
  refreshSessionContract,
  getSessionContract,
} from "@/features/auth";
import { ApiError } from "@/types/api/error";
import { db, now, sessionDTO } from "../db/database";
import { createHandler, authenticatedUser } from "../utils/handler";
import { MockReply } from "../utils/http-response";

function issueSession(user: (typeof db.users)[number]) {
  const accessToken = `mock-${user.id}`;
  db.revoked.delete(accessToken);
  return new MockReply(
    {
      session: sessionDTO(user),
      accessToken,
      expiresAt: new Date(Date.parse(now()) + 3600_000).toISOString(),
    },
    200,
    { "Set-Cookie": `mock_refresh=${user.id}; Path=/; SameSite=Lax` },
  );
}
export const authHandlers = [
  createHandler(loginContract, ({ body }) => {
    const user = db.users.find((u) => u.username === body.username);
    if (!user || db.passwords.get(user.id) !== body.password)
      throw new ApiError(
        401,
        "INVALID_CREDENTIALS",
        "Tên đăng nhập hoặc mật khẩu chưa đúng.",
      );
    if (user.status === "LOCKED")
      throw new ApiError(403, "ACCOUNT_LOCKED", "Tài khoản đang bị khóa.");
    return issueSession(user);
  }),
  createHandler(refreshSessionContract, ({ cookies }) => {
    const user = db.users.find(
      (u) => u.id === cookies.mock_refresh && u.status === "ACTIVE",
    );
    if (!user || db.revoked.has(`mock-${user.id}`))
      throw new ApiError(401, "UNAUTHORIZED", "Phiên đăng nhập đã hết hạn.");
    return issueSession(user);
  }),
  createHandler(getSessionContract, ({ request }) =>
    sessionDTO(authenticatedUser(request)),
  ),
  createHandler(logoutContract, ({ request }) => {
    const user = authenticatedUser(request);
    db.revoked.add(`mock-${user.id}`);
    return new MockReply({ ok: true }, 200, {
      "Set-Cookie": "mock_refresh=; Path=/; Max-Age=0; SameSite=Lax",
    });
  }),
];
