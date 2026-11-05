import { projectUrl, type PageSearch } from "@/lib/navigation";
import { redirect } from "next/navigation";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<PageSearch>;
}) {
  const { projectId } = await params;
  redirect(projectUrl(projectId, await searchParams, "tasks"));
}
