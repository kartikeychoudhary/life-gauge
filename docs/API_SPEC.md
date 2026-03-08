---
title: "API Specification"
module: "api"
date: "2026-03-06"
status: "completed"
related_features:
  - authentication
  - user-settings
  - health-reports
  - dashboard
---

# API Specification

Base URL: `http://localhost:3000/api`

All protected endpoints require: `Authorization: Bearer <jwt_token>`

Error responses follow: `{ "message": "string", "errors": [] }`

---

## Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | No | Register new user, returns JWT |
| POST | `/auth/login` | No | Login with email/password, returns JWT |

### POST /auth/register
**Request:**
```json
{
  "name": "string (required)",
  "email": "string (required, valid email)",
  "password": "string (required, min 8 chars)"
}
```
**Response 201:**
```json
{
  "token": "string",
  "user": { "id": 1, "name": "John Doe", "email": "john@example.com" }
}
```
**Errors:** `409` email already in use, `422` validation failure

---

### POST /auth/login
**Request:**
```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```
**Response 200:**
```json
{
  "token": "string",
  "user": { "id": 1, "name": "John Doe", "email": "john@example.com" }
}
```
**Errors:** `401` invalid credentials, `422` validation failure

---

## User

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/users/profile` | Yes | Get current user profile |
| PUT | `/users/profile` | Yes | Update name and/or email |
| PUT | `/users/password` | Yes | Change password |

### GET /users/profile
**Response 200:**
```json
{ "id": 1, "name": "John Doe", "email": "john@example.com", "created_at": "2026-03-06T..." }
```

### PUT /users/profile
**Request:**
```json
{ "name": "string (optional)", "email": "string (optional, valid email)" }
```
**Response 200:** Updated user object (same shape as GET /users/profile)
**Errors:** `409` email already in use

### PUT /users/password
**Request:**
```json
{
  "current_password": "string (required)",
  "new_password": "string (required, min 8 chars)"
}
```
**Response 200:** `{ "message": "Password updated" }`
**Errors:** `401` current password incorrect

---

## Settings

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/users/settings` | Yes | Get LLM settings (never returns raw key) |
| PUT | `/users/settings` | Yes | Update LLM model and/or API key |

### GET /users/settings
**Response 200:**
```json
{ "llm_model": "gemini-2.0-flash", "has_api_key": true }
```
Note: `has_api_key` is a boolean; the actual key is never returned.

### PUT /users/settings
**Request:**
```json
{
  "llm_model": "string (optional) — e.g. gemini-2.0-flash",
  "llm_api_key": "string (optional) — raw key, will be encrypted before storage"
}
```
**Response 200:** Same shape as GET /users/settings

---

## Health Reports

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health-reports` | Yes | List reports (paginated) |
| POST | `/health-reports/upload` | Yes | Upload PDF, trigger async Gemini parsing |
| GET | `/health-reports/:id/stream` | `?token=` | SSE stream — emits status until processing completes |
| GET | `/health-reports/:id` | Yes | Get report + all test results |
| DELETE | `/health-reports/:id` | Yes | Delete report, results, and file on disk |
| POST | `/health-reports/:id/reprocess` | Yes | Re-run Gemini on existing raw text |

### GET /health-reports
**Query params:** `page` (default 1), `limit` (default 20)

**Response 200:**
```json
{
  "reports": [
    {
      "id": 1,
      "report_date": "2026-01-15",
      "original_filename": "blood-test.pdf",
      "status": "completed",
      "error_message": null,
      "created_at": "2026-03-06T..."
    }
  ],
  "meta": { "total": 5, "page": 1, "limit": 20, "pages": 1 }
}
```

### POST /health-reports/upload
**Content-Type:** `multipart/form-data`
**Field:** `file` — PDF only, max 20 MB

**Response 201:** Full report object (see GET /health-reports/:id) with `status: "processing"` or `"pending"` (if no API key configured)

### GET /health-reports/:id/stream

Server-Sent Events stream for real-time processing status. Auth via `?token=<jwt>` query param (browser `EventSource` cannot send custom headers).

**Response:** `text/event-stream`

Each event data payload:
```json
{ "status": "processing", "error_message": null }
```

Possible `status` values: `pending`, `processing`, `completed`, `failed`, `not_found`

Stream closes automatically when status reaches `completed`, `failed`, or `not_found`. Poll interval: 2 seconds.

**Errors:** `401` (inline response, stream closes) if token invalid

### GET /health-reports/:id
**Response 200:**
```json
{
  "id": 1,
  "report_date": "2026-01-15",
  "original_filename": "blood-test.pdf",
  "status": "completed",
  "gemini_model_used": "gemini-2.0-flash",
  "error_message": null,
  "created_at": "2026-03-06T...",
  "results": [
    {
      "id": 10,
      "test_key": "tsh_ultra",
      "display_name": "TSH Ultra Sensitive",
      "category": "Hormones & Vitamins",
      "value_numeric": 2.34,
      "value_text": "2.34",
      "unit": "uIU/mL",
      "ref_min": 0.4,
      "ref_max": 4.0,
      "ref_display": "0.40 - 4.00",
      "flag": "normal",
      "report_date": "2026-01-15"
    }
  ]
}
```

### DELETE /health-reports/:id
**Response 204:** No content

### POST /health-reports/:id/reprocess
**Response 200:** Report object with `status: "processing"`
**Errors:** `400` no API key configured

---

## Dashboard

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/dashboard/summary` | Yes | Latest test per key with previous value, grouped by category |
| GET | `/dashboard/test/:key/history` | Yes | All historical values for a test key |

