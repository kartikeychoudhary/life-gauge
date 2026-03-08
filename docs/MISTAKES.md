---
title: "Mistakes & Lessons Log"
module: "general"
date: "2026-03-06"
status: "in-progress"
related_features: []
---

# Mistakes & Lessons Log

> This file is maintained by Claude. Re-read before every task to avoid repeating errors.

<!-- Log entries go below in reverse chronological order -->

### 2026-03-08 — PrimeNG ToggleSwitch module name casing
- **What happened:** PrimeNG MCP tool returned `ToggleswitchModule` but Angular build failed with "Did you mean 'ToggleSwitchModule'?"
- **Root cause:** The MCP tool documentation had incorrect casing. The actual export is `ToggleSwitchModule` (PascalCase).
- **Fix:** Changed import to `ToggleSwitchModule` from `primeng/toggleswitch`.
- **Prevention:** Always verify PrimeNG module export names against actual build output. MCP tool may have casing differences.

### 2026-03-09 — PrimeNG TextareaModule import path
- **What happened:** Tried `InputTextareaModule` from `primeng/inputtextarea` — module not found in PrimeNG v21.
- **Root cause:** PrimeNG v21 renamed the module. The correct export is `TextareaModule` from `primeng/textarea`, with directive `pTextarea` (not `pInputTextarea`).
- **Fix:** Import `TextareaModule` from `primeng/textarea`.
- **Prevention:** Check PrimeNG package exports (`node_modules/primeng/package.json` exports map) when unsure about module paths.

### 2026-03-09 — Docker DB_PORT leaking from host .env
- **What happened:** API container got `ECONNREFUSED 172.19.0.2:3309`. The `.env` file had `DB_PORT=3309` (for host-mapped MySQL port), but this was injected into the API container via `env_file: .env`.
- **Root cause:** Inside Docker, MySQL listens on its internal port 3306, not the host-mapped 3309. The API container should always connect on port 3306.
- **Fix:** Added `DB_PORT: 3306` environment override in `docker-compose.yml` for the API service (overrides the .env value).
- **Prevention:** Always override container-internal ports in docker-compose.yml when the host-mapped port differs from the internal port.

### 2026-03-09 — Angular production build not using environment.prod.ts
- **What happened:** Frontend Docker build served `environment.ts` (dev, `localhost:3000/api`) instead of `environment.prod.ts` (`/api`), causing `ERR_CONNECTION_REFUSED`.
- **Root cause:** The `@angular/build:application` builder (Angular 17+) does not auto-detect environment files. Requires explicit `fileReplacements` in `angular.json` production configuration.
- **Fix:** Added `fileReplacements` array to `angular.json` production config: `{ replace: "src/environments/environment.ts", with: "src/environments/environment.prod.ts" }`.
- **Prevention:** Always configure `fileReplacements` in `angular.json` when using the `@angular/build:application` builder.

### 2026-03-09 — MySQL healthcheck passes before TCP connections ready
- **What happened:** `ECONNREFUSED 172.19.0.2:3306` even after switching to production env. MySQL Docker healthcheck (`mysqladmin ping`) passed, API container started, but MySQL wasn't accepting TCP connections yet.
- **Root cause:** `mysqladmin ping` succeeds before MySQL is fully ready for client connections. The depends_on healthcheck is insufficient.
- **Fix:** Wrapped migration command in a retry loop: `until npx knex migrate:latest --env production; do echo 'retrying...'; sleep 3; done`.
- **Prevention:** Use application-level retry loops for database connectivity instead of relying solely on Docker healthchecks.
