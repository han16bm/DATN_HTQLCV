import { label } from "@/lib/format";
import type { UserDto } from "../types/users.types";

type Info = Pick<
  UserDto,
  | "displayName"
  | "username"
  | "gender"
  | "birthDate"
  | "email"
  | "phone"
  | "permanentAddress"
  | "temporaryAddress"
>;

export function UserPersonalInfo({ user }: { user: Info }) {
  return (
    <div className="@container/personal-info grid min-w-0 gap-5">
      <section aria-label="Thông tin cơ bản">
        <h3 className="m-0 mb-3 text-sm font-semibold text-fg">
          Thông tin cơ bản
        </h3>
        <dl className="m-0 grid gap-x-6 gap-y-4 @min-[26.25rem]/personal-info:grid-cols-2 [&_dt]:mb-1 [&_dt]:text-xs [&_dt]:text-fg-subtle [&_dd]:m-0 [&_dd]:text-sm [&_dd]:break-words">
          <div>
            <dt>Họ tên</dt>
            <dd>{user.displayName}</dd>
          </div>
          <div>
            <dt>Tên đăng nhập</dt>
            <dd>{user.username}</dd>
          </div>
          <div>
            <dt>Giới tính</dt>
            <dd>{user.gender ? label(user.gender) : "Chưa cập nhật"}</dd>
          </div>
          <div>
            <dt>Ngày sinh</dt>
            <dd>
              {user.birthDate
                ? user.birthDate.split("-").reverse().join("/")
                : "Chưa cập nhật"}
            </dd>
          </div>
        </dl>
      </section>
      <section
        aria-label="Thông tin liên hệ"
        className="border-t border-line pt-4"
      >
        <h3 className="m-0 mb-3 text-sm font-semibold text-fg">
          Thông tin liên hệ
        </h3>
        <dl className="m-0 grid gap-x-6 gap-y-4 @min-[26.25rem]/personal-info:grid-cols-2 [&_dt]:mb-1 [&_dt]:text-xs [&_dt]:text-fg-subtle [&_dd]:m-0 [&_dd]:text-sm [&_dd]:break-words [&_dd]:whitespace-pre-wrap">
          <div>
            <dt>Email</dt>
            <dd>{user.email}</dd>
          </div>
          <div>
            <dt>Số điện thoại</dt>
            <dd>{user.phone ?? "Chưa cập nhật"}</dd>
          </div>
          <div>
            <dt>Địa chỉ thường trú</dt>
            <dd>{user.permanentAddress ?? "Chưa cập nhật"}</dd>
          </div>
          <div>
            <dt>Địa chỉ tạm trú</dt>
            <dd>{user.temporaryAddress ?? "Chưa cập nhật"}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
