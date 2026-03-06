---
title: "Settings — Web"
module: "web"
date: "2026-03-07"
status: "completed"
related_features:
  - authentication
  - health-tests
  - layout
---

# Settings — Web

User profile editing, password changing, and LLM (Gemini) API key + model configuration.

## Module

`src/app/modules/settings/settings.module.ts`

Lazy-loaded at route `/settings`.

## Component

### SettingsComponent (`modules/settings/components/settings/`)

Selector: `app-settings`

Single-page component with three independent reactive form sections.

---

## Form: Profile

**Fields:**
```ts
profileForm = fb.group({
  name:  [user?.name  || '', [Validators.required, Validators.minLength(2)]],
  email: [user?.email || '', [Validators.required, Validators.email]],
});
```

Initial values pre-populated from `AuthService.getCurrentUser()` at construction time.

**Submit (`saveProfile()`):**
- Guards on `profileForm.invalid`
- Calls `UserService.updateProfile(profileForm.value)`
- `UserService.updateProfile` has a `tap` that calls `AuthService.updateCurrentUser(user)` to keep the BehaviorSubject in sync
- On success: shows `MessageService` success toast, calls `cdr.detectChanges()`
- On error: shows error toast with server message or fallback

**Validation messages:**
- Name: "Name required (min 2 chars)" when invalid + touched
- Email: "Valid email required" when invalid + touched

---

## Form: Change Password

**Fields:**
```ts
passwordForm = fb.group({
  current_password: ['', Validators.required],
  new_password:     ['', [Validators.required, Validators.minLength(8)]],
});
```

**Submit (`savePassword()`):**
- Guards on `passwordForm.invalid`
- Calls `UserService.changePassword(passwordForm.value)`
- On success: resets form, shows success toast, calls `cdr.detectChanges()`
- On error: shows error toast with `err?.error?.message || 'Change failed'`

**Validation message:**
- New password: "Min 8 characters" when invalid + touched

**PrimeNG:** Both fields use `p-password` with `[feedback]="false"` and `[toggleMask]="true"`.

---

## Form: LLM Configuration

**State:**
```ts
hasApiKey = false;        // loaded from GET /users/settings
showApiKeyField = false;  // toggled by "Change key" / "Add key" button
useCustomModel = false;   // toggled by "Enter custom model" / "Use preset" link
llmModelOptions = [
  { label: 'Gemini 2.0 Flash', value: 'gemini-2.0-flash' },
  { label: 'Gemini 1.5 Pro',   value: 'gemini-1.5-pro' },
  { label: 'Gemini 1.5 Flash', value: 'gemini-1.5-flash' },
];
```

**Custom model input (added 2026-03-07):**
- A toggle link "Enter custom model" / "Use preset" appears in the model field label row
- When `useCustomModel = false`: renders `p-select` with the three preset options
- When `useCustomModel = true`: renders a `pInputText` bound to `llm_model` with placeholder `e.g. gemini-2.5-pro-exp-03-25`
- Helper text shown: "Any valid Gemini model identifier from Google AI Studio"
- `ngOnInit` auto-detects: if the saved `llm_model` doesn't match any preset option, `useCustomModel` is set to `true`
- `toggleCustomModel()`: flips the flag; when switching back to preset, resets `llm_model` to `gemini-2.0-flash`
- `saveLlm()` is unchanged — `llm_model` control always holds the final value regardless of input mode

**Fields:**
```ts
llmForm = fb.group({
  llm_model:   ['gemini-2.0-flash'],
  llm_api_key: [''],
});
```

**`ngOnInit()`:** Calls `UserService.getSettings()`. Patches `llm_model` and sets `hasApiKey`. Calls `cdr.detectChanges()`.

**API key UI:**
- When `hasApiKey && !showApiKeyField`: shows `p-tag` with `value="Configured"` and `severity="success"`
- Button label: `showApiKeyField ? 'Cancel' : (hasApiKey ? 'Change key' : 'Add key')`
- `*ngIf="showApiKeyField"`: reveals `p-password` input for the key
- `*ngIf="!showApiKeyField && !hasApiKey"`: shows yellow warning banner ("No API key configured. Reports will remain in pending state.")

**Submit (`saveLlm()`):**
- Always sends `llm_model`
- Only sends `llm_api_key` if `showApiKeyField === true && llmForm.value.llm_api_key` is non-empty
- On success: updates `hasApiKey`, resets `showApiKeyField = false`, clears key field, shows success toast, calls `cdr.detectChanges()`
- On error: shows error toast

---

## Template Structure

```
<div class="max-w-2xl space-y-8">
  <!-- Profile Card -->
  <div class="bg-slate-900 border border-slate-700/50 rounded-xl p-6 space-y-5">
    <h2><i class="pi pi-user"> Profile</h2>
    <form [formGroup]="profileForm" (ngSubmit)="saveProfile()">
      ...fields...
      <div class="pt-4 border-t border-slate-700/50">
        <p-button type="submit" label="Save Profile" icon="pi pi-save" [loading] [disabled] />
      </div>
    </form>
  </div>

  <!-- Password Card -->
  <div class="bg-slate-900 ...">
    <h2><i class="pi pi-lock"> Change Password</h2>
    <form [formGroup]="passwordForm" (ngSubmit)="savePassword()">
      ...
      <div class="pt-4 border-t border-slate-700/50">
        <p-button type="submit" label="Change Password" ... />
      </div>
    </form>
  </div>

  <!-- LLM Config Card -->
  <div class="bg-slate-900 ...">
    <h2><i class="pi pi-microchip-ai"> AI / LLM Configuration</h2>
    <form [formGroup]="llmForm" (ngSubmit)="saveLlm()">
      <p-select for model .../>
      ...key toggle UI...
      <div class="pt-4 border-t border-slate-700/50">
        <p-button type="submit" label="Save LLM Settings" ... />
      </div>
    </form>
  </div>
</div>
```

Each submit button is separated from the last field by `pt-4 border-t border-slate-700/50` for visual separation.

---

## Services

### UserService (`core/services/user.service.ts`)

`providedIn: 'root'`

| Method | Endpoint | Returns |
|--------|----------|---------|
| `getProfile()` | GET `/users/profile` | `Observable<User>` |
| `updateProfile(data)` | PUT `/users/profile` | `Observable<User>` — has `tap(user => authService.updateCurrentUser(user))` |
| `changePassword(data)` | PUT `/users/password` | `Observable<{ message: string }>` |
| `getSettings()` | GET `/users/settings` | `Observable<UserSettings>` |
| `updateSettings(data)` | PUT `/users/settings` | `Observable<UserSettings>` |

---

## Models

```ts
interface UserSettings {
  llm_model: string;
  has_api_key: boolean;
}
```

---

## PrimeNG Components Used

| Component | Usage |
|-----------|-------|
| `pInputText` | Name and email fields |
| `p-password` | Current/new password and API key fields |
| `p-select` | Gemini model dropdown |
| `p-tag` | "Configured" API key indicator |
| `p-button` | All three form submit buttons |

---

## Change Detection

`ChangeDetectorRef` injected and `detectChanges()` called after:
- `getSettings()` response
- `saveProfile()` success/error
- `savePassword()` success/error
- `saveLlm()` success/error
