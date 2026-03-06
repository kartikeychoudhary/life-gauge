# CLAUDE.md — Master Instructions for Claude Code Bot

> **Project:** Life Gauge: A web app to log and monitor health test files.
> **Owner:** Kartikey Choudhary
> **Date:** March 2026

## 🔴 CRITICAL RULES — READ BEFORE WRITING ANY CODE

1. **NEVER deviate from the defined tech stack.** If you think a different library/tool would be better, ASK the developer first. Do not silently swap or add dependencies.
2. **Angular components MUST be non-standalone (module-based).** If you generate a standalone component at any point, delete it and redo it. Use `ng generate component <name> --module=<module> --standalone=false`.
3. **Only these UI libraries are permitted on the frontend:** PrimeNG, AG Grid, Tailwind CSS. No Material, No Bootstrap, No other CSS frameworks, No FortAwesome unless explicitly approved.
4. **Backend uses Knex.js migrations for all database schema changes.** Never hand-edit the database schema directly. All changes go through versioned migration files.
5. **Maintain the `docs/MISTAKES.md` file** (see below). Every time you encounter an error, a build failure, a test failure, or need to retry something, log it. Re-read `docs/MISTAKES.md` at the start of every new task.
6. **Before starting any feature**, read the `docs/DEVELOPMENT_PROCESS.md` file and follow the defined process exactly.
7. **Never use co-authored-by in git commits.**
8. **All database queries must go through Knex.js query builder.** No raw SQL strings unless absolutely necessary and approved by the developer.
9. **JWT auth is already implemented.** Do not re-implement or replace the auth system. Extend it through the existing middleware pattern.
10. **Single `.env` file at the project root.** Both backend and frontend read from `life-gauge/.env`. Do NOT create separate `.env` files inside `life-gauge-api/` or `life-gauge-web/`. The `docker-compose.yml` also references this same file.
11. **Docker Compose is the primary way to run the full stack.** Use `docker-compose up` from the root directory. Individual services can still be run standalone for debugging.
12. **After completing any feature**, follow the **Feature Documentation Workflow** section. Update `PROJECT_SUMMARY.md`, `PROJECT_HISTORY.md`, `API_SPEC.md`, `BACKEND_SPEC.md`, and create per-feature docs in `docs/feature/api/` and `docs/feature/web/`. Every doc file must have a Front Matter header.

---

## 📁 Project Structure Overview

