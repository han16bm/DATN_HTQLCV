import { safeNext, trailFor, type TrailContext } from "@/lib/navigation";
import { describe, expect, it } from "vitest";

function context(
  url: string,
  extra: Partial<Omit<TrailContext, "pathname" | "search">> = {},
): TrailContext {
  const [pathname, query = ""] = url.split("?");
  return {
    pathname,
    search: new URLSearchParams(query),
    entity: () => undefined,
    list: () => undefined,
    previous: null,
    ...extra,
  };
}
const known: Record<string, { label: string; parentId?: string }> = {
  "project:p-1": { label: "Cổng nội bộ" },
  "task:t-1": { label: "Thiết kế luồng", parentId: "p-1" },
  "submission:s-1": { label: "Lần nộp 2" },
};
const entities: TrailContext["entity"] = (kind, id) => known[`${kind}:${id}`];

describe("breadcrumb trail", () => {
  it("has no trail on top-level pages", () => {
    for (const url of ["/workspace", "/projects", "/tasks", "/dashboard"])
      expect(trailFor(context(url))).toBeNull();
  });

  it("names entities instead of IDs and links parents but not the current page", () => {
    const trail = trailFor(
      context("/tasks/t-1/time-logs", { entity: entities }),
    )!;
    expect(trail.crumbs).toEqual([
      { label: "Dự án", href: "/projects" },
      { label: "Cổng nội bộ", href: "/projects/p-1" },
      { label: "Công việc", href: "/projects/p-1/tasks" },
      { label: "Thiết kế luồng", href: "/tasks/t-1" },
      { label: "Giờ công" },
    ]);
    expect(trail.back).toBe("/tasks/t-1");
  });

  it("falls back to a placeholder while the entity is loading", () => {
    const trail = trailFor(context("/projects/p-1/members"))!;
    expect(trail.crumbs.map((crumb) => crumb.label)).toEqual([
      "Dự án",
      "…",
      "Thành viên",
    ]);
    expect(trail.back).toBe("/projects/p-1");
  });

  it("gives a direct task URL a sensible parent without browser history", () => {
    expect(trailFor(context("/tasks/t-1", { entity: entities }))!.back).toBe(
      "/projects/p-1/tasks",
    );
    expect(trailFor(context("/tasks/t-1"))!.back).toBe("/tasks");
    expect(
      trailFor(context("/tasks/t-1/submissions/s-1", { entity: entities }))!
        .back,
    ).toBe("/tasks/t-1/submissions");
    expect(
      trailFor(context("/projects/p-1?tab=history"))!.crumbs.at(-1),
    ).toEqual({ label: "Lịch sử" });
  });

  it("returns to the remembered list with its filters, view and page", () => {
    const remembered = "/projects/p-1/tasks?status=TODO&view=board&page=2";
    const trail = trailFor(
      context("/tasks/t-1", {
        entity: entities,
        list: (path) =>
          path === "/projects/p-1/tasks" ? remembered : undefined,
      }),
    )!;
    expect(trail.back).toBe(remembered);
    expect(trail.crumbs[2].href).toBe(remembered);
  });

  it("prefers the list the person just left, even when it is not the direct parent", () => {
    const personal = "/workspace";
    expect(
      trailFor(context("/tasks/t-1", { entity: entities, previous: personal }))!
        .back,
    ).toBe(personal);
    const filtered = "/tasks?assigneeId=u-1&page=3";
    expect(
      trailFor(context("/tasks/t-1", { entity: entities, previous: filtered }))!
        .back,
    ).toBe(filtered);
    // Trang con trong cùng thực thể luôn về trang cha, không về "trang trước".
    expect(
      trailFor(
        context("/tasks/t-1/history", {
          entity: entities,
          previous: "/tasks?page=3",
        }),
      )!.back,
    ).toBe("/tasks/t-1");
  });

  it("ignores a previous page that is external, unsafe or in the other area", () => {
    for (const previous of [
      "https://evil.example/tasks",
      "//evil.example",
      "javascript:alert(1)",
    ])
      expect(
        trailFor(context("/tasks/t-1", { entity: entities, previous }))!.back,
      ).toBe("/projects/p-1/tasks");
    expect(
      trailFor(context("/admin/users/u-1", { previous: "/projects" }))!.back,
    ).toBe("/admin/users");
    expect(
      trailFor(context("/admin/users/u-1", { previous: "/admin/users?q=lan" }))!
        .back,
    ).toBe("/admin/users?q=lan");
  });

  it("falls back to a parent when a contextual page is opened directly", () => {
    expect(trailFor(context("/users/u-9"))!.back).toBe("/workspace");
    expect(trailFor(context("/analytics/details/a-1"))!.back).toBe(
      "/dashboard",
    );
    expect(
      trailFor(context("/users/u-9", { previous: "/projects/p-1/members" }))!
        .back,
    ).toBe("/projects/p-1/members");
  });

  it("covers administration child routes", () => {
    expect(trailFor(context("/admin/teams/new"))!.crumbs).toEqual([
      { label: "Nhóm nhân sự", href: "/admin/teams" },
      { label: "Tạo nhóm" },
    ]);
    expect(trailFor(context("/admin/users"))).toBeNull();
  });
});

describe("post-login destination", () => {
  it("accepts in-app paths only", () => {
    expect(safeNext("/tasks/t-1?tab=x")).toBe("/tasks/t-1?tab=x");
    for (const value of [
      null,
      "",
      "tasks",
      "//evil.example",
      "/login",
      "https://evil.example",
    ])
      expect(safeNext(value)).toBe("/workspace");
  });
});
