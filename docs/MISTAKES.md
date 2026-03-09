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

### 2026-03-09 — Nginx 413 Content Too Large on PDF upload
- **What happened:** Production deployment returned `413 Content Too Large` when uploading PDF health reports via `/api/health-reports/upload`.
- **Root cause:** Nginx default `client_max_body_size` is 1MB. The API accepts up to 25MB uploads (multer config), but nginx proxy rejected the request before it reached the API.
- **Fix:** Added `client_max_body_size 25m;` to the `/api/` location block in `life-gauge-web/nginx.conf`.
- **Prevention:** Always set `client_max_body_size` in nginx when proxying file uploads. Match the limit to the backend's upload size configuration.

### 2026-03-09 — PrimeNG multiselect onClear not updating filtered view
- **What happened:** Dashboard multiselect filter worked when selecting values, but clicking the clear (cross) button did not remove the filter — the view stayed filtered.
- **Root cause:** Angular change detection did not trigger on `(onClear)` because the getter-based `filteredCategories` wasn't re-evaluated. The `selectedFlags` array was cleared but the view wasn't updated.
- **Fix:** Added `(onChange)="cdr.detectChanges()"` and `(onClear)="selectedFlags = []; cdr.detectChanges()"` to the multiselect. Made `ChangeDetectorRef` public so it can be used in the template.
- **Prevention:** When using getter-based computed properties with PrimeNG form controls, explicitly trigger change detection on value changes.

### 2026-03-09 — MySQL healthcheck passes before TCP connections ready
- **What happened:** `ECONNREFUSED 172.19.0.2:3306` even after switching to production env. MySQL Docker healthcheck (`mysqladmin ping`) passed, API container started, but MySQL wasn't accepting TCP connections yet.
- **Root cause:** `mysqladmin ping` succeeds before MySQL is fully ready for client connections. The depends_on healthcheck is insufficient.
- **Fix:** Wrapped migration command in a retry loop: `until npx knex migrate:latest --env production; do echo 'retrying...'; sleep 3; done`.
- **Prevention:** Use application-level retry loops for database connectivity instead of relying solely on Docker healthchecks.