```
life-gauge/
├── life-gauge-api/                  # Node.js Express Backend
│   ├── src/
│   │   ├── index.js                 # App entry point
│   │   ├── app.js                   # Express app setup (middleware, routes)
│   │   ├── config/
│   │   │   ├── db.js                # Knex instance & connection config
│   │   │   ├── env.js               # Loads env vars from root .env
│   │   │   └── cors.js              # CORS configuration
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js     # JWT verification middleware
│   │   │   ├── errorHandler.js       # Global error handler
│   │   │   └── validator.js          # Request validation middleware
│   │   ├── auth/                     # Authentication module
│   │   │   ├── auth.routes.js
│   │   │   ├── auth.controller.js
│   │   │   └── auth.service.js
│   │   ├── user/                     # User management
│   │   │   ├── user.routes.js
│   │   │   ├── user.controller.js
│   │   │   └── user.service.js
│   │   ├── healthtest/               # Health test file uploads & records
│   │   │   ├── healthtest.routes.js
│   │   │   ├── healthtest.controller.js
│   │   │   └── healthtest.service.js
│   │   ├── report/                   # Reports & analytics
│   │   │   ├── report.routes.js
│   │   │   ├── report.controller.js
│   │   │   └── report.service.js
│   │   ├── dashboard/                # Dashboard data endpoints
│   │   │   ├── dashboard.routes.js
│   │   │   ├── dashboard.controller.js
│   │   │   └── dashboard.service.js
│   │   └── common/                   # Shared utilities
│   │       ├── errors.js             # Custom error classes
│   │       ├── jwt.js                # JWT sign/verify helpers
│   │       ├── pagination.js         # Pagination utility
│   │       └── constants.js          # App-wide constants
│   ├── migrations/                   # Knex migration files
│   │   ├── 20260301000001_create_users_table.js
│   │   ├── 20260301000002_create_health_tests_table.js
│   │   └── ...
│   ├── seeds/                        # Knex seed files (dev data)
│   │   └── 01_seed_users.js
│   ├── knexfile.js                   # Knex configuration (reads root .env)
│   └── package.json
│
├── life-gauge-web/                  # Angular Frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── app.module.ts         # Root module
│   │   │   ├── app-routing.module.ts
│   │   │   ├── core/                 # Singleton services, guards, interceptors
│   │   │   │   ├── core.module.ts
│   │   │   │   ├── guards/
│   │   │   │   │   └── auth.guard.ts
│   │   │   │   ├── interceptors/
│   │   │   │   │   ├── auth.interceptor.ts    # Attach JWT to requests
│   │   │   │   │   └── error.interceptor.ts   # Global HTTP error handling
│   │   │   │   ├── services/
│   │   │   │   │   ├── auth.service.ts
│   │   │   │   │   └── storage.service.ts
│   │   │   │   └── models/           # Interfaces / types
│   │   │   ├── shared/               # Shared pipes, directives, components
│   │   │   │   └── shared.module.ts
│   │   │   ├── modules/
│   │   │   │   ├── auth/             # Login / Register module
│   │   │   │   ├── dashboard/        # Home / Dashboard module
│   │   │   │   ├── health-tests/     # Health test listing & upload module
│   │   │   │   ├── reports/          # Reports & trends module
│   │   │   │   └── settings/         # User settings module
│   │   │   └── layout/               # Sidebar, header, footer
│   │   │       └── layout.module.ts
│   │   ├── assets/
│   │   ├── environments/
│   │   │   ├── environment.ts
│   │   │   └── environment.prod.ts
│   │   └── styles.scss
│   ├── angular.json
│   ├── tailwind.config.js
│   └── package.json
│
├── CLAUDE.md                        # THIS FILE — Master instructions
├── docker-compose.yml               # Docker Compose for all services
├── .env                             # Single env file for entire project (git-ignored)
├── .env.example                     # Template for env vars (committed)
├── docs/                            # All project documentation
│   ├── PROJECT_SUMMARY.md           # High-level project overview
│   ├── PROJECT_HISTORY.md           # Chronological changelog
│   ├── API_SPEC.md                  # Central API endpoint registry
│   ├── BACKEND_SPEC.md              # Migrations, DB schema, backend decisions
│   ├── MISTAKES.md                  # Error/retry log (Claude maintains this)
│   ├── DEVELOPMENT_PROCESS.md       # Step-by-step dev workflow
│   └── feature/                     # Per-feature documentation
│       ├── api/                     # Backend docs per feature
│       │   └── FEATURE_NAME.md
│       └── web/                     # Frontend docs per feature
│           └── FEATURE_NAME.md
└── .gitignore
```

---

## 🛠 Tech Stack — LOCKED (Do Not Change)

### Backend

| Component       | Technology              | Version            |
| --------------- | ----------------------- | ------------------ |
| Runtime         | Node.js                 | 20.x LTS          |
| Framework       | Express.js              | 4.x                |
| Database        | MySQL                   | 8.x                |
| Query Builder   | Knex.js                 | Latest stable      |
| DB Migrations   | Knex.js migrations      | Via Knex CLI       |
| Auth            | JWT (jsonwebtoken)      | Latest stable      |
| Password Hash   | bcryptjs                | Latest stable      |
| Validation      | express-validator / Joi | Latest stable      |
| Env Config      | dotenv                  | Latest stable      |
| File Upload     | multer                  | Latest stable      |
| CORS            | cors                    | Latest stable      |
| Logging         | morgan                  | Latest stable      |

### Frontend

| Component       | Technology                            | Version            |
| --------------- | ------------------------------------- | ------------------ |
| Framework       | Angular (non-standalone components ONLY) | 17 or 18        |
| UI Components   | PrimeNG                               | Latest compatible  |
| Data Grid       | AG Grid Community                     | Latest compatible  |
| CSS Framework   | Tailwind CSS                          | 3.x                |
| Charts          | PrimeNG Charts (Chart.js wrapper)     | Via PrimeNG        |
| HTTP            | Angular HttpClient                    | Built-in           |
| State Mgmt      | Services + BehaviorSubject            | Built-in RxJS      |