### GET /dashboard/summary
**Response 200:**
```json
[
  {
    "category": "Hormones & Vitamins",
    "tests": [
      {
        "id": 10,
        "test_key": "tsh_ultra",
        "display_name": "TSH Ultra Sensitive",
        "category": "Hormones & Vitamins",
        "value_numeric": 2.34,
        "value_text": "2.34",
        "unit": "uIU/mL",
        "ref_min": 0.4,
        "ref_max": 4.0,
        "ref_display": "0.40 - 4.00",
        "flag": "normal",
        "report_date": "2026-01-15",
        "report_id": 1,
        "previous": {
          "test_key": "tsh_ultra",
          "value_numeric": 2.10,
          "value_text": "2.10",
          "report_date": "2025-10-01",
          "flag": "normal"
        }
      }
    ]
  }
]
```
`previous` is `null` if no prior value exists.

### GET /dashboard/test/:key/history
**Path param:** `:key` — a test_key (e.g. `tsh_ultra`)

**Response 200:**
```json
{
  "history": [
    {
      "id": 10,
      "value_numeric": 2.34,
      "value_text": "2.34",
      "unit": "uIU/mL",
      "flag": "normal",
      "ref_min": 0.4,
      "ref_max": 4.0,
      "ref_display": "0.40 - 4.00",
      "report_date": "2026-01-15",
      "report_id": 1
    }
  ],
  "description": "Thyroid-stimulating hormone secreted by the pituitary..."
}
```
`history` ordered by `report_date ASC`. `description` is from `test_definitions` table (nullable).

---

## Auth (additional)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/auth/signup-allowed` | No | Check if signups are enabled |

### GET /auth/signup-allowed
**Response 200:**
```json
{ "allowed": true }
```

---

## Admin (all endpoints require Auth + Admin role)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/admin/settings` | Admin | Get app settings (key-value map) |
| PUT | `/admin/settings` | Admin | Update a setting |
| GET | `/admin/users` | Admin | List all users |
| POST | `/admin/users` | Admin | Create user (force_password_change=true) |
| PUT | `/admin/users/:id/role` | Admin | Change user role |
| PUT | `/admin/users/:id/reset-password` | Admin | Reset user password |
| DELETE | `/admin/users/:id` | Admin | Delete user and all data |
| GET | `/admin/test-definitions` | Admin | List all test definitions |
| POST | `/admin/test-definitions` | Admin | Create test definition |
| PUT | `/admin/test-definitions/:id` | Admin | Update test definition |
| DELETE | `/admin/test-definitions/:id` | Admin | Delete test definition |

### GET /admin/settings
**Response 200:**
```json
{ "allow_signups": "false" }
```

### PUT /admin/settings
**Request:**
```json
{ "key": "allow_signups", "value": "true" }
```
**Response 200:** Updated settings object

### POST /admin/users
**Request:**
```json
{
  "name": "string (required)",
  "email": "string (required)",
  "password": "string (required, min 8)",
  "role": "user | admin (optional, default: user)"
}
```
**Response 201:** User object
**Note:** Created users have `force_password_change: true`

### PUT /admin/users/:id/role
**Request:**
```json
{ "role": "admin" }
```
**Response 200:** Updated user object

### PUT /admin/users/:id/reset-password
**Request:**
```json
{ "password": "string (required, min 8)" }
```
**Response 200:** `{ "message": "Password reset successfully" }`
**Note:** Sets `force_password_change: true` on the user

### DELETE /admin/users/:id
**Response 204:** No content
**Errors:** `409` cannot delete own account

### POST /admin/test-definitions
**Request:**
```json
{
  "test_key": "string (required, lowercase snake_case)",
  "display_name": "string (required)",
  "category": "string (required)",
  "unit": "string (optional)",
  "default_ref_min": "number (optional)",
  "default_ref_max": "number (optional)",
  "is_active": "boolean (optional, default true)"
}
```
**Response 201:** Test definition object

### PUT /admin/test-definitions/:id
**Request:** Same fields as POST (all optional)
**Response 200:** Updated test definition object

### DELETE /admin/test-definitions/:id
**Response 204:** No content
