---
title: "Authentication — Web"
module: "web"
date: "2026-03-06"
status: "completed"
related_features:
  - layout
  - settings
---

# Authentication — Web

Login and registration UI plus the client-side JWT session management infrastructure.

## Module

`src/app/modules/auth/auth.module.ts`

Lazy-loaded at route `/auth`. Declares `LoginComponent` and `RegisterComponent`.

## Components

### LoginComponent (`modules/auth/components/login/`)

Selector: `app-login`

**Template:** Full-page centered card with email + password fields (`pInputText`, `p-password`), submit button with loading spinner, "Don't have an account?" link to register.

**Form (reactive):**
```ts
form = fb.group({
  email: ['', [Validators.required, Validators.email]],
  password: ['', Validators.required],
});
```

**On submit:** Calls `AuthService.login()`. On success, navigates to `/dashboard`. On error, shows `MessageService` error toast with server message or fallback.

---

### RegisterComponent (`modules/auth/components/register/`)

Selector: `app-register`

**Template:** Full-page card with name, email, password fields, submit button, link to login.

**Form (reactive):**
```ts
form = fb.group({
  name:     ['', [Validators.required, Validators.minLength(2)]],
  email:    ['', [Validators.required, Validators.email]],
  password: ['', [Validators.required, Validators.minLength(8)]],
});
```

**On submit:** Calls `AuthService.register()`. On success, navigates to `/dashboard`. On error, shows error toast.

---

## Core Services & Guards

### AuthService (`core/services/auth.service.ts`)

`providedIn: 'root'`

| Method/Property | Description |
|----------------|-------------|
| `currentUser$` | `Observable<User \| null>` — BehaviorSubject stream |
| `getCurrentUser()` | Synchronous snapshot of current user |
| `isLoggedIn` | `!!localStorage.getItem('lg_token')` |
| `getToken()` | Returns raw JWT string |
| `login(payload)` | POST to `/auth/login`, calls `saveSession()` via tap |
| `register(payload)` | POST to `/auth/register`, calls `saveSession()` via tap |
| `logout()` | Clears localStorage, emits null to BehaviorSubject, navigates to `/auth/login` |
| `updateCurrentUser(user)` | Called by `UserService` after profile update |

**Session storage:**
- `lg_token` → JWT string
- `lg_user` → JSON-serialized `User` object

Both stored in `localStorage`. User object is rehydrated on service construction via `loadUser()`.

---

### AuthGuard (`core/guards/auth.guard.ts`)

Implements `CanActivate`. Checks `AuthService.isLoggedIn`. If false, redirects to `/auth/login` and returns `false`.

Applied to all routes inside `MainLayoutComponent` via the routing module.

---

### AuthInterceptor (`core/interceptors/auth.interceptor.ts`)

Implements `HttpInterceptor`. Reads token via `AuthService.getToken()`. If present, clones the request and adds:
```
Authorization: Bearer <token>
```
Registered in `CoreModule` as `HTTP_INTERCEPTORS`.

---

### ErrorInterceptor (`core/interceptors/error.interceptor.ts`)

Global HTTP error handling interceptor. Catches 401 responses and calls `AuthService.logout()` to clear session and redirect to login. Registered alongside `AuthInterceptor`.

---

## Routing

```ts
// app-routing-module.ts
{ path: 'auth', loadChildren: () => import('./modules/auth/auth.module').then(m => m.AuthModule) }

// auth-routing-module.ts
{ path: 'login',    component: LoginComponent }
{ path: 'register', component: RegisterComponent }
{ path: '',         redirectTo: 'login', pathMatch: 'full' }
```

Unauthenticated root redirect: `{ path: '', redirectTo: 'dashboard', pathMatch: 'full' }` — `AuthGuard` intercepts and sends to `/auth/login` if not logged in.

---

## PrimeNG Components Used

| Component | Usage |
|-----------|-------|
| `p-password` | Password input with toggle mask |
| `pInputText` | Email and name inputs |
| `p-button` | Submit button with `[loading]` spinner |
| `p-toast` | Error and success notifications (rendered in root `app.html`) |
