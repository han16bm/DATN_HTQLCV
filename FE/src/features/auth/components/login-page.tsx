"use client";

import { BrandLogo } from "@/components/ui/brand-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/loading";
import { Notice } from "@/components/ui/notice";
import { useSession } from "@/lib/auth/session-context";
import { safeNext } from "@/lib/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, CircleAlert } from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { useLoginMutation } from "../hooks/use-auth-mutations";
import { loginSchema } from "../schemas/login.schema";
import type { LoginInput } from "../types/auth.types";

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-fg">
        {label}
      </label>
      {children}
      {error && (
        <span
          role="alert"
          id={`${id}-error`}
          className="flex items-start gap-1.5 text-sm text-danger-fg"
        >
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {error}
        </span>
      )}
    </div>
  );
}

// Đăng nhập: giới thiệu ngắn bên trái (ẩn ở màn hẹp), biểu mẫu gọn bên phải.
export function LoginPage() {
  const router = useRouter();
  const search = useSearchParams();
  const next = safeNext(search.get("next"));
  const { session, signIn, loading } = useSession();
  const mutation = useLoginMutation();
  const busy = loading || mutation.isPending;
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });
  useEffect(() => {
    if (session) router.replace(next);
  }, [session, router, next]);
  const { errors } = form.formState;
  return (
    <main className="grid min-h-screen w-full bg-surface lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="order-2 hidden flex-col items-start justify-center bg-selected-bg/60 px-12 py-12 lg:flex">
        <p className="mt-0 mb-0 text-3xl leading-tight font-semibold tracking-tight text-fg">
          Cùng một mục tiêu.
          <br />
          Rõ từng bước tiến.
        </p>
        <p className="mt-3 mb-0 max-w-md text-sm text-fg-subtle">
          Quản lý dự án, công việc và kết quả thực hiện trong một không gian
          chung.
        </p>
        <Image
          className="mt-6 h-auto w-full max-w-lg"
          src="/illustrations/login-work.svg"
          alt="Nhân viên ngồi làm việc trước máy tính, nhìn từ phía sau"
          width={680}
          height={440}
          loading="eager"
        />
      </div>
      <section className="order-1 mx-auto flex w-full max-w-[440px] flex-col justify-center px-6 py-12 sm:px-10">
        <div className="mb-10">
          <BrandLogo size={32} large />
        </div>
        <h1 className="mt-2 mb-0 text-heading-lg font-semibold text-fg">
          Đăng nhập
        </h1>
        {search.get("expired") && !session ? (
          <Notice tone="warning" role="status" className="mt-3">
            Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.
          </Notice>
        ) : (
          <p className="mt-1 mb-0 text-sm text-fg-subtle">
            Sử dụng tài khoản nội bộ đã được cấp.
          </p>
        )}
        <form
          className="mt-6"
          noValidate
          onSubmit={form.handleSubmit(async (body) => {
            try {
              const result = await mutation.mutateAsync(body);
              await signIn(result);
              router.replace(next);
            } catch {
              /* Mutation error remains visible; form values are preserved. */
            }
          })}
        >
          <fieldset disabled={busy} className="m-0 grid gap-3.5 border-0 p-0">
            <Field
              id="username"
              label="Tên đăng nhập"
              error={errors.username?.message}
            >
              <Input
                size="form"
                id="username"
                autoComplete="username"
                aria-invalid={Boolean(errors.username)}
                aria-describedby={
                  errors.username ? "username-error" : undefined
                }
                required
                {...form.register("username")}
              />
            </Field>
            <Field
              id="password"
              label="Mật khẩu"
              error={errors.password?.message}
            >
              <Input
                size="form"
                id="password"
                type="password"
                autoComplete="current-password"
                aria-invalid={Boolean(errors.password)}
                aria-describedby={
                  errors.password ? "password-error" : undefined
                }
                required
                {...form.register("password")}
              />
            </Field>
            {mutation.error && (
              <p
                role="alert"
                className="m-0 flex items-start gap-1.5 text-sm text-danger-fg"
              >
                <CircleAlert
                  className="mt-0.5 size-4 shrink-0"
                  aria-hidden="true"
                />
                {mutation.error.message}
              </p>
            )}
            <Button
              variant="primary"
              type="submit"
              className="h-10 w-full"
              aria-busy={busy}
            >
              {busy && <Spinner />}
              {mutation.isPending
                ? "Đang đăng nhập…"
                : loading
                  ? "Đang tải phiên…"
                  : "Đăng nhập"}
              {!busy && <ArrowRight className="size-4" aria-hidden="true" />}
            </Button>
          </fieldset>
        </form>
        <p className="mt-4 mb-0 text-xs text-fg-subtle">
          Quên mật khẩu? Liên hệ người quản lý tài khoản.
        </p>
      </section>
    </main>
  );
}
