"use client";
import { PageSkeleton } from "@/components/ui/loading";
import { adminHome } from "@/lib/auth/access";
import { useSession } from "@/lib/auth/session-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

// /admin không có nội dung riêng: mở mục quản trị đầu tiên được cấp quyền.
export function AdminIndex() {
  const { session } = useSession();
  const router = useRouter();
  const target = adminHome(session);
  useEffect(() => {
    if (target) router.replace(target);
  }, [target, router]);
  return <PageSkeleton />;
}
