"use client";
import { loginSchema } from "@/features/auth/schemas/login.schema";
import { useSession } from "@/lib/auth/session-context";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { useLoginMutation } from "../hooks/use-auth-mutations";

type LoginInput = z.input<typeof loginSchema>;
export function LoginPage() {
  const router = useRouter();
  const { session, signIn, loading } = useSession();
  const mutation = useLoginMutation();
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
        <span className="eyebrow">KHÔNG GIAN LÀM VIỆC NỘI BỘ</span>
        <h1>
          Cùng một mục tiêu.
          <br />
          Rõ từng bước tiến.
        </h1>
        <p>
          Quản lý dự án, công việc và kết quả thực hiện trong một không gian
          chung.
        </p>
      </div>
      <section className="login-panel">
        <h2>Đăng nhập</h2>
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
          <fieldset disabled={mutation.isPending || loading}>
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
            <button type="submit" className="primary">
              {mutation.isPending ? "Đang đăng nhập…" : "Đăng nhập"}
            </button>
          </fieldset>
        </form>
        <p className="muted small">
          Quên mật khẩu? Liên hệ người quản lý tài khoản.
        </p>
        {process.env.NODE_ENV === "development" &&
          process.env.NEXT_PUBLIC_API_MOCKING === "enabled" && (
            <aside className="demo-info">
              Dữ liệu thử nghiệm qua MSW
              <br />
              Tài khoản: minh / lan / huy / admin
              <br />
              Mật khẩu: Mock@12345
            </aside>
          )}
      </section>
    </main>
  );
}
