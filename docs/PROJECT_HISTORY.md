---
title: "Project History"
module: "general"
date: "2026-03-09"
status: "completed"
related_features:
  - authentication
  - user-settings
  - health-reports
  - dashboard
  - layout
---

# Project History

---

### 2026-03-06 — Initial Project Scaffold
- **Scope:** Full stack
- **Backend:** Scaffolded `life-gauge-api` with Express 4, Knex.js, MySQL 8, JWT auth (custom middleware), multer file upload, pdf-parse text extraction, Google Gemini AI integration
- **Frontend:** Scaffolded `life-gauge-web` with Angular (module-based, non-standalone), PrimeNG 21, Tailwind CSS 3, AG Grid Community
- **Migrations created:**
  - `20260306000001_create_users_table.js`
  - `20260306000002_create_user_settings_table.js`
  - `20260306000003_create_health_reports_table.js`
  - `20260306000004_create_health_test_results_table.js`
- **Docs:** Base docs created (`PROJECT_SUMMARY.md`, `PROJECT_HISTORY.md`, `API_SPEC.md`, `BACKEND_SPEC.md`, `MISTAKES.md`, `DEVELOPMENT_PROCESS.md`)

---

### 2026-03-06 — Authentication Feature
- **Scope:** API + Web
- **API changes:** `POST /api/auth/register`, `POST /api/auth/login`
- **Service logic:** bcryptjs password hashing (rounds=12), JWT signed with `JWT_SECRET`; default `user_settings` row created on register
- **Frontend:** `AuthModule` with `LoginComponent`, `RegisterComponent`; `AuthService` with `BehaviorSubject<User>`; JWT stored in `localStorage` under keys `lg_token` / `lg_user`; `AuthGuard` protects all non-auth routes; `AuthInterceptor` attaches `Authorization: Bearer` header to all outgoing requests
- **Docs:** `docs/feature/api/authentication.md`, `docs/feature/web/authentication.md`

---

### 2026-03-06 — Layout Shell
- **Scope:** Web
- **Frontend:** `LayoutModule` with `MainLayoutComponent`, `SidebarComponent`; collapsible sidebar (full w-64 / icon-only w-16); mobile overlay sidebar; `routerLinkActive` highlighting; logout button via `AuthService.logout()`
- **Docs:** `docs/feature/web/layout.md`

---

### 2026-03-06 — User Profile & Settings Feature
- **Scope:** API + Web
- **API changes:** `GET /api/users/profile`, `PUT /api/users/profile`, `PUT /api/users/password`, `GET /api/users/settings`, `PUT /api/users/settings`
- **Encryption:** LLM API key stored as AES-256-GCM ciphertext + IV + auth tag in `user_settings`; encryption key derived from `JWT_SECRET` env var via Node.js `crypto`
- **Frontend:** `SettingsModule` with `SettingsComponent`; three reactive forms: Profile, Password, LLM Config; `p-password` with toggle mask; `p-select` for model choice; `p-tag` shows "Configured" badge when key exists; `UserService` with `updateCurrentUser` tap to sync `AuthService` BehaviorSubject after profile save
- **Docs:** `docs/feature/api/user-settings.md`, `docs/feature/web/settings.md`

---

### 2026-03-06 — Health Reports Feature
- **Scope:** API + Web
- **API changes:** `GET /api/health-reports`, `POST /api/health-reports/upload`, `GET /api/health-reports/:id`, `DELETE /api/health-reports/:id`, `POST /api/health-reports/:id/reprocess`
- **Processing pipeline:** multer receives PDF → pdf-parse extracts text → Gemini generates structured JSON → individual rows inserted into `health_test_results`; processing is async fire-and-forget; report returns immediately with `processing` status
- **Status lifecycle:** `pending` (no API key) → `processing` → `completed` / `failed`
- **Reprocess:** Deletes existing `health_test_results` for the report then re-runs Gemini pipeline
- **Delete:** Removes file from disk + cascades delete to `health_test_results`
- **Frontend:** `HealthTestsModule` with `HealthTestsComponent` (paginated report table), `UploadDialogComponent` (file picker), `ReportDetailComponent` (grouped test results per report)
- **Docs:** `docs/feature/api/health-reports.md`, `docs/feature/web/health-tests.md`

---

### 2026-03-06 — Dashboard Feature
- **Scope:** API + Web
- **API changes:** `GET /api/dashboard/summary`, `GET /api/dashboard/test/:key/history`
- **Query logic:** Self-join subquery to get latest + previous value per test key; grouped by category in defined order (`CATEGORY_ORDER` constant)
- **Categories:** Hormones & Vitamins, Cardiac Markers, Lipid Profile, Liver Function, Kidney Function, Blood Sugar, Hematology, Urinalysis
- **Test keys supported:** 100+ keys covering all major blood panel tests
- **Frontend:** `DashboardModule` with `DashboardComponent`, `TestCardComponent`, `TestHistoryDialogComponent`; test cards show value, unit, flag badge, trend arrow, reference range progress bar, previous value; history dialog shows Chart.js line chart with annotation box for reference range
- **Docs:** `docs/feature/api/dashboard.md`, `docs/feature/web/dashboard.md`

