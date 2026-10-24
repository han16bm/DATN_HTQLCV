import { tasksKeys } from "@/features/tasks/api/tasks.keys";
import { taskQuerySchema } from "@/features/tasks/schemas/task.schema";
import { handlers } from "@/mocks/handlers";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";
function files(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? files(join(directory, entry.name))
      : [join(directory, entry.name)],
  );
}
describe("Feature organization and HTTP boundaries", () => {
  it("uses API interfaces and direct HTTP services without endpoint descriptors", () => {
    for (const feature of readdirSync("src/features")) {
      const contract = readFileSync(
        `src/features/${feature}/api/${feature}.contract.ts`,
        "utf8",
      );
      const service = readFileSync(
        `src/features/${feature}/api/${feature}.service.ts`,
        "utf8",
      );
      expect(contract).toMatch(/export interface \w+Api/);
      expect(contract).not.toMatch(/endpoint\(|ContractRequest|invalidates:/);
      expect(service).toMatch(/apiClient\.(get|post|patch|put|download)\(/);
      expect(service).not.toMatch(/apiClient\.request|@\/mocks\//);
      expect(service).not.toMatch(/\w+Schema\.(?:parse|safeParse)\(/);
      const keys = readFileSync(
        `src/features/${feature}/api/${feature}.keys.ts`,
        "utf8",
      );
      expect(keys).not.toMatch(/\.(?:parse|safeParse)\(/);
    }
  });
  it("keeps data and business rules in mock DB modules", () => {
    for (const file of files("src/mocks/handlers").filter((f) =>
      f.endsWith(".handlers.ts"),
    ))
      expect(readFileSync(file, "utf8"), file).not.toMatch(
        /\bdb\.|\bApiError\b|\/data\/|\.(?:filter|push|find|splice)\(/,
      );
    for (const file of files("src/mocks/db"))
      expect(readFileSync(file, "utf8"), file).not.toMatch(
        /api\/.*\.contract|from\s*["'](?:msw|\.\.\/utils\/handler)["']|:\s*Request\b|\.headers\.get\(/,
      );
  });
  it("registers all 79 HTTP routes from the approved API catalog", () => {
    const catalog = readFileSync("fe-specs/api/API_CATALOG.md", "utf8");
    const expected = [
      ...new Set(
        [...catalog.matchAll(/`(GET|POST|PATCH|PUT) (\/api\/v1\/[^`]+)`/g)].map(
          (m) => `${m[1]} ${m[2]}`,
        ),
      ),
    ].sort();
    const actual = handlers
      .map((h) => `${h.info.method} ${String(h.info.path).replace(/^\*/, "")}`)
      .sort();
    expect(actual).toHaveLength(79);
    expect(actual).toEqual(expected);
  });
  it("keeps runtime mock imports at the browser bootstrap boundary", () => {
    const violations = files("src")
      .filter(
        (file) => /\.tsx?$/.test(file) && !file.includes(`${sep}mocks${sep}`),
      )
      .filter(
        (file) =>
          /(?:from\s*|import\s*\()['"]@\/mocks\//.test(
            readFileSync(file, "utf8"),
          ) && relative("src", file) !== join("app", "providers.tsx"),
      );
    expect(violations).toEqual([]);
  });
  it("keeps domain dependencies out of shared HTTP transport", () => {
    for (const file of files("src/services"))
      expect(readFileSync(file, "utf8")).not.toMatch(
        /from\s*['"]@\/(?:features|mocks)\//,
      );
  });
  it("uses normalized filters and separates viewers in query keys", () => {
    const query = taskQuerySchema.parse({});
    expect(tasksKeys.listTasks("u-lan", query)).toEqual(
      tasksKeys.listTasks(
        "u-lan",
        taskQuerySchema.parse({ page: 1, pageSize: 20, sort: "dueAt" }),
      ),
    );
    expect(tasksKeys.listTasks("u-lan", query)).not.toEqual(
      tasksKeys.listTasks("u-pm", query),
    );
  });
});
