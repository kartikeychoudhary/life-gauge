---
title: "Authentication API"
module: "api"
date: "2026-03-06"
status: "completed"
related_features:
  - user-settings
---

# Authentication API

Handles user registration and login. Issues JWT tokens used for all protected endpoints.

## Files

| File | Purpose |
|------|---------|
| `src/auth/auth.routes.js` | Express router: POST /register, POST /login |
| `src/auth/auth.controller.js` | Request/response handling |
| `src/auth/auth.service.js` | Business logic, DB queries |
| `src/common/jwt.js` | `sign(payload)` and `verify(token)` helpers |
| `src/middleware/authMiddleware.js` | JWT verification middleware for protected routes |

## Endpoints

### POST /api/auth/register

Registers a new user. Also inserts a default `user_settings` row for the new user.

**Validation (express-validator):**
- `name`: required, non-empty
- `email`: valid email, normalized
- `password`: min 8 characters

**Service logic:**
1. Check for existing email → `ConflictError` (409) if found
2. Hash password with `bcrypt.hash(password, 12)`
3. Insert into `users`
4. Insert into `user_settings` with `user_id` (empty defaults)
5. Sign JWT with `{ id, email }` payload
6. Return `{ token, user }` (password_hash excluded)

**Response 201:**
```json
{
  "token": "<jwt>",
  "user": { "id": 1, "name": "John Doe", "email": "john@example.com" }
}
```

---

### POST /api/auth/login

Authenticates existing user.

**Validation:**
- `email`: valid email
- `password`: non-empty

**Service logic:**
1. Lookup user by email → `UnauthorizedError` (401) if not found
2. `bcrypt.compare(password, password_hash)` → `UnauthorizedError` if mismatch
3. Sign JWT with `{ id, email }` payload
4. Return `{ token, user }`

**Response 200:**
```json
{
  "token": "<jwt>",
  "user": { "id": 1, "name": "John Doe", "email": "john@example.com" }
}
```

---

## JWT Middleware (`authMiddleware.js`)

Applied to all protected routes via `router.use(auth)`.

1. Reads `Authorization: Bearer <token>` header
2. Verifies token with `jwt.verify(token, JWT_SECRET)`
3. Attaches `req.user = { id, email }` on success
4. Returns 401 if missing or invalid

---

## Error Codes

| Code | Scenario |
|------|---------|
| 409 | Email already in use (register) |
| 401 | Invalid credentials (login) |
| 422 | Validation failure |
