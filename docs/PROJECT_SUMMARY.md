---
title: "Project Summary"
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

# Life Gauge — Project Summary

## Overview
Life Gauge is a full-stack web application for logging and monitoring personal health reports. Users upload PDF health reports; the app uses `pdf-parse` for text extraction and Google Gemini AI to parse individual test values into a structured format. The dashboard displays latest test values vs. previous values with flag indicators (normal/high/low/abnormal) and reference range bars, grouped by test category. Users can drill into per-test history charts.

## Tech Stack

### Backend
| Component | Technology |
|-----------|-----------|
| Runtime | Node.js 20 LTS |
| Framework | Express 4 |
| Database | MySQL 8 |
| Query builder | Knex.js |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| File upload | multer |
| PDF text extraction | pdf-parse |
| AI integration | Google Gemini via @google/generative-ai |
| API key encryption | Node.js crypto (AES-256-GCM) |
| Validation | express-validator |
| Logging | morgan |
| Environment | dotenv (single root .env) |

### Frontend
| Component | Technology |
|-----------|-----------|
| Framework | Angular (module-based, non-standalone) |
| UI components | PrimeNG 21 (Aura dark theme via providePrimeNG) |
| CSS | Tailwind CSS 3.x |
| Data grid | AG Grid Community |
| Charts | PrimeNG Chart (Chart.js wrapper) |
| HTTP | Angular HttpClient + interceptors |
| State | Services + BehaviorSubject |

## Backend Modules
| Module | Path | Purpose |
|--------|------|---------|
| `auth` | `src/auth/` | Register, login, JWT issue, signup-allowed check |
| `user` | `src/user/` | Profile update, password change, LLM settings |
| `healthtest` | `src/healthtest/` | PDF upload, pdf-parse, Gemini parsing, result storage |
| `dashboard` | `src/dashboard/` | Latest test values per category with previous comparison |
| `admin` | `src/admin/` | App settings, user management, test definitions (admin only) |
| `common` | `src/common/` | JWT helpers, encryption, pagination, error classes, constants |

## Frontend Modules
| Module | Route | Purpose |
|--------|-------|---------|
| `auth` | `/auth/login`, `/auth/register`, `/auth/change-password` | Login, registration, forced password change |
| `dashboard` | `/dashboard` | Test result cards grouped by category, history dialog |
| `health-tests` | `/health-tests` | Report list, upload dialog, report detail dialog |
| `settings` | `/settings` | Profile, password, LLM API key/model config |
| `app-settings` | `/app-settings` | Admin-only: general settings, user management, test definitions |
| `layout` | — | Collapsible sidebar + main content shell |

## Database Tables
| Table | Purpose |
|-------|---------|
| `users` | User accounts with role and force_password_change |
| `user_settings` | Per-user LLM model and encrypted API key |
| `health_reports` | Uploaded PDF metadata + processing status |
| `health_test_results` | Individual parsed test values per report |
| `app_settings` | Application-wide settings (key-value) |
| `test_definitions` | Configurable test keys, categories, display names |

## Key Design Decisions
- Gemini processing is **async fire-and-forget**: upload returns immediately with `processing` status; results arrive asynchronously.
- Reports without an API key are stored as `pending`; user can configure key in Settings then reprocess.
- LLM API keys are encrypted with AES-256-GCM before DB storage; encryption key derived from `JWT_SECRET`.
- Angular uses `ChangeDetectorRef.detectChanges()` in all HTTP subscribe callbacks (OnPush-compatible pattern).
- Single root `.env` file; both backend and Docker read from it.
- PrimeNG 21 uses new theming API (`providePrimeNG` + `@primeuix/themes/aura`) — no legacy CSS imports.
- Tailwind pinned to v3 (v4 breaks Angular build pipeline).

## Current Status
- Full stack complete and functional (2026-03-06)
- Admin role, app settings, user management, test definitions, force password change, nginx reverse proxy (2026-03-08)
- Test definitions enriched with descriptions (111 tests) and category_order; dashboard history dialog shows test descriptions (2026-03-08)
- Docker improvements: MySQL retry loop, production env default, DB_PORT isolation for internal networking (2026-03-09)
- Simplified `.env`: removed `FRONTEND_URL` and `NG_API_BASE_URL`; CORS derived from `NG_PORT`; `NODE_ENV` optional (defaults to production) (2026-03-09)
- Default admin user created via idempotent migration (admin/admin, force_password_change=true) (2026-03-09)
- Angular `fileReplacements` in `angular.json` ensures production builds use `environment.prod.ts` (2026-03-09)
