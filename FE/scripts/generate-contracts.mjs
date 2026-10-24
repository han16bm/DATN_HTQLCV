import fs from "node:fs";
import path from "node:path";
import { format } from "prettier";

// The markdown tables are the versioned contract source, not a runtime dependency.
const root = process.cwd();
const read = (file) =>
  fs
    .readFileSync(path.join(root, "fe-specs", file), "utf8")
    .replaceAll("\r", "");
const pendingWrites = [];
const write = (file, content) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  pendingWrites.push(
    format(content, { filepath: file }).then((formatted) =>
      fs.writeFileSync(file, formatted),
    ),
  );
};
const dtoDoc = read("api/DTO_MODELS.md");
const apiDoc = read("api/API_CATALOG.md");
const schemaName = (name) => name.replace(".", "").replace(/DTO$/, "Schema");
const rows = (text) =>
  [
    ...text.matchAll(
      /^\|\s*`([^`]+)`\s*\|\s*([^|]+)\|\s*([^|]+)\|\s*([^|]*)\|/gm,
    ),
  ].map((m) => ({
    name: m[1],
    type: m[2].trim(),
    required: m[3].trim().startsWith("Có"),
    rules: m[4].trim(),
  }));
const defs = new Map(
  [
    ...dtoDoc.matchAll(/^## ([A-Z]\w*\.\w+)\n([\s\S]*?)(?=^## |$(?![\s\S]))/gm),
  ].map((m) => [m[1], m[2]]),
);
const emitted = new Set();
const groups = {
  Users: "users",
  Auth: "auth",
  Organization: "organization",
  Projects: "projects",
  Members: "project-members",
  Tasks: "tasks",
  Logs: "time-logs",
  Submissions: "submissions",
  Reports: "reports",
  Attachments: "attachments",
  Analytics: "analytics",
  Alerts: "alerts",
  Shared: "common",
};
const groupOf = (name) =>
  ["Tasks.AuditDTO", "Users.ReasonRequestDTO"].includes(name)
    ? "common"
    : groups[name.split(".")[0]];
const chunks = new Map();
const schemaGroups = new Map();
for (const name of defs.keys())
  schemaGroups.set(schemaName(name), groupOf(name));
const header =
  "// Generated from fe-specs contract 0.3.0. Rebuild with npm run contracts.\n";
function schemaImports(code, group) {
  const imports = new Map();
  for (const name of new Set(code.match(/\b[A-Z]\w+Schema\b/g) ?? [])) {
    const from = schemaGroups.get(name);
    if (!from || from === group) continue;
    const source = from === "common" ? "@/types/common" : `@/features/${from}`;
    if (!imports.has(source)) imports.set(source, []);
    imports.get(source).push(name);
  }
  return [...imports]
    .map(
      ([source, names]) => `import { ${names.join(", ")} } from '${source}';`,
    )
    .join("\n");
}
function typeExpr(type, field, request) {
  let nullable = type.endsWith(" / null");
  type = type.replace(/ \/ null$/, "").trim();
  let e;
  if (type.startsWith("PageDTO<"))
    e = `page(${typeExpr(type.slice(8, -1), field, false)})`;
  else if (defs.has(type)) {
    emit(type);
    e = schemaName(type);
  } else if (type.startsWith("array<"))
    e = `z.array(${typeExpr(type.slice(6, -1), { name: field.name, rules: "" }, request)})`;
  else if (type.endsWith("[]"))
    e = `z.array(${typeExpr(type.slice(0, -2), { name: field.name, rules: "" }, request)})`;
  else if (type.startsWith("enum("))
    e = `z.enum(${JSON.stringify(
      type
        .slice(5, -1)
        .split(",")
        .map((v) => v.trim()),
    )})`;
  else if (type === "ID") e = "z.string().trim().min(1).max(100)";
  else if (type === "UTC" || type.includes("UTC ISO")) e = "z.iso.datetime()";
  else if (type.includes("YYYY-MM-DD")) e = "z.iso.date()";
  else if (type.startsWith("string")) {
    e = "z.string()";
    if (request && !/password/i.test(field.name)) e += ".trim()";
    if (type.includes("email") || field.name === "email") {
      if (request) e += ".toLowerCase()";
      e += ".email()";
    }
    let min = /độ dài ≥ (\d+)/.exec(field.rules)?.[1];
    let max = /độ dài ≤ (\d+)/.exec(field.rules)?.[1];
    const span = /dài (\d+)[–-](\d+)/i.exec(field.rules);
    if (span) {
      min = span[1];
      max = span[2];
    }
    if (min) e += `.min(${min}, 'Vui lòng nhập thông tin bắt buộc')`;
    if (max) e += `.max(${max})`;
    const pattern = /mẫu: ([^;]+)/.exec(field.rules)?.[1];
    if (pattern) e += `.regex(/${pattern}/)`;
    if (request && field.name === "links")
      e += `.url().refine(v => /^https?:\\/\\//.test(v), 'Chỉ nhận liên kết HTTP/HTTPS')`;
  } else if (type.startsWith("integer") || type === "number") {
    e = type.startsWith("integer")
      ? "z.number().int().safe()"
      : "z.number().finite()";
    const rules = type + "; " + field.rules;
    const min = /(?:^|[ ;])≥\s*(\d+)/.exec(rules)?.[1];
    const max = /≤\s*([\d.]+)/.exec(rules)?.[1];
    if (min) e += `.min(${min})`;
    if (max) e += `.max(${max})`;
    if (/> 0/.test(rules)) e += ".positive()";
  } else if (type === "boolean") e = "z.boolean()";
  else if (type === "true") e = "z.literal(true)";
  else if (type.startsWith('"')) e = `z.literal(${type})`;
  else if (type.startsWith("JSON value")) e = "z.json()";
  else if (type === "File" || type.startsWith("File "))
    e = "z.instanceof(Blob)";
  else throw new Error(`Unsupported type ${type} on ${field.name}`);
  return e + (nullable ? ".nullable()" : "");
}
function objectExpr(fields, request) {
  const roots = fields.filter((r) => !r.name.includes("."));
  return `z.object({\n${roots
    .map((r) => {
      let e;
      const key = r.name.replace(/\[\]$/, "");
      if (/^(array<object>|object)( \/ null)?$/.test(r.type)) {
        const prefix = `${r.name}${r.type.startsWith("array") ? "[]" : ""}.`;
        const children = fields
          .filter((f) => f.name.startsWith(prefix))
          .map((f) => ({ ...f, name: f.name.slice(prefix.length) }));
        e = objectExpr(children, request);
        if (r.type.startsWith("array")) e = `z.array(${e})`;
        if (r.type.endsWith("null")) e += ".nullable()";
      } else e = typeExpr(r.type, r, request);
      if (!r.required) {
        e += ".optional()";
        const defaultText = /mặc định ([^;\s]+)/.exec(r.rules)?.[1];
        if (defaultText)
          e += `.default(${/^\d+$/.test(defaultText) ? defaultText : JSON.stringify(defaultText)})`;
      }
      return `  ${JSON.stringify(key)}: ${e},`;
    })
    .join("\n")}\n})${request ? ".strict()" : ""}`;
}
function emit(name) {
  if (emitted.has(name)) return;
  emitted.add(name);
  const text = defs.get(name);
  const enumType = /^`(enum\([^\n]+\))`/m.exec(text)?.[1];
  let expr;
  if (name === "Shared.AnalysisSubjectDTO") {
    const variants = [
      ["TASK", "taskId"],
      ["PERSON", "userId"],
      ["PROJECT", "projectId"],
      ["PROCESS", "projectId"],
      ["METRIC", "metricCode"],
      ["UNIT", "unitId"],
    ];
    expr = `z.discriminatedUnion('kind', [${variants.map(([kind, key]) => `z.object({ kind: z.literal('${kind}'), ${key}: z.string().min(1).max(100)${kind === "PROCESS" ? ", stage: z.enum(['TODO','IN_PROGRESS','PENDING_REVIEW'])" : ""} }).strict()`).join(", ")}])`;
  } else if (enumType) expr = typeExpr(enumType, {}, false);
  else
    expr = objectExpr(
      rows(text),
      /(?:Create|Patch|Login|AssignTask|Remaining|Approve|Revision|Submit|Lock|ResetPassword|ReasonRequest|Members|Permissions|Query)DTO$/.test(
        name,
      ),
    );
  if (
    /\.(User|Project|Membership|Task|TimeLog|Submission|Report|AnalysisFeedback)DTO$/.test(
      name,
    )
  )
    expr += ".superRefine(checkProjection)";
  if (name === "Analytics.AnalysisDetailDTO")
    expr += ".superRefine(checkAnalysisDetail)";
  if (name === "Analytics.AnalysisJobDTO") expr += ".superRefine(checkJob)";
  if (name === "Shared.DomainActionDTO") expr += ".superRefine(checkAction)";
  const group = groupOf(name);
  if (!chunks.has(group)) chunks.set(group, []);
  chunks
    .get(group)
    .push(
      `export const ${schemaName(name)} = ${expr};\nexport type ${name.replace(".", "")} = z.output<typeof ${schemaName(name)}>;\n`,
    );
}
for (const name of defs.keys()) emit(name);
for (const [group, definitions] of chunks) {
  const code = definitions.join("\n");
  const checks = [
    "checkProjection",
    "checkAnalysisDetail",
    "checkJob",
    "checkAction",
  ].filter((name) => code.includes(name));
  const imports = checks.length
    ? `import { ${checks.join(", ")} } from '@/lib/validation/contract-refinements';\n`
    : "";
  const common =
    group === "common"
      ? `export const page = <T extends z.ZodType>(item: T) => z.object({ items: z.array(item), pagination: z.object({ page: z.number().int().min(1), pageSize: z.number().int().min(1).max(100), total: z.number().int().min(0) }) });\n`
      : "";
  write(
    group === "common"
      ? "src/types/common.ts"
      : `src/features/${group}/schemas/${group}.schema.ts`,
    `${header}import { z } from 'zod';\n${imports}${schemaImports(code, group)}\n${common}${code}`,
  );
}