---

### 2026-03-06 — Bug Fixes
- **CORS error on login:** `cors.js` was computing allowed origin from `NG_API_BASE_URL` (backend's own port). Fixed to use dedicated `FRONTEND_URL` env var.
- **UI change detection:** All HTTP subscribe callbacks lacked `ChangeDetectorRef.detectChanges()`. Fixed across all 5 components: `DashboardComponent`, `HealthTestsComponent`, `TestHistoryDialogComponent`, `ReportDetailComponent`, `SettingsComponent`.
- **Settings button padding:** Submit buttons inside settings forms had no visual separation from the last input. Fixed by wrapping each `p-button[type=submit]` in `<div class="pt-4 border-t border-slate-700/50">`.
- **PrimeNG severity type errors:** `p-tag [severity]` binding required exact union type. Fixed return types in `TestCard`, `TestHistoryDialog`, `HealthTests`, `ReportDetail`.
- **Tailwind v4 PostCSS error:** `npm install tailwindcss` installed v4 which changed its PostCSS API. Fixed by pinning to `tailwindcss@3`.
- **PrimeNG legacy CSS removed:** `primeng/resources/themes/lara-dark-blue/theme.css` no longer exists in PrimeNG 19+. Removed from `styles.scss`; switched to `providePrimeNG` with `@primeuix/themes/aura`.

---

### 2026-03-07 — Settings: Custom Gemini Model Input
- **Scope:** Web
- **Change:** LLM model field in Settings now supports free-text entry in addition to preset dropdown
- `useCustomModel: boolean` flag added to `SettingsComponent`; auto-detected on load (if saved model doesn't match any preset, custom mode activates automatically)
- Toggle link "Enter custom model" / "Use preset" switches between `p-select` and `pInputText`; reverting to preset resets the value to `gemini-2.0-flash`
- `llm_model` form control always holds the final value regardless of mode — `saveLlm()` unchanged
- **Docs:** `docs/feature/web/settings.md`

---

### 2026-03-07 — SSE Real-Time Upload Processing
- **Scope:** API + Web
- **API changes:** Added `GET /api/health-reports/:id/stream` — SSE endpoint, authenticated via `?token=` query param (browser `EventSource` cannot send custom headers); polls DB every 2 s; closes stream when `status` reaches `completed` or `failed`
- Route registered before `router.use(auth)` so JWT middleware is bypassed; controller performs its own `verify()` call
- **Frontend:** `HealthReportService.streamStatus(id)` wraps native `EventSource` in an `Observable<ReportStatusEvent>`; cleans up on unsubscribe
- `UploadDialog` now shows a processing state after upload: Gemini AI icon, animated progress bar (ticks to ~88% while waiting, jumps to 100% on completion), error state (bar turns red, 1.5 s hold) on failure; dialog close disabled during processing
- **Docs:** `docs/feature/api/health-reports.md`, `docs/feature/web/health-tests.md`

---

### 2026-03-07 — Bug Fixes
- **Flag threshold equality:** Gemini sometimes returns `normal` when a value sits exactly on a reference boundary. Backend now post-processes parsed results: `value >= ref_max → 'high'`, `value <= ref_min → 'low'`. Applied in `processWithGemini()` for both upload and reprocess.
- **Prev date layout:** In test cards the previous report date was positioned far-right with `ml-auto`, visually suggesting it was the current report's date. Moved inline: `Prev: 21.33 ng/mL · 26 Apr 24`.

---

### 2026-03-07 — Dashboard Filters
- **Scope:** Web
- **Search filter:** Text input at top of dashboard; filters by `display_name` or `test_key` (case-insensitive); categories with zero matching tests are hidden
- **Flag multi-select filter:** `p-multiselect` alongside the search input; options: Normal / High / Low / Abnormal / Unknown, each with a coloured dot; empty selection = show all; `[showClear]="true"` for one-click reset
- Both filters are applied together via `filteredCategories` getter
- Empty state when no matches: "No tests match the current filters" + "Clear filters" button that resets both `searchQuery` and `selectedFlags`
- `MultiSelectModule` added to `SharedModule`
- **Docs:** `docs/feature/web/dashboard.md`

---

### 2026-03-08 — Admin Role & App Settings Feature
- **Scope:** API + Web + DevOps
- **Migrations:**
  - `20260308000001_add_role_and_force_password_change_to_users.js` — adds `role` (enum: user/admin) and `force_password_change` (boolean) to `users` table
  - `20260308000002_create_app_settings_table.js` — key-value settings table with default `allow_signups=false`
  - `20260308000003_create_test_definitions_table.js` — configurable test keys with display name, category, unit, ref range, active flag, sort order
  - `20260308000004_seed_test_definitions_from_constants.js` — data migration populating test_definitions from the hardcoded `TEST_CATEGORIES` constant (100+ tests)
- **Seed update:** Default seed user changed to `admin@lifegauge.app` with `role=admin`, `force_password_change=true`
- **API changes:**
  - `GET /api/auth/signup-allowed` — public endpoint returning `{ allowed: boolean }`
  - `POST /api/auth/register` — now checks `allow_signups` setting; returns 403 if disabled
  - `POST /api/auth/login` — response now includes `role` and `force_password_change`
  - `GET /api/users/profile` — response now includes `role` and `force_password_change`
  - `PUT /api/users/password` — clears `force_password_change` flag on success
  - Admin endpoints (all require auth + admin role):
    - `GET /api/admin/settings` — get app settings
    - `PUT /api/admin/settings` — update a setting by key
    - `GET /api/admin/users` — list all users
    - `POST /api/admin/users` — create user with default password (force_password_change=true)
    - `PUT /api/admin/users/:id/role` — toggle user role
    - `PUT /api/admin/users/:id/reset-password` — reset password (sets force_password_change=true)
    - `DELETE /api/admin/users/:id` — delete user and all their data
    - `GET /api/admin/test-definitions` — list all test definitions
    - `POST /api/admin/test-definitions` — add a new test definition
    - `PUT /api/admin/test-definitions/:id` — edit test definition
    - `DELETE /api/admin/test-definitions/:id` — delete test definition
- **Backend middleware:** `adminMiddleware.js` — checks `req.user.id` has `role=admin` in DB
- **Gemini integration updated:** Prompt now built dynamically from `test_definitions` table (active tests only); category mapping also from DB
- **Frontend:**
  - `User` model extended with `role` and `force_password_change`
  - `AdminService` — HTTP client for all admin endpoints
  - `AdminGuard` — protects `/app-settings` route (admin-only)
  - `AppSettingsModule` — 3-tab layout (General, User Management, Test Definitions):
    - General tab: toggle switch for signup control
    - User Management tab: user table with add/edit-role/reset-password/delete actions
    - Test Definitions tab: paginated table with add/edit/delete; category select, test key validation
  - `ChangePassword` component at `/auth/change-password` — forced password change page
  - `AuthGuard` updated to redirect to change-password if `force_password_change=true`
  - Login component redirects to change-password when flag is set
  - Login/Register check `signup-allowed` API; register link hidden when signups disabled
  - Sidebar dynamically shows "App Settings" link for admin users only
  - `TabsModule` and `ToggleSwitchModule` added to `SharedModule`
- **Docker/Nginx:**
  - Created `life-gauge-web/Dockerfile` — multi-stage build (Node 20 → nginx:alpine)
  - Created `life-gauge-web/nginx.conf` — serves Angular SPA + proxies `/api/` to backend container
  - Updated `docker-compose.yml` — API no longer exposed externally (uses `expose` instead of `ports`); web container maps `NG_PORT:80`; API_PORT passed as env to nginx for `proxy_pass`
- **Docs:** `docs/feature/api/admin.md`, `docs/feature/web/app-settings.md`

---

### 2026-03-08 — Test Definitions: Descriptions & Missing Tests
- **Scope:** API + Web
- **Migrations:**
  - `20260308000005` — adds `description` (TEXT) and `category_order` (INT) columns to `test_definitions`
  - `20260308000006` — populates descriptions for all 107 existing tests, updates display names, adds 4 missing tests (`apo_a1`, `apo_b`, `apo_b_a1_ratio`, `avg_blood_glucose`)
- **API changes:** `GET /api/dashboard/test/:key/history` now returns `{ history: [...], description: string | null }` instead of flat array
- **Frontend:** Test history dialog shows medical description below the header, above the chart
- **Total test definitions:** 111

---

### 2026-03-09 — Docker, Environment & Admin User Improvements
- **Scope:** API + Web + DevOps
- **Migrations:**
  - `20260308000007_seed_default_admin_user.js` — idempotent migration creating default admin user (admin/admin, force_password_change=true) if no users exist
- **Docker fixes:**
  - `DB_PORT: 3306` override added to API container in docker-compose.yml (host DB_PORT from .env was leaking into container, causing ECONNREFUSED on non-standard port)
  - MySQL retry loop in API command: `until npx knex migrate:latest --env production; do sleep 3; done` (mysqladmin ping healthcheck passes before MySQL accepts TCP connections)
  - Knex CLI now uses `--env production` flag explicitly
- **Environment simplification:**
  - Removed `FRONTEND_URL` and `NG_API_BASE_URL` from `.env` / `.env.example`
  - CORS origin now derived from `NG_PORT` env var: `http://localhost:${NG_PORT}`
  - `NODE_ENV` commented out (optional); Knex defaults to `production` environment
  - `config/db.js` defaults to `production` instead of `development`
- **Angular production build fix:**
  - Added `fileReplacements` to `angular.json` production configuration so `@angular/build:application` builder swaps `environment.ts` → `environment.prod.ts`
- **Seed file update:** `seeds/01_seed_users.js` made idempotent (skips if users exist), credentials changed to admin/admin
- **Docs:** Updated all docs to reflect changes
