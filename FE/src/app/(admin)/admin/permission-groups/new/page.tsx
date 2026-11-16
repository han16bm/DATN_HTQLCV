import { redirect } from "next/navigation";
export default function Page() {
  redirect("/admin/permission-groups?dialog=create");
}