const features = new Map();
const all = [];
for (const m of apiDoc.matchAll(
  /^## (\w+)\n([\s\S]*?)(?=^## |$(?![\s\S]))/gm,
)) {
  const [, name, text] = m;
  const route = /`(GET|POST|PATCH|PUT) ([^`]+)`/.exec(text);
  if (!route) continue;
  const feature = /Feature `(\S+)`/.exec(text)?.[1] ?? "analytics";
  const section = (title) =>
    new RegExp(`^### ${title}\\n([\\s\\S]*?)(?=^### |$(?![\\s\\S]))`, "m").exec(
      text,
    )?.[1] ?? "";
  const schema = (text, req) => {
    let fields = rows(text);
    if (fields.length) return objectExpr(fields, req);
    const ref = /PageDTO<[A-Z]\w*\.\w+DTO>|[A-Z]\w*\.\w+DTO/.exec(text)?.[0];
    return ref ? typeExpr(ref, {}, req) : "z.object({}).strict()";
  };
  const queryText = section("Query DTO");
  let query = schema(queryText, true);
  if (name === "listAnalyticsFilterOptions")
    query = `z.object({ kind: z.enum(['UNIT','PROJECT','TEAM','PERSON']), q: z.string().trim().max(255).optional(), unitId: z.string().min(1).optional(), projectId: z.string().min(1).optional(), teamId: z.string().min(1).optional(), page: z.number().int().min(1).optional().default(1), pageSize: z.number().int().min(1).max(100).optional().default(20) }).strict()`;
  const resText = section("Response DTO");
  let response =
    name === "downloadAttachment"
      ? "z.instanceof(Blob)"
      : schema(resText, false);
  let body = schema(section("Body DTO và whitelist"), true);
  if (name === "uploadAttachment")
    body = `z.object({ taskId: z.string().min(1), file: z.instanceof(Blob) }).strict()`;
  const version = /If-Match: bắt buộc/.test(text);
  const idempotency = /Idempotency-Key: bắt buộc|Idempotency-Key bắt buộc/.test(
    text,
  );
  const cacheText = section("Cache sau thao tác");
  const invalidates = [...cacheText.matchAll(/`([a-z][a-z-]+)`/g)].map(
    (x) => x[1],
  );
  const fields = rows(section("Body DTO và whitelist"));
  const permissions = /Quyền bổ sung: ([A-Z_]+)/.exec(text)?.[1] ?? null;
  const descriptor = {
    name,
    feature,
    method: route[1],
    path: route[2],
    version,
    idempotency,
    invalidates,
    permission: permissions,
    fields,
  };
  let code = `export const ${name}Contract = endpoint({ ...${JSON.stringify(descriptor)}, params: ${schema(section("Params DTO"), true)}, query: ${query}, body: ${body}, response: ${response} });\n`;
  if (!features.has(feature)) features.set(feature, []);
  features.get(feature).push(code);
  all.push(descriptor);
}
for (const [feature, codes] of features) {
  const code = codes.join("\n");
  const localSchemas = [
    ...new Set(code.match(/\b[A-Z]\w+Schema\b/g) ?? []),
  ].filter((name) => schemaGroups.get(name) === feature);
  const localImport = localSchemas.length
    ? `import { ${localSchemas.join(", ")} } from '../schemas/${feature}.schema';\n`
    : "";
  write(
    `src/features/${feature}/api/${feature}.contract.ts`,
    `${header}import { z } from 'zod';\nimport { endpoint } from '@/services/api-contract';\n${localImport}${schemaImports(code, feature)}\n${code.includes("page(") ? "import { page } from '@/types/common';\n" : ""}${code}`,
  );
  const names = all.filter((op) => op.feature === feature).map((op) => op.name);
  const serviceName =
    feature.replace(/-([a-z])/g, (_, c) => c.toUpperCase()) + "Service";
  const keysName =
    feature.replace(/-([a-z])/g, (_, c) => c.toUpperCase()) + "Keys";
  write(
    `src/features/${feature}/api/${feature}.service.ts`,
    `${header}import { apiClient } from '@/services/api-client';\nimport type { ContractRequest } from '@/services/api-contract';\n${feature === "auth" ? "import { token } from '@/services/auth-session';\n" : ""}import * as contracts from './${feature}.contract';\nexport const ${serviceName} = {\n${names.map((name) => (feature === "auth" && ["login", "refreshSession"].includes(name) ? `  ${name}: async (request: ContractRequest<typeof contracts.${name}Contract>) => {\n    const result = await apiClient.request(contracts.${name}Contract, request);\n    token.set(result.accessToken);\n    return result.session; // Credential stays in the transport adapter, outside React Query cache.\n  },` : `  ${name}: (request: ContractRequest<typeof contracts.${name}Contract>) => apiClient.request(contracts.${name}Contract, request),`)).join("\n")}\n};\n`,
  );
  write(
    `src/features/${feature}/api/${feature}.keys.ts`,
    `${header}import { normalizeQuery } from '@/lib/query/normalize-query';\nimport * as contracts from './${feature}.contract';\nexport const ${keysName} = {\n  all: ['${feature}'] as const,\n  viewer: (viewerId: string) => ['${feature}', viewerId] as const,\n${names
      .filter(
        (name) =>
          all.find((op) => op.name === name).method === "GET" &&
          name !== "downloadAttachment",
      )
      .map(
        (name) =>
          `  ${name}: (viewerId: string, params: Record<string, string> = {}, query: Record<string, unknown> = {}) => ['${feature}', viewerId, '${name}', params, normalizeQuery(contracts.${name}Contract.query.parse(query))] as const,`,
      )
      .join("\n")}\n};\n`,
  );
  const queries = names.filter(
    (name) =>
      all.find((op) => op.name === name).method === "GET" &&
      name !== "downloadAttachment",
  );
  const mutations = names.filter(
    (name) => !queries.includes(name) && name !== "refreshSession",
  );
  if (queries.length)
    write(
      `src/features/${feature}/hooks/use-${feature}-queries.ts`,
      `${header}'use client';\nimport { useFeatureQuery, type FeatureQueryOptions } from '@/lib/query/use-feature-query';\nimport type { ContractRequest } from '@/services/api-contract';\nimport * as contracts from '../api/${feature}.contract';\nimport { ${serviceName} } from '../api/${feature}.service';\nimport { ${keysName} } from '../api/${feature}.keys';\n${queries.map((name) => `export function use${name[0].toUpperCase() + name.slice(1)}Query(request: ContractRequest<typeof contracts.${name}Contract>, options: FeatureQueryOptions = {}) {\n  return useFeatureQuery(contracts.${name}Contract, request, ${serviceName}.${name}, ${keysName}.${name}, options);\n}`).join("\n")}`,
    );
  if (mutations.length)
    write(
      `src/features/${feature}/hooks/use-${feature}-mutations.ts`,
      `${header}'use client';\nimport { useFeatureMutation } from '@/lib/query/use-feature-mutation';\nimport * as contracts from '../api/${feature}.contract';\nimport { ${serviceName} } from '../api/${feature}.service';\n${mutations.map((name) => `export function use${name[0].toUpperCase() + name.slice(1)}Mutation() { return useFeatureMutation(contracts.${name}Contract, ${serviceName}.${name}); }`).join("\n")}`,
    );
  write(
    `src/features/${feature}/index.ts`,
    `${header}export * from './schemas/${feature}.schema';\nexport * from './api/${feature}.contract';\nexport { ${serviceName} } from './api/${feature}.service';\nexport { ${keysName} } from './api/${feature}.keys';\n`,
  );
  const components =
    feature === "auth"
      ? "export { LoginPage } from './components/login-page';\nexport { AuthObserver } from './components/auth-observer';\n"
      : feature === "tasks"
        ? "export { TaskListPage } from './components/task-list-page';\n"
        : "";
  write(
    `src/features/${feature}/client.ts`,
    `'use client';\n${queries.length ? `export * from './hooks/use-${feature}-queries';\n` : ""}${mutations.length ? `export * from './hooks/use-${feature}-mutations';\n` : ""}${components}`,
  );
  const types = [...defs.keys()]
    .filter((name) => groupOf(name) === feature)
    .map((name) => name.replace(".", ""));
  write(
    `src/features/${feature}/types/${feature}.types.ts`,
    `${header}export type { ${types.join(", ")} } from '../schemas/${feature}.schema';\n`,
  );
}
write(
  "src/contracts/registry.ts",
  [...features.keys()]
    .map(
      (f, i) => `import * as f${i} from '@/features/${f}/api/${f}.contract';`,
    )
    .join("\n") +
    `\nexport const operations = {\n${all.map((op) => `  ${op.name}: f${[...features.keys()].indexOf(op.feature)}.${op.name}Contract,`).join("\n")}\n};\n`,
);
write("src/contracts/manifest.json", JSON.stringify(all, null, 2));

// Extract the exact deterministic seed JSON from the supplied mock specification.
const mock = read("mock/MOCK_MODELS.txt");
function jsonAt(offset) {
  const start = mock.slice(offset).search(/^[\[{]/m) + offset;
  let depth = 0,
    quoted = false,
    escape = false;
  for (let i = start; i < mock.length; i++) {
    const c = mock[i];
    if (quoted) {
      if (escape) escape = false;
      else if (c === "\\") escape = true;
      else if (c === '"') quoted = false;
    } else if (c === '"') quoted = true;
    else if (c === "{" || c === "[") depth++;
    else if (c === "}" || c === "]") {
      depth--;
      if (!depth) return JSON.parse(mock.slice(start, i + 1));
    }
  }
  throw new Error("Incomplete fixture JSON");
}
const seed = {};
for (const m of mock.matchAll(/^6\.\d+\. (\w+)$/gm))
  seed[m[1]] = jsonAt(m.index + m[0].length);
const analysis = jsonAt(mock.indexOf("13. FIXTURE"));
const planned = jsonAt(mock.indexOf("16. BỔ SUNG"));
write(
  "src/mocks/data/seed.mock.json",
  JSON.stringify({ ...seed, planned, analysis }, null, 2),
);
await Promise.all(pendingWrites);
console.log(
  `Generated ${defs.size} DTO schemas, ${all.length} operations, ${features.size} feature APIs and deterministic fixtures.`,
);
