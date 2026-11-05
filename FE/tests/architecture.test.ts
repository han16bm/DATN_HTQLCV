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
  it("uses direct HTTP services without endpoint descriptors or mock access", () => {
    for (const feature of readdirSync("src/features")) {
      const service = readFileSync(
        `src/features/${feature}/api/${feature}.service.ts`,
        "utf8",
      );
      expect(service).toMatch(
        /apiClient\s*\.(get|post|patch|put|delete)(?:<[^>]+>)?\(/,
      );
      expect(service).not.toMatch(/apiClient\s*\.request|@\/mocks\//);
      expect(service).not.toMatch(/\w+Schema\.(?:parse|safeParse)\(/);
      const keys = readFileSync(
        `src/features/${feature}/api/${feature}.keys.ts`,
        "utf8",
      );
      expect(keys).not.toMatch(/\.(?:parse|safeParse)\(/);
    }
  });
  it("keeps mock data, DB and HTTP handlers in their own places", () => {
    expect(readdirSync("src/mocks").sort()).toEqual([
      "browser.ts",
      "data.json",
      "db.ts",
      "handlers",
      "node.ts",
    ]);
    for (const file of files("src/mocks/handlers").filter((f) =>
      f.endsWith(".handlers.ts"),
    ))
      expect(readFileSync(file, "utf8"), file).not.toMatch(
        /\bdb\.|\bApiError\b|\/data\/|\.(?:filter|push|find|splice)\(/,
      );
    expect(readFileSync("src/mocks/db.ts", "utf8")).not.toMatch(
      /api\/.*\.contract|from\s*["'](?:msw|\.\/handlers)["']|:\s*Request\b|\.headers\.get\(/,
    );
  });
  it("aligns service and image routes with the approved API catalog", () => {
    const catalog = readFileSync("fe-specs/api/API_CATALOG.md", "utf8");
    const expected = [
      ...new Set(
        [
          ...catalog.matchAll(/`(GET|POST|PATCH|PUT|DELETE) (\/api\/[^`]+)`/g),
        ].map((m) => `${m[1]} ${m[2]}`),
      ),
    ].sort();
    const actual = handlers
      .map((h) => `${h.info.method} ${String(h.info.path).replace(/^\*/, "")}`)
      .sort();
    expect(actual).toHaveLength(120);
    expect(actual).toEqual(expected);
    const services = readdirSync("src/features")
      .flatMap((feature) => {
        const source = readFileSync(
          `src/features/${feature}/api/${feature}.service.ts`,
          "utf8",
        );
        return [
          ...source.matchAll(
            /\.(get|post|patch|put|delete)<[^>]+>\(\s*([`"])([\s\S]*?)\2/g,
          ),
        ].map((match) => {
          const path = match[3].replace(
            /\$\{encodeURIComponent\((\w+)\)\}/g,
            ":$1",
          );
          return `${match[1].toUpperCase()} /api${path}`;
        });
      })
      .sort();
    expect([...services, "GET /api/avatars/:avatarId"].sort()).toEqual(
      expected,
    );
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
    for (const file of files("src/components/ui").concat(
      files("src/components/forms"),
    ))
      expect(readFileSync(file, "utf8"), file).not.toMatch(
        /from\s*['"]@\/(?:features\/[^'"]+\/(?:api|hooks)\/|lib\/auth\/)/,
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
    expect(tasksKeys.listTasks(null, query)).toEqual(
      tasksKeys.listTasks(undefined, query),
    );
    expect(tasksKeys.listTasks(null, query)).not.toEqual(
      tasksKeys.listTasks("u-lan", query),
    );
  });
});
