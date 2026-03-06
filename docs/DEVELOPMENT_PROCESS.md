---
title: "Development Process"
module: "general"
date: "2026-03-06"
status: "completed"
related_features: []
---

# Development Process

Follow these steps for every feature or fix.

## 1. Pre-task Checklist
- [ ] Re-read `docs/MISTAKES.md`
- [ ] Re-read `CLAUDE.md` critical rules
- [ ] Understand the existing code before modifying

## 2. Backend Feature Steps
1. Create Knex migration: `cd life-gauge-api && npx knex migrate:make <name>`
2. Write `up` and `down` in the migration
3. Run migration: `npx knex migrate:latest`
4. Create/extend service file — all business logic + Knex queries here
5. Create/extend controller file — request/response only, no business logic
6. Register routes in `routes.js` and mount in `app.js`
7. Protect routes with `authMiddleware` where needed

## 3. Frontend Feature Steps
1. Generate module: `ng generate module modules/<name> --routing`
2. Generate components: `ng generate component modules/<name>/components/<component> --module=modules/<name>/<name>.module --standalone=false`
3. Register module in `AppRoutingModule` with lazy loading
4. Build service with `BehaviorSubject` state
5. Use PrimeNG components + Tailwind CSS for styling
6. Use Reactive Forms (not template-driven)

## 4. Post-task Documentation
- Update `docs/PROJECT_SUMMARY.md`
- Append to `docs/PROJECT_HISTORY.md`
- Update `docs/API_SPEC.md` (if API changed)
- Update `docs/BACKEND_SPEC.md` (if DB/backend changed)
- Create `docs/feature/api/<FEATURE>.md`
- Create `docs/feature/web/<FEATURE>.md`

## 5. Commit
- Use conventional commit format: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`
- Keep commits focused on one feature/fix
