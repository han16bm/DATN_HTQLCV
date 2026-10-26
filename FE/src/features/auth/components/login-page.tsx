"use client";

import { Spinner } from "@/components/ui/loading";
import { useSession } from "@/lib/auth/session-context";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, CircleCheckBig, LockKeyhole } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useLoginMutation } from "../hooks/use-auth-mutations";
import { loginSchema } from "../schemas/login.schema";
import type { LoginInput } from "../types/auth.types";

export function LoginPage() {
  const router = useRouter();
  const { session, signIn, loading } = useSession();
  const mutation = useLoginMutation();
  const busy = loading || mutation.isPending;
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });
  useEffect(() => {
    if (session) router.replace("/workspace");
  }, [session, router]);
  return (
    <main className="login-layout">
      <div className="login-intro">
        <div className="login-brand">
          <span className="brand-mark">
            <CircleCheckBig size={25} />
          </span>
          Cổng công việc
        </div>
        <span className="eyebrow">KẾT NỐI CÔNG VIỆC · CÙNG NHAU TIẾN XA</span>
        <h1>
          Cùng một mục tiêu.
          <br />
          Rõ từng bước tiến.
        </h1>
        <p>
          Quản lý dự án, công việc và kết quả thực hiện trong một không gian
          chung.
        </p>
        <Image
          className="login-illustration"
          src="/illustrations/login-work.svg"
          alt="Nhân viên ngồi làm việc trước máy tính, nhìn từ phía sau"
          width={680}
          height={440}
          loading="eager"
        />
        <div className="login-caption">
          <span />
          Kế hoạch rõ ràng. Làm việc hiệu quả.
        </div>
      </div>
      <section className="login-panel">
        <div className="login-panel-heading">
          <span className="login-lock">
            <LockKeyhole size={25} strokeWidth={1.7} />
          </span>
          <div>
            <span className="eyebrow">CHÀO MỪNG BẠN TRỞ LẠI</span>
            <h2>Đăng nhập</h2>
          </div>
        </div>
        <p className="muted">Sử dụng tài khoản nội bộ đã được cấp.</p>
        <form
          onSubmit={form.handleSubmit(async (body) => {
            try {
              const result = await mutation.mutateAsync(body);
              await signIn(result);
              router.replace("/workspace");
            } catch {
              /* Mutation error remains visible; form values are preserved. */
            }
          })}
        >
          <fieldset disabled={busy}>
            <label htmlFor="username">Tên đăng nhập</label>
            <input
              id="username"
              autoComplete="username"
              {...form.register("username")}
            />
            {form.formState.errors.username && (
              <span role="alert" className="field-error">
                {form.formState.errors.username.message}
              </span>
            )}
            <label htmlFor="password">Mật khẩu</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              {...form.register("password")}
            />
            {form.formState.errors.password && (
              <span role="alert" className="field-error">
                {form.formState.errors.password.message}
              </span>
            )}
            {mutation.error && (
              <p role="alert" className="field-error">
                {mutation.error.message}
              </p>
            )}
            <button
              type="submit"
              className="primary pending-button"
              aria-busy={busy}
            >
              {busy && <Spinner />}
              {mutation.isPending
                ? "Đang đăng nhập…"
                : loading
                  ? "Đang tải phiên…"
                  : "Đăng nhập"}
              {!busy && <ArrowRight size={18} aria-hidden="true" />}
            </button>
          </fieldset>
        </form>
        <p className="muted small">
          Quên mật khẩu? Liên hệ người quản lý tài khoản.
        </p>
      </section>
    </main>
  );
}
