---
title: "User Profile & Settings API"
module: "api"
date: "2026-03-06"
status: "completed"
related_features:
  - authentication
  - health-reports
---

# User Profile & Settings API

Manages the authenticated user's profile (name/email), password, and LLM configuration (Gemini model + encrypted API key).

## Files

| File | Purpose |
|------|---------|
| `src/user/user.routes.js` | Express router — all routes use `authMiddleware` |
| `src/user/user.controller.js` | Request/response handling |
| `src/user/user.service.js` | Business logic, Knex queries, encryption calls |
| `src/common/encrypt.js` | AES-256-GCM encrypt/decrypt helpers |

## Endpoints

All endpoints require `Authorization: Bearer <token>`.

---

### GET /api/users/profile

Returns the current user's profile.

**Response 200:**
```json
{ "id": 1, "name": "John Doe", "email": "john@example.com", "created_at": "2026-03-06T..." }
```

---

### PUT /api/users/profile

Updates name and/or email. Checks email uniqueness before updating. After successful update, returns the refreshed profile.

**Request:**
```json
{ "name": "Jane Doe", "email": "jane@example.com" }
```
Both fields are optional. Omitting a field leaves it unchanged.

**Response 200:** Updated user profile object

**Errors:** `409` if new email is already used by another account

---

### PUT /api/users/password

Changes the user's password after verifying the current one.

**Request:**
```json
{ "current_password": "oldpass123", "new_password": "newpass456" }
```

**Service logic:**
1. Fetch user record
2. `bcrypt.compare(current_password, password_hash)` → `UnauthorizedError` (401) if wrong
3. `bcrypt.hash(new_password, 12)` and update `users.password_hash`

**Response 200:** `{ "message": "Password updated" }`

**Errors:** `401` current password incorrect

---

### GET /api/users/settings

Returns LLM configuration. The raw API key is **never** returned.

**Response 200:**
```json
{ "llm_model": "gemini-2.0-flash", "has_api_key": true }
```

`has_api_key` is `true` when `llm_api_key_encrypted` column is non-null.

---

### PUT /api/users/settings

Updates LLM model selection and/or API key.

**Request:**
```json
{
  "llm_model": "gemini-2.0-flash",
  "llm_api_key": "AIzaSy..."
}
```
Both fields are optional. Omitting `llm_api_key` or passing an empty string leaves the stored key unchanged.

**Service logic (API key):**
1. If `llm_api_key` is provided and non-empty:
   - Call `encrypt(llm_api_key)` → `{ encrypted, iv, tag }`
   - Store all three fields in `user_settings`
2. Upsert `user_settings` row (update if exists, insert if not)

**Response 200:**
```json
{ "llm_model": "gemini-2.0-flash", "has_api_key": true }
```

---

## Encryption Details (`common/encrypt.js`)

| Property | Value |
|----------|-------|
| Algorithm | AES-256-GCM |
| Key | `SHA-256(JWT_SECRET)` → 32-byte Buffer |
| IV | 12 random bytes, generated per encrypt call |
| Auth tag | 16-byte GCM tag |
| Storage | Three columns: `llm_api_key_encrypted` (hex), `llm_api_key_iv` (hex), `llm_api_key_tag` (hex) |

The `getDecryptedApiKey(userId)` function is used internally by `healthtest.service.js` to retrieve the key for Gemini calls. It is not exposed via any API endpoint.

---

## Error Codes

| Code | Scenario |
|------|---------|
| 401 | Wrong current password |
| 409 | Email already in use |
| 422 | Validation failure |
