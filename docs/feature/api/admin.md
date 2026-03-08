---
title: "Admin API Feature"
module: "api"
date: "2026-03-08"
status: "completed"
related_features:
  - authentication
  - user-settings
---

# Admin API Feature

## Overview
Admin-only API module for managing application settings, users, and test definitions. All endpoints require JWT auth + admin role.

## Middleware
- `adminMiddleware.js` — queries DB for `users.role` where `id = req.user.id`; returns 403 if not `admin`

## Endpoints

### App Settings
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/settings` | Returns all settings as key-value object |
| PUT | `/api/admin/settings` | Updates a single setting by key |

### User Management
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/users` | List all users with role, force_password_change |
| POST | `/api/admin/users` | Create user (force_password_change=true) |
| PUT | `/api/admin/users/:id/role` | Change role (cannot change own) |
| PUT | `/api/admin/users/:id/reset-password` | Reset password (sets force_password_change) |
| DELETE | `/api/admin/users/:id` | Delete user + all data (cannot delete self) |

### Test Definitions
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/test-definitions` | List all, ordered by sort_order |
| POST | `/api/admin/test-definitions` | Create new test definition |
| PUT | `/api/admin/test-definitions/:id` | Update test definition |
| DELETE | `/api/admin/test-definitions/:id` | Delete test definition |

## Migrations
- `20260308000001` — adds `role`, `force_password_change` to `users`
- `20260308000002` — creates `app_settings` table with default `allow_signups=false`
- `20260308000003` — creates `test_definitions` table
- `20260308000004` — data migration seeding test_definitions from hardcoded constants

## Signup Control
- `POST /api/auth/register` checks `app_settings.allow_signups`; returns 403 if `false`
- `GET /api/auth/signup-allowed` — public endpoint for frontend to check

## Force Password Change
- Admin-created users and reset-password users get `force_password_change=true`
- `PUT /api/users/password` clears the flag on successful change
- Login response includes the flag so frontend can redirect

## Gemini Integration
- `processWithGemini()` now loads active test definitions from DB
- Prompt includes all active test keys + display name hints
- Category mapping uses DB instead of hardcoded constants

## Error Codes
| Code | Scenario |
|------|----------|
| 403 | Not admin / signups disabled |
| 409 | Email conflict / cannot delete self / cannot change own role / duplicate test key |
| 404 | User or test definition not found |
| 422 | Validation failure |