### ❌ FORBIDDEN Libraries (Do NOT install these)

- Angular Material
- Bootstrap / ng-bootstrap
- NgRx (keep it simple with services + BehaviorSubject)
- Standalone Angular components
- Any other CSS framework
- Sequelize / TypeORM / Prisma (Knex.js only)
- Lodash (use native JS)
- Moment.js (use date-fns or native Date)
- Passport.js (use custom JWT middleware already in place)

---

## 🗄 Database Migration Rules (Knex.js)

1. **Create migrations using Knex CLI only:**
   ```bash
   cd life-gauge-api
   npx knex migrate:make <descriptive_name>
   ```
2. **File naming is automatic** — Knex prepends a timestamp. Never rename migration files.
3. **Every migration must have both `up` and `down` functions.** The `down` must cleanly reverse the `up`.
4. **Never modify a migration that has already been committed to `main`.** Create a new migration instead.
5. **Run migrations before starting the app in dev:**
   ```bash
   npx knex migrate:latest
   ```
6. **Seed data** goes in the `seeds/` directory and is for dev/test only — never for production.

---

## 🐳 Docker & Environment Configuration

### Single Root `.env` File

All configuration lives in one `.env` file at the project root. Both `docker-compose.yml` and the individual apps read from it. The `.env.example` template must be kept in sync and committed to version control.

**Expected `.env` variables:**
```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=life_gauge
DB_USER=root
DB_PASSWORD=secret

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRY=24h

# Backend
API_PORT=3000
NODE_ENV=development

# Frontend
NG_API_BASE_URL=http://localhost:3000/api
NG_PORT=4200
```

**How each part reads the root `.env`:**
- **docker-compose.yml:** Uses `env_file: .env` directive — variables are injected into containers automatically.
- **Backend (life-gauge-api):** The `config/env.js` file uses `dotenv` with `path: '../../.env'` (or the Docker-injected env vars when containerized).
- **Frontend (life-gauge-web):** A build script or `environment.ts` reads from `NG_`-prefixed vars at build time. Angular `environment.ts` files are generated/populated from the root `.env` during build.

### docker-compose.yml

The `docker-compose.yml` at the project root orchestrates three services:
- **db** — MySQL 8.x container with a named volume for persistence.
- **api** — Node.js backend; depends on `db`, runs migrations on startup.
- **web** — Angular frontend served via `ng serve` (dev) or Nginx (prod).

**Rules:**
- Never hardcode credentials in `docker-compose.yml` — always reference the `.env` file.
- Database data must use a named Docker volume, not a bind mount.
- The API service should run `npx knex migrate:latest` as part of its entrypoint/startup before the main server starts.

---

## 🔐 Authentication Pattern

- **Backend:** Custom Express middleware (`authMiddleware.js`) verifies the JWT from the `Authorization: Bearer <token>` header. Protected routes use this middleware.
- **Frontend:** `AuthInterceptor` attaches the stored JWT to every outgoing HTTP request. `AuthGuard` protects routes that require login.
- **Token storage:** localStorage (access token). Refresh token flow can be added later if needed.
- **Do NOT introduce Passport.js or any other auth library.** The existing pattern is intentional.

---

## 📝 Code Conventions

### Backend (Node.js / Express)
- **Module pattern:** Each feature has its own folder with `routes.js`, `controller.js`, `service.js`.
- **Controllers** handle request/response only — no business logic.
- **Services** contain all business logic and Knex queries.
- **Error handling:** Throw custom error classes from `common/errors.js`; the global `errorHandler` middleware catches them.
- **Async routes:** Always use `try/catch` or an async wrapper to avoid unhandled promise rejections.
- **Naming:** camelCase for variables/functions, PascalCase for classes, snake_case for database columns and table names.

### Frontend (Angular)
- **Module-based architecture.** Every feature lives in its own module under `modules/`.
- **Lazy load** feature modules via the router.
- **Services** use `BehaviorSubject` for state — no NgRx.
- **Component generation:** Always use `ng generate component <name> --module=<module> --standalone=false`.
- **Reactive forms** over template-driven forms.
- **Naming:** Follow Angular style guide — `kebab-case` file names, `PascalCase` class names, `camelCase` properties.

