---
title: "Layout Shell — Web"
module: "web"
date: "2026-03-06"
status: "completed"
related_features:
  - authentication
  - dashboard
---

# Layout Shell — Web

Provides the collapsible sidebar + main content shell that wraps all authenticated pages.

## Module

`src/app/layout/layout.module.ts`

Not lazy-loaded — declared in `AppModule` and used directly in the router as a wrapper component.

## Components

### MainLayoutComponent (`layout/components/main-layout/`)

Selector: `app-main-layout`

Top-level shell component that manages sidebar state and provides the two-column layout.

**State:**
```ts
sidebarCollapsed = false;   // desktop sidebar toggle
mobileSidebarOpen = false;  // mobile overlay toggle
```

**Template structure:**
```
<div class="flex h-screen">
  <app-sidebar [collapsed]="sidebarCollapsed" [mobileOpen]="mobileSidebarOpen"
    (toggleCollapse)="sidebarCollapsed = !sidebarCollapsed"
    (closeMobile)="mobileSidebarOpen = false" />
  <div class="flex-1 overflow-auto">
    <!-- top bar with hamburger for mobile -->
    <router-outlet />
  </div>
</div>
```

Used in routing as the parent route component wrapping all protected feature routes.

---

### SidebarComponent (`layout/components/sidebar/`)

Selector: `app-sidebar`

**Inputs:**
- `@Input() collapsed: boolean` — desktop collapsed state (w-16 icon-only mode)
- `@Input() mobileOpen: boolean` — mobile overlay visibility

**Outputs:**
- `@Output() toggleCollapse` — emits when desktop toggle button clicked
- `@Output() closeMobile` — emits when mobile overlay backdrop clicked

**Layout behavior:**
- **Desktop collapsed (`collapsed=false`):** `w-64` — shows icon + label for each nav item
- **Desktop expanded icon-only (`collapsed=true`):** `w-16` — shows icon only, label hidden
- **Mobile:** `fixed` position overlay, visible when `mobileOpen=true`; backdrop click closes it
- Transitions animated with Tailwind `transition-all duration-200`

**Navigation items:**

| Label | Route | Icon |
|-------|-------|------|
| Dashboard | `/dashboard` | `pi pi-home` |
| Health Tests | `/health-tests` | `pi pi-file-pdf` |
| Settings | `/settings` | `pi pi-cog` |

Active route highlighted via `[routerLinkActive]="'bg-slate-700 text-white'"`.

**Logout button:** Calls `AuthService.logout()`, which clears session and navigates to `/auth/login`.

---

## Routing Setup

```ts
// app-routing-module.ts
{
  path: '',
  component: MainLayoutComponent,
  canActivate: [AuthGuard],
  children: [
    { path: 'dashboard',    loadChildren: () => DashboardModule },
    { path: 'health-tests', loadChildren: () => HealthTestsModule },
    { path: 'settings',     loadChildren: () => SettingsModule },
    { path: '',             redirectTo: 'dashboard', pathMatch: 'full' },
  ]
}
```

All child routes are lazy-loaded and protected by `AuthGuard` on the parent.

---

## PrimeNG Components Used

| Component | Usage |
|-----------|-------|
| `p-button` | Sidebar collapse toggle, logout button |
| `pTooltip` | Tooltips on icon-only sidebar items when collapsed |

---

## Tailwind Classes Used

- `w-64` / `w-16` — sidebar width states
- `h-screen overflow-hidden` — full-height layout
- `transition-all duration-200` — sidebar animation
- `fixed inset-0 z-40 bg-black/50` — mobile overlay backdrop
- `bg-slate-800` / `bg-slate-900` — sidebar and content backgrounds
