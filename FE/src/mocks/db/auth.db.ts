import { type LoginInput } from "@/features/auth/types/auth.types";
import type { User } from "@/mocks/db/database";
import { ApiError } from "@/types/api/error";
import { db, now, sessionDTO } from "./database";
export function sessionUser(accessToken: string | undefined): User {
  const userId = accessToken ? db.sessions.get(accessToken) : undefined;
  const user = db.users.find((u) => u.id === userId);
  if (
    !user ||
    db.revoked.has(accessToken ?? "") ||
    (db.sessionExpiry.get(accessToken ?? "") ?? "") <= now()
  )
    throw new ApiError(401, "UNAUTHORIZED", "Phiên đăng nhập đã hết hạn.");
  if (user.status === "LOCKED")
    throw new ApiError(403, "ACCOUNT_LOCKED", "Tài khoản đang bị khóa.");
  return user;
}
function issueSession(user: User) {
  const accessToken = `mock-${user.id}-${crypto.randomUUID()}`;
  const expiresAt = new Date(Date.parse(now()) + 3600_000).toISOString();
  db.sessions.set(accessToken, user.id);
  db.sessionExpiry.set(accessToken, expiresAt);
  db.revoked.delete(`mock-${user.id}`);
  return { session: sessionDTO(user), accessToken, expiresAt };
}
export const authDb = {
  login(body: LoginInput) {
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
  },
  refresh(refreshUserId: string | undefined) {
    const user = db.users.find(
      (u) => u.id === refreshUserId && u.status === "ACTIVE",
    );
    if (!user || db.revoked.has(`mock-${user.id}`))
      throw new ApiError(401, "UNAUTHORIZED", "Phiên đăng nhập đã hết hạn.");
    return issueSession(user);
  },
  getSession(accessToken: string | undefined) {
    return sessionDTO(sessionUser(accessToken));
  },
  logout(accessToken: string | undefined) {
    const user = sessionUser(accessToken);
    if (accessToken) {
      db.sessions.delete(accessToken);
      db.sessionExpiry.delete(accessToken);
      db.revoked.add(accessToken);
    }
    db.revoked.add(`mock-${user.id}`);
    return { ok: true as const };
  },
};
