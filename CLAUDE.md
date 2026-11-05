# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Work/project management system with an AI-assisted analytics module (risk of delay, workload, bottlenecks, alerts). AI explanations are currently simulated, not real LLM calls. Docs and UI text are Vietnamese; code identifiers are English.

## Read first (don't rediscover)

- `docs/PROJECT_MAP.md`: current state of FE + BE, known bugs/gaps (section 5), next priorities. Update it when you fix or find something.
- `docs/CHANGE_REQUESTS.md`: the next priority (project-based navigation). Read it before touching `sidebar-content.tsx` / `ui-store.ts`.
- `FE/AGENTS.md`: binding FE architecture constraints and settled product/UI decisions. Follow it for any FE change.
- `BE/docs/CODING_STYLE.md`: binding BE conventions.
- `docs/DATABASE.md`: schema, migrations, seeding, common errors. `docs/ADMIN_MODULES.md`: admin area spec (dynamic RBAC, audit log, jobs, `SystemConfigs`, IP whitelist).
- `FE/fe-specs/`: source of truth for screen behavior (S01–S43), API catalog (`api/API_CATALOG.md`), DTOs (`api/DTO_MODELS.md`), state machines (`rules/`).

## Big picture

Two parts, developed separately:

- **FE** (`FE/`): Next.js 16 App Router, TS strict, Tailwind 4, RHF + Zod, TanStack Query, Zustand (UI state only). Essentially feature-complete, but runs on **MSW mocks** by default.
- **BE** (`BE/`): .NET 8 microservices behind a YARP `Gateway` (port 5000, JWT, CORS, the only public entry at `/api/*`): `Identity.Api` (5101), `Projects.Api` (5102), `Tasks.Api` (5103), `Analytics.Api` (5104). All services share one PostgreSQL database through `Shared/Shared.Entities` (entities, `ApplicationDbContext`, migrations, `[RequiresPermission]`/`[AdminArea]`). `Shared.Commons` holds exceptions, `[Audit]` and paging. `Shared.Configuration` loads the `SystemConfigs` table into `IConfiguration` (reloads every 30s). BE has no test project yet.
- The FE defined its contract while mocking, and the BE was written afterwards. **They are not guaranteed to match field by field.** The main remaining work is reconciling and wiring FE ↔ BE. Compare `FE/src/features/<f>/schemas/*.schema.ts` (Zod, the FE source of truth) with `BE/Services/<S>.Api/Models/Dtos/*.cs`. A missing BE field is the usual cause of breakage.

### FE data flow

component → hook (React Query) → feature service (shared Axios client `src/services/api-client.ts`, which handles auth/refresh, If-Match and Idempotency-Key) → HTTP → in mock mode an MSW handler (`src/mocks/handlers/`) → `src/mocks/db.ts` (CRUD, permissions, state machine, audit), seeded from `src/mocks/data.json`. Never import mocks into UI or services. Each feature has `api/ schemas/ types/ hooks/ components/`, with no barrels, registries or generators. Filters and pagination live in the URL. Tokens are kept in memory only.

`FE/.env` switches the mode: `NEXT_PUBLIC_API_MODE=mock|http` and `NEXT_PUBLIC_API_BASE_URL` (`/api` for mock, `http://localhost:5000/api` for the real gateway). Restart the dev server after editing `.env`. Don't use `.env.development`.

### BE service layout

Every service under `Services/` has the same structure (`Controllers/`, `Interfaces/I<X>Service`, `Services/`, `Models/{Requests,Queries,Dtos}`, `Extensions/`, `Filters/`). Controllers are thin, with one service call per action. Expression-bodied (`=>`) methods are forbidden for anything that does real work. Routes and JSON fields are camelCase and must match `API_CATALOG.md`.

## Commands

FE (from `FE/`):
```
npm run dev                       # http://localhost:3000; dev accounts: minh (manager), lan/huy (members), admin
npm run typecheck
npm run lint                      # --max-warnings=0
npm test                          # vitest, tests/**/*.test.ts(x), HTTP tests against MSW
npx vitest run tests/projects-http.test.ts   # a single file; add -t "<name>" for a single test
npm run test:live                 # contract probe (tests/live/*.probe.ts) against a running gateway; LIVE_API_BASE_URL, LIVE_PASSWORD
npm run build
```

DB + BE (from `BE/`; copy `appsettings.Shared.example.json` to `appsettings.Shared.json` (gitignored) and fill in the connection string and `Jwt:SigningKey` (≥32 chars)):
```
docker compose up -d db           # from the repo root; Postgres on host port 55432 (the shared DB is currently Neon)
dotnet ef database update --project Shared/Shared.Entities --startup-project Services/Identity.Api --context ApplicationDbContext
dotnet ef migrations add <Name> --project Shared/Shared.Entities --startup-project Services/Identity.Api --context ApplicationDbContext
dotnet run --project Tools/DataSeeder [-- --reset]   # seeds from FE/src/mocks/data.json
dotnet build DATN.slnx
dotnet run --project Gateway      # plus each Services/<X>.Api, one terminal each
```

## Rules

- After a BE change, run `dotnet build BE/DATN.slnx`. After an FE change, run typecheck, lint and the relevant tests, then the full suite.
- FE tests must assert real behavior (HTTP, permissions, state), not copied CSS classes. Don't change business logic just to make a test pass.
- Before UI work, load the design guidance in `Skill FE/` (`codex/AGENTS.md` and the matching skill), per `FE/AGENTS.md`.
- For manual UI checks, use only the user's open Edge browser. No Playwright/CDP, and don't launch other browsers.
- Next.js 16 has breaking changes: read `FE/node_modules/next/dist/docs/` before using framework APIs.
- Don't commit or push unless asked.

### CodeGraph

- Look up code with CodeGraph first: the MCP tool `codegraph_explore` (pass `projectPath` = repo root; it is a deferred tool, so load it by name via ToolSearch when needed). It returns the symbols' source plus their call paths, so don't Read those files again.
- Shell fallback, which always works: `codegraph explore "<symbols or question>"`. For a single symbol or file use `codegraph node <name>`. Before editing a symbol, check its impact with `codegraph impact <symbol>`, `codegraph callers <symbol>` or `codegraph callees <symbol>`.
- Use grep, glob or manual reads for broad discovery only when CodeGraph returns nothing or isn't available.
- The index must exist: `codegraph status` should not report "Not initialized". After pulling or making large changes, run `codegraph sync` to refresh it.

[ANTI-AI-SLOP RULES FOR UI]

1. NO GENERIC GRADIENTS: Cấm sử dụng gradient xanh-tím (purple-to-blue) lặp đi lặp lại. Nếu dùng gradient, hãy phối các màu có độ tương phản cao hoặc tinh tế hơn (ví dụ: hổ phách sang cam, xám đen sang bạc).
2. NO DEFAULT SHADOWS: Không dùng shadow lơ lửng vô tội vạ làm giao diện bị bẩn. Dùng shadow phẳng (flat design) hoặc không shadow (border-only).
3. VARIETY OF BORDER RADIUS: Không lạm dụng bo góc 4px hay 8px cho mọi thứ. Hãy kết hợp nút bo tròn hoàn toàn (pill-shaped) với các thẻ vuông vức để tạo nhịp điệu thị giác.
4. MICRO-ANIMATIONS: Thêm hiệu ứng hover, transition mượt mà (smooth easing) cho các nút và thẻ để giao diện có "sự sống".
