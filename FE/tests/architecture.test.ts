import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { operations } from "@/contracts/registry";
import { tasksKeys } from "@/features/tasks";

function files(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? files(join(directory, entry.name))
      : [join(directory, entry.name)],
  );
}

describe("HTTP and feature boundaries", () => {
  it("keeps runtime mock imports at the single browser bootstrap boundary", () => {
    const violations = files("src")
      .filter(
        (file) => /\.tsx?$/.test(file) && !file.includes(`${sep}mocks${sep}`),
      )
      .filter((file) => {
        const source = readFileSync(file, "utf8");
        return (
          /(?:from\s*|import\s*\()['"]@\/mocks\//.test(source) &&
          relative("src", file) !== join("app", "providers.tsx")
        );
      });
    expect(violations).toEqual([]);
  });
  it("keeps domain dependencies out of shared HTTP transport", () => {
    for (const file of files("src/services"))
      expect(readFileSync(file, "utf8")).not.toMatch(
        /from\s*['"]@\/(?:features|mocks)\//,
      );
  });
  it("preserves 79 unique method/path contracts and does not introduce a mock URL", () => {
    const list = Object.values(operations);
    expect(list).toHaveLength(79);
    expect(new Set(list.map((c) => `${c.method} ${c.path}`)).size).toBe(79);
    expect(
      list.every(
        (c) => c.path.startsWith("/api/v1/") && !c.path.includes("/mock/"),
      ),
    ).toBe(true);
  });
  it("normalizes default filters and separates viewers in cache keys", () => {
    expect(tasksKeys.listTasks("u-lan")).toEqual(
      tasksKeys.listTasks(
        "u-lan",
        {},
        { page: 1, pageSize: 20, sort: "dueAt" },
      ),
    );
    expect(tasksKeys.listTasks("u-lan")).not.toEqual(
      tasksKeys.listTasks("u-pm"),
    );
  });
});
