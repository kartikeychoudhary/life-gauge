---
title: "App Settings Frontend Feature"
module: "web"
date: "2026-03-08"
status: "completed"
related_features:
  - authentication
  - admin
---

# App Settings Frontend Feature

## Overview
Admin-only module for managing application settings, users, and test definitions. Only visible to users with `role=admin`.

## Components & Modules

### AppSettingsModule (`modules/app-settings/`)
- `AppSettingsPage` — main component with PrimeNG Tabs (3 tabs)

### Auth Module Changes
- `ChangePassword` component at `/auth/change-password` — forced password change form

### Core Additions
- `AdminService` — HTTP client for all `/api/admin/*` endpoints
- `AdminGuard` — checks `user.role === 'admin'`, redirects to dashboard otherwise
- `admin.model.ts` — `AppSettings`, `AdminUser`, `TestDefinition` interfaces
- `User` model extended with optional `role` and `force_password_change`

## Routes
| Path | Component | Guard |
|------|-----------|-------|
| `/app-settings` | `AppSettingsPage` | `AuthGuard` + `AdminGuard` |
| `/auth/change-password` | `ChangePassword` | None (needs JWT for API call) |

## Tab: General
- Toggle switch for `allow_signups` setting
- Uses `p-toggleswitch` with `ngModel` binding
- Saves immediately on toggle via `AdminService.updateAppSetting()`

## Tab: User Management
- PrimeNG Table listing all users (name, email, role, force_password_change, created_at)
- Actions per user: toggle role, reset password, delete
- Add User dialog: name, email, password, role selection
- Reset Password dialog: new password input
- Delete confirmation via `p-confirmDialog`

## Tab: Test Definitions
- Paginated PrimeNG Table (20 per page) with sortable columns
- Shows: test_key, display_name, category, unit, ref range, active status
- Add Test dialog: test_key (snake_case pattern), display_name, category (select), unit, ref min/max
- Edit Test dialog: all fields + is_active toggle
- Delete confirmation via `p-confirmDialog`

## Force Password Change Flow
1. Login API returns `force_password_change` flag in user object
2. `Login` component checks flag; if true, navigates to `/auth/change-password`
3. `AuthGuard` also checks flag; redirects to change-password for any protected route access
4. `ChangePassword` component: current password + new password + confirm password form
5. On success: calls `authService.updateCurrentUser()` to clear flag in localStorage, navigates to dashboard

## Signup Control (Login/Register)
1. `Login` component calls `authService.checkSignupAllowed()` on init
2. Register link only shown if `signupAllowed = true`
3. `Register` component also checks on init; redirects to login with warning toast if disabled

## Sidebar
- `Sidebar` component now subscribes to `authService.currentUser$`
- "App Settings" nav item has `adminOnly: true` flag
- Filtered out for non-admin users

## PrimeNG Components Used
- `p-tabs`, `p-tablist`, `p-tab`, `p-tabpanels`, `p-tabpanel` (TabsModule)
- `p-toggleswitch` (ToggleSwitchModule)
- `p-table` with sorting and pagination
- `p-dialog` for add/edit forms
- `p-select` for category/role selection
- `p-tag` for role and status badges
- `p-button` with text mode for action icons
- `p-password` for password inputs
- `p-confirmDialog` for delete confirmations