---

## 🧪 Testing Strategy

### Backend
- **Framework:** Jest (or Mocha + Chai — pick one, do not mix).
- **Test location:** Co-located `*.test.js` files or a top-level `__tests__/` directory.
- **Coverage target:** Aim for 80%+ on services, 60%+ on controllers.

### Frontend
- **Unit tests:** Jest (Angular CLI default) for components, services, pipes.
- **Naming:** `*.spec.ts` co-located with source files.
- **Coverage target:** 80%+ on services, 60%+ on components.
- **Run tests before committing:** `ng test --watch=false`.

---

## 📓 MISTAKES.md Protocol

The file `docs/MISTAKES.md` must be maintained throughout development:

1. **At the start of every new task**, re-read `docs/MISTAKES.md` to avoid repeating past errors.
2. **Log every mistake** with this format:
   ```
   ### [Date] — Short Title
   - **What happened:** Description of the error/failure
   - **Root cause:** Why it happened
   - **Fix:** What resolved it
   - **Prevention:** How to avoid it in the future
   ```
3. Never delete entries — this is a learning log.

---

## 🚀 Development Workflow Quick Reference

```bash
# Full stack via Docker (recommended)
cp .env.example .env              # Configure once at root
docker-compose up                 # Starts db + api + web

# Backend standalone (for debugging)
cd life-gauge-api
npm install
npx knex migrate:latest            # Uses root .env via config/env.js
npx knex seed:run                  # Seed dev data (optional)
npm run dev                        # Start with nodemon

# Frontend standalone (for debugging)
cd life-gauge-web
npm install
ng serve                           # Default port 4200
```

---

## 📄 Feature Documentation Workflow

After developing any feature, document it by updating/creating the following files. **Every doc file must include a Front Matter header** for navigation ease.

### Front Matter Template

```yaml
---
title: "<Document or Feature Title>"
module: "api | web | general"
date: "YYYY-MM-DD"
status: "completed | in-progress | planned"
related_features: []
---
```

### Required Documentation Updates

| File | Purpose | When to Update |
| ---- | ------- | -------------- |
| `docs/PROJECT_SUMMARY.md` | High-level project overview, current state, module descriptions | After every feature — keep the big picture current |
| `docs/PROJECT_HISTORY.md` | Chronological changelog of features, fixes, and milestones | Append an entry after every feature/fix is completed |
| `docs/API_SPEC.md` | Central registry of all API endpoints (method, path, auth, request/response) | Whenever a new endpoint is created or an existing one changes |
| `docs/BACKEND_SPEC.md` | Important backend details — migrations, Knex config changes, env var additions, DB schema decisions | Whenever migrations are added or backend architecture changes |

### Per-Feature Documentation

For each feature, create **two files**:

1. **`docs/feature/api/FEATURE_NAME.md`** — Backend/API side of the feature
   - Endpoints added (method, path, auth requirement)
   - Request/response shapes
   - Knex migrations created
   - Service logic overview
   - Error codes returned

2. **`docs/feature/web/FEATURE_NAME.md`** — Frontend/Angular side of the feature
   - Components, modules, and services created
   - Route(s) added
   - PrimeNG / AG Grid usage notes
   - State management approach (BehaviorSubject details)
   - Screenshots or UI description

### Example `docs/PROJECT_HISTORY.md` Entry

```markdown
### 2026-03-06 — User Profile Feature
- **Scope:** API + Web
- **API changes:** Added `GET /api/users/profile`, `PUT /api/users/profile`
- **Migration:** `20260306000001_add_avatar_to_users.js`
- **Frontend:** New `ProfileComponent` in `settings` module
- **Docs:** `docs/feature/api/user-profile.md`, `docs/feature/web/user-profile.md`
```

---

## 📌 Reminders

- Always check `docs/DEVELOPMENT_PROCESS.md` before starting any feature.
- Always check `docs/MISTAKES.md` before starting any task.
- **After completing a feature**, follow the **Feature Documentation Workflow** above — update all required docs and create per-feature files.
- If unsure about a design decision, **ask** — do not assume.
- Commit messages should follow conventional commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`.
- Keep PRs small and focused on a single feature or fix.